"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TrendFeedItem } from "@/lib/trends/query";
import { TrendCard } from "@/components/trends/TrendCard";
import { htCopy } from "@/lib/i18n/ht";
import { nextFeedVisibleCount } from "@/lib/trends/infiniteFeed";
import { splitTrendFeed } from "@/lib/trends/splitFeed";

type InfiniteTrendGridProps = {
  trends: TrendFeedItem[];
  initialVisibleCount?: number;
  chunkSize?: number;
};

export function InfiniteTrendGrid({
  trends,
  initialVisibleCount = 6,
  chunkSize = 6,
}: InfiniteTrendGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const totalRef = useRef(0);

  const orderedTrends = useMemo(() => {
    if (trends.length <= initialVisibleCount) {
      return trends;
    }

    const pinned = trends.slice(0, initialVisibleCount);
    const remainder = trends.slice(initialVisibleCount);

    const scored = remainder
      .map((trend) => {
        const interactionBoost =
          trend.interactionScore * 1.2 +
          trend.reactionScore * 0.9 +
          Math.log10((trend.viewCount ?? 0) + 1) * 14 +
          Math.log10((trend.playCount ?? 0) + 1) * 10 +
          Math.log10((trend.averagePlaySeconds ?? 0) + 1) * 8;

        return {
          trend,
          score: Number(((trend.popularityScore ?? trend.trendScore) + interactionBoost).toFixed(2)),
        };
      })
      .sort((a, b) => b.score - a.score);

    const buckets = new Map<string, Array<(typeof scored)[number]>>();
    for (const item of scored) {
      const key = item.trend.trendCategory || "general";
      const list = buckets.get(key) ?? [];
      list.push(item);
      buckets.set(key, list);
    }

    const balanced: TrendFeedItem[] = [];
    const categories = [...buckets.entries()]
      .sort((a, b) => (b[1][0]?.score ?? 0) - (a[1][0]?.score ?? 0))
      .map(([category]) => category);

    let cursor = 0;
    let addedInPass = 0;
    while (balanced.length < scored.length) {
      const category = categories[cursor % categories.length];
      const queue = buckets.get(category);
      if (queue && queue.length > 0) {
        balanced.push(queue.shift()!.trend);
        addedInPass += 1;
      }

      cursor += 1;
      if (cursor % categories.length === 0) {
        if (addedInPass === 0) {
          break;
        }
        addedInPass = 0;
      }
    }

    return [...pinned, ...balanced];
  }, [trends, initialVisibleCount]);

  totalRef.current = orderedTrends.length;

  const { videoTrends, articleTrends } = useMemo(
    () => splitTrendFeed(orderedTrends.slice(0, visibleCount)),
    [orderedTrends, visibleCount],
  );

  const hasMore = visibleCount < orderedTrends.length;

  const loadMore = useCallback(() => {
    setVisibleCount((current) => nextFeedVisibleCount(current, totalRef.current, chunkSize));
  }, [chunkSize]);

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
    setIsLoadingMore(false);
  }, [initialVisibleCount, trends]);

  useEffect(() => {
    if (!hasMore) {
      setIsLoadingMore(false);
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        setIsLoadingMore(true);
        loadMore();
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount, orderedTrends.length]);

  useEffect(() => {
    if (isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [visibleCount, isLoadingMore]);

  return (
    <div className="space-y-6">
      {visibleCount > initialVisibleCount ? (
        <div className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-[11px] text-violet-200">
          Sijesyon yo optimize pou entèraksyon, men yo rete balanse pou w ka wè tout kalite sijè.
        </div>
      ) : null}

      {videoTrends.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-violet-200">
              {htCopy.videoFeedTitle}
            </h2>
            <p className="text-[11px] text-violet-300/80">YouTube, TikTok, Facebook, Instagram, X</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {videoTrends.map((trend) => (
              <TrendCard key={trend.clusterId} trend={trend} />
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-violet-200">
            {htCopy.videoFeedTitle}
          </h2>
          <p className="text-xs leading-relaxed text-violet-200/80">{htCopy.videoFeedEmpty}</p>
        </section>
      )}

      {articleTrends.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-200">
            {htCopy.articleFeedTitle}
          </h2>
          <div className="space-y-4">
            {articleTrends.map((trend) => (
              <TrendCard key={trend.clusterId} trend={trend} />
            ))}
          </div>
        </section>
      ) : null}

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex flex-col items-center justify-center gap-3 py-6"
          aria-live="polite"
        >
          <p className="text-xs text-neutral-500">
            {isLoadingMore ? "N ap chaje plis istwa..." : "Desann pou chaje plis istwa..."}
          </p>
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-white/20 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:border-cyan-300/50 hover:text-white"
          >
            Chaje plis istwa
          </button>
        </div>
      ) : orderedTrends.length > initialVisibleCount ? (
        <p className="py-4 text-center text-xs text-neutral-500">Ou rive nan fen feed la pou kounye a.</p>
      ) : null}
    </div>
  );
}
