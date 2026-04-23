"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { TrendFeedItem } from "@/lib/trends/query";
import { htCopy } from "@/lib/i18n/ht";

type ReactionKey = "sa_raz" | "sa_komik" | "sa_enteresan";

type ReactionTotals = {
  saRaz: number;
  saKomik: number;
  saEnteresan: number;
  totalVotes: number;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sentimentBadge(sentiment: TrendFeedItem["sentiment"]) {
  if (sentiment === "positive") {
    return "bg-emerald-400/20 text-emerald-200 border-emerald-400/30";
  }
  if (sentiment === "negative") {
    return "bg-rose-400/20 text-rose-200 border-rose-400/30";
  }
  return "bg-slate-400/20 text-slate-200 border-slate-400/30";
}

function sentimentLabel(sentiment: TrendFeedItem["sentiment"]) {
  if (sentiment === "positive") {
    return "pozitif";
  }
  if (sentiment === "negative") {
    return "negatif";
  }
  return "net";
}

function classifyMediaAspect(input: { embedUrl?: string; videoUrl?: string; sourceUrl?: string }) {
  const sourceBlob = `${input.videoUrl ?? ""} ${input.sourceUrl ?? ""}`.toLowerCase();
  if (input.embedUrl) {
    return "landscape";
  }
  if (sourceBlob.includes("shorts") || sourceBlob.includes("tiktok") || sourceBlob.includes("reel")) {
    return "portrait";
  }
  if (input.videoUrl) {
    return "landscape";
  }
  return "fallback";
}

function getOrCreateVoterId() {
  const key = "zra:voter-id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `anon-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function getReactionBreakdown(totals: ReactionTotals) {
  const denom = Math.max(1, totals.totalVotes);
  return {
    sa_raz: Math.round((totals.saRaz / denom) * 100),
    sa_komik: Math.round((totals.saKomik / denom) * 100),
    sa_enteresan: Math.round((totals.saEnteresan / denom) * 100),
  };
}

function reactionPercentForKey(
  key: ReactionKey,
  breakdown: ReturnType<typeof getReactionBreakdown>,
) {
  if (key === "sa_raz") {
    return breakdown.sa_raz;
  }
  if (key === "sa_komik") {
    return breakdown.sa_komik;
  }
  return breakdown.sa_enteresan;
}

function toLocalReactionStorage(clusterId: string): ReactionTotals | null {
  const raw = window.localStorage.getItem(`zra:reaction:totals:${clusterId}`);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ReactionTotals;
    if (
      typeof parsed.saRaz === "number" &&
      typeof parsed.saKomik === "number" &&
      typeof parsed.saEnteresan === "number" &&
      typeof parsed.totalVotes === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed local cache
  }
  return null;
}

export function TrendCard({ trend }: { trend: TrendFeedItem }) {
  const articleRef = useRef<HTMLElement | null>(null);
  const videoSource =
    trend.topSources.find((source) => source.embedUrl || source.videoUrl) ?? null;
  const imageSource = trend.topSources.find((source) => source.imageUrl) ?? null;
  const mediaAspect = classifyMediaAspect({
    embedUrl: videoSource?.embedUrl,
    videoUrl: videoSource?.videoUrl,
    sourceUrl: videoSource?.sourceUrl ?? imageSource?.sourceUrl,
  });

  const mediaFrameClass =
    mediaAspect === "portrait"
      ? "mx-auto aspect-[9/16] w-full max-w-[360px]"
      : mediaAspect === "landscape"
        ? "aspect-video w-full"
        : "mx-auto aspect-[4/5] w-full max-w-[420px]";

  const [isMediaActive, setIsMediaActive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [viewCount, setViewCount] = useState(trend.viewCount);
  const [selectedReaction, setSelectedReaction] = useState<ReactionKey | null>(null);
  const [reactionTotals, setReactionTotals] = useState<ReactionTotals>(trend.reactions);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<ReactionKey | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const reactionAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playStartedAtRef = useRef<number | null>(null);
  const embedPlayTrackedRef = useRef(false);

  useEffect(() => {
    const node = articleRef.current;
    if (!node || trend.clusterId.startsWith("fallback-")) {
      return;
    }

    const viewKey = `zra:viewed:${trend.clusterId}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(viewKey)) {
      return;
    }

    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        fired = true;
        observer.disconnect();

        if (typeof window !== "undefined") {
          window.localStorage.setItem(viewKey, "1");
        }

        fetch(`/api/cluster/${trend.clusterId}/view`, {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        })
          .then(async (response) => {
            if (!response.ok) {
              setViewCount((current) => current + 1);
              return;
            }
            const payload = (await response.json()) as { totalViews?: number };
            if (typeof payload.totalViews === "number") {
              setViewCount(payload.totalViews);
              return;
            }
            setViewCount((current) => current + 1);
          })
          .catch(() => {
            setViewCount((current) => current + 1);
          });
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [trend.clusterId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`zra:reaction:${trend.clusterId}`);
    if (stored === "sa_raz" || stored === "sa_komik" || stored === "sa_enteresan") {
      setSelectedReaction(stored);
    }
    const localTotals = toLocalReactionStorage(trend.clusterId);
    if (localTotals) {
      setReactionTotals(localTotals);
    }
  }, [trend.clusterId]);

  useEffect(() => {
    return () => {
      if (reactionAnimTimeoutRef.current) {
        clearTimeout(reactionAnimTimeoutRef.current);
      }
    };
  }, []);

  const embedUrl = useMemo(() => {
    if (!videoSource?.embedUrl) {
      return null;
    }
    try {
      const url = new URL(videoSource.embedUrl);
      url.searchParams.set("autoplay", isMediaActive ? "1" : "0");
      url.searchParams.set("mute", isMuted ? "1" : "0");
      url.searchParams.set("playsinline", "1");
      url.searchParams.set("controls", "1");
      url.searchParams.set("rel", "0");
      url.searchParams.set("modestbranding", "1");
      url.searchParams.set("loop", "1");
      return url.toString();
    } catch {
      return videoSource.embedUrl;
    }
  }, [videoSource?.embedUrl, isMediaActive, isMuted]);

  const reactionBreakdown = useMemo(
    () => getReactionBreakdown(reactionTotals),
    [reactionTotals],
  );

  async function reportPlaySignal(input: { plays?: number; durationSeconds?: number }) {
    if (!UUID_REGEX.test(trend.clusterId)) {
      return;
    }
    try {
      await fetch(`/api/cluster/${trend.clusterId}/play`, {
        method: "POST",
        cache: "no-store",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch {
      // Engagement tracking should never block the user.
    }
  }

  async function submitReaction(nextReaction: ReactionKey) {
    if (isSubmittingReaction) {
      return;
    }
    setIsSubmittingReaction(true);
    const previousReaction = selectedReaction;
    const previousTotals = reactionTotals;

    const optimistic: ReactionTotals = { ...reactionTotals };
    if (!previousReaction) {
      optimistic.totalVotes += 1;
    } else if (previousReaction === "sa_raz") {
      optimistic.saRaz = Math.max(0, optimistic.saRaz - 1);
    } else if (previousReaction === "sa_komik") {
      optimistic.saKomik = Math.max(0, optimistic.saKomik - 1);
    } else {
      optimistic.saEnteresan = Math.max(0, optimistic.saEnteresan - 1);
    }
    if (nextReaction === "sa_raz") {
      optimistic.saRaz += 1;
    } else if (nextReaction === "sa_komik") {
      optimistic.saKomik += 1;
    } else {
      optimistic.saEnteresan += 1;
    }

    setSelectedReaction(nextReaction);
    setReactionTotals(optimistic);
    window.localStorage.setItem(`zra:reaction:${trend.clusterId}`, nextReaction);
    window.localStorage.setItem(`zra:reaction:totals:${trend.clusterId}`, JSON.stringify(optimistic));
    setAnimatingReaction(nextReaction);
    if (reactionAnimTimeoutRef.current) {
      clearTimeout(reactionAnimTimeoutRef.current);
    }
    reactionAnimTimeoutRef.current = setTimeout(() => {
      setAnimatingReaction(null);
    }, 750);

    const canSyncToApi = UUID_REGEX.test(trend.clusterId);
    if (!canSyncToApi) {
      setIsSubmittingReaction(false);
      return;
    }

    try {
      const voterId = getOrCreateVoterId();
      const response = await fetch(`/api/cluster/${trend.clusterId}/reaction`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, reaction: nextReaction }),
      });
      if (!response.ok) {
        throw new Error("reaction request failed");
      }
      const payload = (await response.json()) as {
        totals?: ReactionTotals;
        selectedReaction?: ReactionKey;
      };
      if (payload.totals) {
        setReactionTotals(payload.totals);
        window.localStorage.setItem(
          `zra:reaction:totals:${trend.clusterId}`,
          JSON.stringify(payload.totals),
        );
      }
      if (payload.selectedReaction) {
        setSelectedReaction(payload.selectedReaction);
      }
    } catch {
      // Keep optimistic UI in dev/offline mode so users always get instant feedback.
      void previousTotals;
      void previousReaction;
    } finally {
      setIsSubmittingReaction(false);
    }
  }

  return (
    <article
      ref={articleRef}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 shadow-lg shadow-black/20 transition hover:border-cyan-300/40"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-300/15" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-fuchsia-400/10 blur-2xl transition group-hover:bg-fuchsia-300/15" />

      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] sm:text-[11px]">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-cyan-200">
          {trend.trendCategory}
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[10px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
            Pulse
          </span>
          <span className="text-slate-400">
            {htCopy.trendScoreLabel} {trend.trendScore.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-1 text-[9px] text-slate-400 sm:gap-1.5 sm:text-[10px]">
        <span className="rounded-full border border-white/20 px-2 py-0.5">
          Pop {(trend.popularityScore ?? trend.trendScore).toFixed(1)}
        </span>
        <span className="rounded-full border border-white/20 px-2 py-0.5">
          Google {(trend.googleSearchScore ?? 0).toFixed(1)}
        </span>
        <span className="rounded-full border border-white/20 px-2 py-0.5">
          Sosyal {(trend.socialScore ?? 0).toFixed(1)}
        </span>
        <span className="rounded-full border border-white/20 px-2 py-0.5">
          👁 {viewCount.toLocaleString()}
        </span>
      </div>

      <Link
        href={`/cluster/${trend.clusterId}`}
        className="text-base font-semibold text-white transition hover:text-cyan-200 sm:text-lg"
      >
        {trend.title}
      </Link>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300 sm:mt-1.5 sm:text-xs">
        {trend.summary}
      </p>

      <div className="mt-4 h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-cyan-300"
          style={{ width: `${Math.min(100, trend.trendScore)}%` }}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/15">
        {embedUrl ? (
          <div
            className={`relative bg-black ${mediaFrameClass}`}
            onClick={() => {
              setIsMediaActive(true);
              if (!embedPlayTrackedRef.current) {
                embedPlayTrackedRef.current = true;
                void reportPlaySignal({ plays: 1, durationSeconds: 8 });
              }
            }}
            onMouseEnter={() => {
              setIsMediaActive(true);
              if (!embedPlayTrackedRef.current) {
                embedPlayTrackedRef.current = true;
                void reportPlaySignal({ plays: 1, durationSeconds: 5 });
              }
            }}
          >
            <iframe
              src={embedUrl}
              title={`trend-video-${trend.clusterId}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMuted((current) => !current);
              }}
              className="absolute bottom-2 right-2 rounded-full border border-white/25 bg-black/50 px-2 py-1 text-[10px] text-white/90"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <span className="pointer-events-none absolute left-2 top-2 rounded border border-white/25 bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
              ZRA
            </span>
          </div>
        ) : videoSource?.videoUrl ? (
          <video
            ref={localVideoRef}
            className={`${mediaFrameClass} bg-black object-cover`}
            controls
            preload="metadata"
            autoPlay={isMediaActive}
            muted={isMuted}
            playsInline
            onClick={() => setIsMediaActive(true)}
            onMouseEnter={() => setIsMediaActive(true)}
            onPlay={() => {
              playStartedAtRef.current = Date.now();
              void reportPlaySignal({ plays: 1, durationSeconds: 0 });
            }}
            onPause={() => {
              if (!playStartedAtRef.current) {
                return;
              }
              const elapsed = Math.max(0, (Date.now() - playStartedAtRef.current) / 1000);
              playStartedAtRef.current = null;
              void reportPlaySignal({ plays: 0, durationSeconds: elapsed });
            }}
            onEnded={() => {
              if (!playStartedAtRef.current) {
                return;
              }
              const elapsed = Math.max(0, (Date.now() - playStartedAtRef.current) / 1000);
              playStartedAtRef.current = null;
              void reportPlaySignal({ plays: 0, durationSeconds: elapsed });
            }}
          >
            <source src={videoSource.videoUrl} />
            Navigatè sa a pa sipòte videyo sa a.
          </video>
        ) : imageSource?.imageUrl ? (
          <div className="block transition hover:opacity-95">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSource.imageUrl}
              alt={trend.title}
              className={`${mediaFrameClass} object-cover`}
            />
          </div>
        ) : (
          <div
            className={`mx-auto flex flex-col justify-between bg-gradient-to-br from-fuchsia-500/45 via-cyan-500/25 to-indigo-500/40 p-4 ${mediaFrameClass}`}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                AI video recap
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white">
                Gade rezime vizyèl rapid sou pwen esansyèl istwa sa a.
              </p>
            </div>

            <div className="flex items-end justify-between">
              <span className="rounded-full border border-white/20 bg-black/25 px-2 py-1 text-[10px] text-white/90">
                Preview
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/35 text-lg text-white">
                ▶
              </span>
            </div>
          </div>
        )}
      </div>

      {(videoSource?.embedUrl || videoSource?.videoUrl) && (
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setIsMuted((current) => !current);
              if (localVideoRef.current) {
                localVideoRef.current.muted = !isMuted;
              }
            }}
            className="rounded-full border border-white/20 px-2 py-1 text-[10px] text-slate-200"
          >
            {isMuted ? "Unmute video" : "Mute video"}
          </button>
        </div>
      )}

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
          Ki jan ou te wè post sa?
        </p>
        {selectedReaction ? (
          <div className="mt-2 space-y-2 text-[11px]">
            {(
              [
                { key: "sa_raz", label: "Raz", emoji: "🪫", activeClass: "bg-rose-300/10 text-rose-100" },
                { key: "sa_komik", label: "Komik", emoji: "😂", activeClass: "bg-amber-300/10 text-amber-100" },
                { key: "sa_enteresan", label: "Enteresan", emoji: "🔥", activeClass: "bg-cyan-300/10 text-cyan-100" },
              ] as const
            ).map((option) => {
              const percent = reactionPercentForKey(option.key, reactionBreakdown);
              const isSelected = selectedReaction === option.key;
              return (
                <div
                  key={option.key}
                  className={`relative overflow-hidden rounded-lg border border-white/15 px-3 py-2 ${
                    isSelected ? option.activeClass : "bg-white/[0.02] text-slate-200"
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-medium">
                      {isSelected ? "✓" : null} {option.label} {option.emoji}
                    </span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-0.5 text-[10px] text-slate-400">{reactionTotals.totalVotes} vòt</div>
          </div>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => submitReaction("sa_raz")}
                disabled={isSubmittingReaction}
                className={`rounded-lg border px-2 py-2 transition ${
                  selectedReaction === "sa_raz"
                    ? "border-rose-300/50 bg-rose-300/15 text-rose-100"
                    : "border-white/15 bg-white/[0.02] text-slate-200 hover:border-rose-300/40"
                } ${animatingReaction === "sa_raz" ? "zra-reaction-raz" : ""}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>Raz</span>
                  <span>🪫</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => submitReaction("sa_komik")}
                disabled={isSubmittingReaction}
                className={`rounded-lg border px-2 py-2 transition ${
                  selectedReaction === "sa_komik"
                    ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                    : "border-white/15 bg-white/[0.02] text-slate-200 hover:border-amber-300/40"
                } ${animatingReaction === "sa_komik" ? "zra-reaction-komik" : ""}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>Komik</span>
                  <span>😂</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => submitReaction("sa_enteresan")}
                disabled={isSubmittingReaction}
                className={`rounded-lg border px-2 py-2 transition ${
                  selectedReaction === "sa_enteresan"
                    ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
                    : "border-white/15 bg-white/[0.02] text-slate-200 hover:border-cyan-300/40"
                } ${animatingReaction === "sa_enteresan" ? "zra-reaction-enteresan" : ""}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>Enteresan</span>
                  <span>🔥</span>
                </span>
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Klike sou yon bouton pou wè rezilta yo.</p>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes zraShake {
          0% { transform: translateX(0) scale(1); }
          20% { transform: translateX(-3px) rotate(-2deg) scale(1.03); }
          40% { transform: translateX(3px) rotate(2deg) scale(1.03); }
          60% { transform: translateX(-2px) rotate(-1deg) scale(1.02); }
          80% { transform: translateX(2px) rotate(1deg) scale(1.01); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes zraBounceGlow {
          0% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
          30% { transform: translateY(-5px) scale(1.04); box-shadow: 0 0 18px rgba(251, 191, 36, 0.35); }
          60% { transform: translateY(1px) scale(1.02); box-shadow: 0 0 12px rgba(251, 191, 36, 0.2); }
          100% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes zraPulseShimmer {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(34, 211, 238, 0); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34, 211, 238, 0.35); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(34, 211, 238, 0); }
        }
        .zra-reaction-raz {
          animation: zraShake 0.7s ease;
        }
        .zra-reaction-komik {
          animation: zraBounceGlow 0.72s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .zra-reaction-enteresan {
          animation: zraPulseShimmer 0.7s ease;
        }
      `}</style>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] sm:py-1 sm:text-[11px] ${sentimentBadge(
            trend.sentiment,
          )}`}
        >
          {sentimentLabel(trend.sentiment)}
        </span>
        {trend.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/15 bg-white/[0.02] px-2 py-0.5 text-[10px] text-slate-300 sm:py-1 sm:text-[11px]"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2.5 sm:mt-4 sm:space-y-2 sm:pt-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-[11px]">
          Sous ({trend.sourceCount})
        </p>
        {trend.topSources.map((source) => (
          <a
            key={source.sourceUrl}
            href={source.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-white/10 px-3 py-2 transition hover:border-cyan-300/40 hover:bg-white/[0.02]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium text-white sm:text-xs">{source.sourceName}</p>
              {source.platform ? (
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-slate-400">
                  {source.platform}
                </span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{source.snippet}</p>
            <p className="mt-2 text-xs font-semibold text-cyan-200">{htCopy.cardSourceCta} →</p>
          </a>
        ))}
      </div>
    </article>
  );
}

