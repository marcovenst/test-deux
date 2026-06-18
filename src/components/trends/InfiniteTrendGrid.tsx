"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { TrendFeedItem } from "@/lib/trends/query";
import { TrendCard } from "@/components/trends/TrendCard";
import { htCopy } from "@/lib/i18n/ht";
import { splitTrendFeed } from "@/lib/trends/splitFeed";

type InfiniteTrendGridProps = {
  trends: TrendFeedItem[];
  initialVisibleCount?: number;
  chunkSize?: number;
};

export function InfiniteTrendGrid({
  trends,
  initialVisibleCount = 8,
  chunkSize = 8,
}: InfiniteTrendGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  const { videoTrends, articleTrends } = useMemo(
    () => splitTrendFeed(orderedTrends.slice(0, visibleCount)),
    [orderedTrends, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
  }, [initialVisibleCount, trends.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        setVisibleCount((current) => Math.min(orderedTrends.length, current + chunkSize));
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [chunkSize, orderedTrends.length]);

  const hasMore = visibleCount < orderedTrends.length;

  return (
    <div className="space-y-6">
      {visibleCount > initialVisibleCount ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] text-violet-800">
          Sijesyon yo optimize pou entèraksyon, men yo rete balanse pou w ka wè tout kalite sijè.
        </div>
      ) : null}

      {videoTrends.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-violet-900">
              {htCopy.videoFeedTitle}
            </h2>
            <p className="text-[11px] text-violet-700">YouTube, TikTok, Facebook, Instagram, X</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {videoTrends.map((trend) => (
              <TrendCard key={trend.clusterId} trend={trend} />
            ))}
          </div>
        </section>
      ) : null}

      {articleTrends.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
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
        <div ref={sentinelRef} className="flex justify-center py-4 text-xs text-slate-500">
          Chaje plis istwa...
        </div>
      ) : null}
    </div>
  );
}
