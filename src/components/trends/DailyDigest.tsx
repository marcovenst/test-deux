import Link from "next/link";

import { htCopy } from "@/lib/i18n/ht";
import type { DailyDigestBullet } from "@/lib/trends/dailyDigest";

type DailyDigestProps = {
  bullets: DailyDigestBullet[];
  timeframe: "daily" | "weekly";
  updatedLabel?: string | null;
};

export function DailyDigest({ bullets, timeframe, updatedLabel }: DailyDigestProps) {
  if (bullets.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
        {htCopy.noData}
      </section>
    );
  }

  const intro =
    timeframe === "weekly" ? htCopy.dailyDigestIntroWeekly : htCopy.dailyDigestIntroDaily;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
          {htCopy.dailyDigestBadge}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {timeframe === "weekly" ? htCopy.dailyDigestTitleWeekly : htCopy.dailyDigestTitleDaily}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{intro}</p>
        {updatedLabel ? (
          <p className="mt-2 text-xs text-slate-400">
            {htCopy.dailyDigestUpdated} {updatedLabel}
          </p>
        ) : null}
      </header>

      <ul className="mt-6 space-y-6">
        {bullets.map((item, index) => (
          <li key={item.clusterId} className="flex gap-4">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                  {item.trendCategory}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                <Link
                  href={`/cluster/${item.clusterId}`}
                  className="transition hover:text-rose-600"
                >
                  {item.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
              <Link
                href={`/cluster/${item.clusterId}`}
                className="mt-2 inline-flex text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                {htCopy.dailyDigestReadMore} →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
