"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { TrendFeedItem } from "@/lib/trends/query";
import { TrendCard } from "@/components/trends/TrendCard";

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

    // Balanced round-robin: keeps interaction optimization but avoids one-sided feeds.
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

  const visibleItems = useMemo(
    () => orderedTrends.slice(0, visibleCount),
    [orderedTrends, visibleCount],
  );
  const hasMore = visibleCount < orderedTrends.length;

  return (
    <div className="space-y-4">
      {visibleCount > initialVisibleCount ? (
        <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-2 text-[11px] text-fuchsia-100">
          Sijesyon yo optimize pou entèraksyon, men yo rete balanse pou w ka wè tout kalite sijè.
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        {visibleItems.map((trend) => (
          <TrendCard key={trend.clusterId} trend={trend} />
        ))}
      </section>

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-4 text-xs text-neutral-400">
          Chaje plis istwa...
        </div>
      ) : null}
    </div>
  );
}
