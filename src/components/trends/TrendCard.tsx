"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { TrendFeedItem } from "@/lib/trends/query";
import { htCopy } from "@/lib/i18n/ht";

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

export function TrendCard({ trend }: { trend: TrendFeedItem }) {
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
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
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

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 shadow-lg shadow-black/20 transition hover:border-cyan-300/40">
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
            onClick={() => setIsMediaActive(true)}
            onMouseEnter={() => setIsMediaActive(true)}
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

