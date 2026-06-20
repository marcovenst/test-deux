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
    return null;
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-white">
          {timeframe === "weekly" ? htCopy.dailyDigestTitleWeekly : htCopy.dailyDigestTitleDaily}
        </h2>
        {updatedLabel ? (
          <p className="text-[10px] text-neutral-500">
            {htCopy.dailyDigestUpdated} {updatedLabel}
          </p>
        ) : null}
      </div>

      <ol className="mt-2 space-y-1.5">
        {bullets.map((item, index) => (
          <li key={item.clusterId} className="flex items-start gap-2 text-sm leading-snug">
            <span className="mt-px w-4 shrink-0 text-right text-xs font-semibold text-neutral-500" aria-hidden>
              {index + 1}.
            </span>
            <Link
              href={`/cluster/${item.clusterId}`}
              className="min-w-0 flex-1 font-medium text-neutral-200 transition hover:text-cyan-200"
            >
              {item.title}
            </Link>
            <span
              className="shrink-0 tabular-nums text-[11px] text-neutral-500"
              title={htCopy.dailyDigestViews}
            >
              👁 {item.viewCount.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
