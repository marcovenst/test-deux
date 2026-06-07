"use client";

import Link from "next/link";
import type { RefObject } from "react";

import { SummaryListenPanel } from "@/components/trends/SummaryListenPanel";
import { TrendCardReactions } from "@/components/trends/TrendCardReactions";
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
            className="relative block shrink-0 sm:w-[42%]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={trend.title}
              className="aspect-[16/10] h-full w-full object-cover sm:min-h-[220px]"
            />
            <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {htCopy.newsCardLabel}
            </span>
          </Link>
        ) : null}

        <div className={`flex min-w-0 flex-1 flex-col p-4 ${heroImage ? "" : "border-l-4 border-l-sky-500"}`}>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
              {trend.trendCategory}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
              {htCopy.newsCardLabel}
            </span>
            {primarySource ? (
              <span className="truncate font-medium text-slate-700">{primarySource.sourceName}</span>
            ) : null}
            <span className="ml-auto tabular-nums text-slate-400">
              👁 {engagement.viewCount.toLocaleString()}
            </span>
          </div>

          {!heroImage && primarySource ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                {sourceInitials(primarySource.sourceName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">{primarySource.sourceName}</p>
                {primarySource.platform ? (
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{primarySource.platform}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <Link
            href={`/cluster/${trend.clusterId}`}
            className="mt-3 text-base font-semibold leading-snug text-slate-900 transition hover:text-sky-700 sm:text-lg"
          >
            {trend.title}
          </Link>

          <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">{trend.summary}</p>

          <div className="mt-3">
            <SummaryListenPanel clusterId={trend.clusterId} title={trend.title} summary={trend.summary} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] ${sentimentBadge(trend.sentiment)}`}
            >
              {sentimentLabel(trend.sentiment)}
            </span>
            {trend.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 px-4 py-3">
        <TrendCardReactions engagement={engagement} />

        {trend.topSources.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
              {htCopy.newsCardSources} ({trend.sourceCount})
            </p>
            {trend.topSources.slice(0, 2).map((source) => (
              <a
                key={source.sourceUrl}
                href={source.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-sky-200"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900">{source.sourceName}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{source.snippet}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-sky-700">{htCopy.cardSourceCta} →</span>
              </a>
            ))}
            <Link
              href={`/cluster/${trend.clusterId}`}
              className="inline-flex text-xs font-semibold text-sky-700 hover:text-sky-800"
            >
              {htCopy.newsCardReadFull} →
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
