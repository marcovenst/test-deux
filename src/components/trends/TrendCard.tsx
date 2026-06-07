"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";

import { ArticleTrendCard } from "@/components/trends/ArticleTrendCard";
import { TrendCardReactions } from "@/components/trends/TrendCardReactions";
import { useTrendCardEngagement } from "@/components/trends/useTrendCardEngagement";
import type { TrendFeedItem } from "@/lib/trends/query";
import { htCopy } from "@/lib/i18n/ht";
import { pickFeaturedImageSource, pickFeaturedVideoSource } from "@/lib/media/pickFeaturedSource";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sentimentBadge(sentiment: TrendFeedItem["sentiment"]) {
  if (sentiment === "positive") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (sentiment === "negative") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-600 border-slate-200";
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
  const articleRef = useRef<HTMLElement | null>(null);
  const videoSource = pickFeaturedVideoSource(trend.topSources);
  const imageSource = pickFeaturedImageSource(trend.topSources);
  const engagement = useTrendCardEngagement(trend, articleRef);

  if (!videoSource) {
    return (
      <ArticleTrendCard
        trend={trend}
        imageSource={imageSource}
        articleRef={articleRef}
        engagement={engagement}
      />
    );
  }

  return (
    <VideoTrendCard
      trend={trend}
      videoSource={videoSource}
      imageSource={imageSource}
      articleRef={articleRef}
      engagement={engagement}
    />
  );
}

type VideoTrendCardProps = {
  trend: TrendFeedItem;
  videoSource: NonNullable<ReturnType<typeof pickFeaturedVideoSource>>;
  imageSource: ReturnType<typeof pickFeaturedImageSource>;
  articleRef: RefObject<HTMLElement | null>;
  engagement: ReturnType<typeof useTrendCardEngagement>;
};

function VideoTrendCard({
  trend,
  videoSource,
  imageSource,
  articleRef,
  engagement,
}: VideoTrendCardProps) {
  const mediaAspect = classifyMediaAspect({
    embedUrl: videoSource.embedUrl,
    videoUrl: videoSource.videoUrl,
    sourceUrl: videoSource.sourceUrl ?? imageSource?.sourceUrl,
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
  const playStartedAtRef = useRef<number | null>(null);
  const embedPlayTrackedRef = useRef(false);
  const { viewCount } = engagement;

  const embedUrl = useMemo(() => {
    if (!videoSource.embedUrl) {
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
  }, [videoSource.embedUrl, isMediaActive, isMuted]);

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

  return (
    <article
      ref={articleRef}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-sky-200 hover:shadow-md sm:p-4"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-sky-100/80 blur-2xl transition group-hover:bg-sky-200/60" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-rose-100/60 blur-2xl transition group-hover:bg-rose-200/50" />

      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] sm:text-[11px]">
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 font-medium text-sky-800">
          {trend.trendCategory}
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
            Pulse
          </span>
          <span className="text-slate-500">
            {htCopy.trendScoreLabel} {trend.trendScore.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-1 text-[9px] text-slate-600 sm:gap-1.5 sm:text-[10px]">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
          Pop {(trend.popularityScore ?? trend.trendScore).toFixed(1)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
          Google {(trend.googleSearchScore ?? 0).toFixed(1)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
          Sosyal {(trend.socialScore ?? 0).toFixed(1)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
          👁 {viewCount.toLocaleString()}
        </span>
      </div>

      <Link
        href={`/cluster/${trend.clusterId}`}
        className="text-base font-semibold text-slate-900 transition hover:text-sky-700 sm:text-lg"
      >
        {trend.title}
      </Link>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:mt-1.5 sm:text-xs">
        {trend.summary}
      </p>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-sky-500"
          style={{ width: `${Math.min(100, trend.trendScore)}%` }}
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
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
        ) : videoSource.videoUrl ? (
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
        ) : null}
      </div>

      {(videoSource.embedUrl || videoSource.videoUrl) && (
        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setIsMuted((current) => !current);
              if (localVideoRef.current) {
                localVideoRef.current.muted = !isMuted;
              }
            }}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600"
          >
            {isMuted ? "Unmute video" : "Mute video"}
          </button>
        </div>
      )}

      <div className="mt-3">
        <TrendCardReactions engagement={engagement} />
      </div>

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
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 sm:py-1 sm:text-[11px]"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 sm:mt-4 sm:space-y-2 sm:pt-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:text-[11px]">
          Sous ({trend.sourceCount})
        </p>
        {trend.topSources.map((source) => (
          <a
            key={source.sourceUrl}
            href={source.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-sky-200 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium text-slate-900 sm:text-xs">{source.sourceName}</p>
              {source.platform ? (
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                  {source.platform}
                </span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{source.snippet}</p>
            <p className="mt-2 text-xs font-semibold text-sky-700">{htCopy.cardSourceCta} →</p>
          </a>
        ))}
      </div>
    </article>
  );
}
