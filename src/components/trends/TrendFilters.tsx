import Link from "next/link";
import { normalizePopularityWindow } from "@/lib/trends/popularity";

const POPULARITY_WINDOWS = ["1h", "5h", "24h"] as const;

export function TrendFilters({
  selectedCategory,
  selectedTimeframe,
  popularityWindow = "5h",
}: {
  selectedCategory: string;
  selectedTimeframe: "daily" | "weekly";
  popularityWindow?: string;
}) {
  const windowParam = normalizePopularityWindow(popularityWindow);
  const qs = (tf: string, pop: string) =>
    `/?timeframe=${tf}&category=${selectedCategory}&popularityWindow=${pop}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="inline-flex rounded-full bg-zinc-100 p-0.5"
        role="group"
        aria-label="Peryòd"
      >
        {(["daily", "weekly"] as const).map((timeframe) => {
          const active = timeframe === selectedTimeframe;
          return (
            <Link
              key={timeframe}
              href={qs(timeframe, windowParam)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {timeframe === "daily" ? "Jounen an" : "Semèn nan"}
            </Link>
          );
        })}
      </div>

      <div
        className="inline-flex rounded-full bg-zinc-100 p-0.5"
        role="group"
        aria-label="Fenèt popilarite"
      >
        {POPULARITY_WINDOWS.map((window) => {
          const active = windowParam === window;
          return (
            <Link
              key={window}
              href={qs(selectedTimeframe, window)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {window}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
