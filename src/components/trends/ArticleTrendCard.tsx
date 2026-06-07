"use client";

import Link from "next/link";
import type { RefObject } from "react";

import type { TrendCardEngagement } from "@/components/trends/useTrendCardEngagement";
import { htCopy } from "@/lib/i18n/ht";
import type { TrendFeedItem } from "@/lib/trends/query";

type ArticleSource = TrendFeedItem["topSources"][number];

type ArticleTrendCardProps = {
  trend: TrendFeedItem;
  imageSource: ArticleSource | null;
  articleRef: RefObject<HTMLElement | null>;
  engagement: TrendCardEngagement;
};

function sourceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NA";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function ArticleTrendCard({
  trend,
  imageSource,
  articleRef,
  engagement,
}: ArticleTrendCardProps) {
  const primarySource = trend.topSources[0];
  const heroImage = imageSource?.imageUrl;

  return (
    <article
      ref={articleRef}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row">
        {heroImage ? (
          <Link
            href={`/cluster/${trend.clusterId}`}
            className="relative block shrink-0 sm:w-[38%]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={trend.title}
              className="aspect-[16/10] h-full w-full object-cover sm:min-h-[200px]"
            />
          </Link>
        ) : null}

        <div className={`flex min-w-0 flex-1 flex-col p-4 ${heroImage ? "" : "border-l-4 border-l-sky-500"}`}>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
              {trend.trendCategory}
            </span>
            {primarySource ? (
              <span className="truncate font-medium text-slate-600">{primarySource.sourceName}</span>
            ) : null}
            <span className="ml-auto tabular-nums text-slate-400">
              👁 {engagement.viewCount.toLocaleString()}
            </span>
          </div>

          {!heroImage && primarySource ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                {sourceInitials(primarySource.sourceName)}
              </div>
              <p className="truncate text-xs font-semibold text-slate-800">{primarySource.sourceName}</p>
            </div>
          ) : null}

          <Link
            href={`/cluster/${trend.clusterId}`}
            className="mt-3 text-base font-semibold leading-snug text-slate-900 transition hover:text-sky-700 sm:text-lg"
          >
            {trend.title}
          </Link>

          <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">{trend.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            {primarySource ? (
              <a
                href={primarySource.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-sky-700 transition hover:text-sky-800"
              >
                {htCopy.cardSourceCta} →
              </a>
            ) : null}
            <Link
              href={`/cluster/${trend.clusterId}`}
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-800"
            >
              {htCopy.newsCardReadFull} →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
