import Link from "next/link";
import { categoryLabelsHt } from "@/lib/i18n/ht";
import { TREND_CATEGORIES } from "@/lib/trends/categories";

const CATEGORIES = TREND_CATEGORIES;

export function TrendFilters({
  selectedCategory,
  selectedTimeframe,
}: {
  selectedCategory: string;
  selectedTimeframe: "daily" | "weekly";
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekly"] as const).map((timeframe) => {
          const active = timeframe === selectedTimeframe;
          return (
            <Link
              key={timeframe}
              href={`/?timeframe=${timeframe}&category=${selectedCategory}`}
              className={`rounded-full px-3 py-1 text-sm ${
                active ? "bg-cyan-300 text-slate-900" : "border border-white/20 text-slate-300"
              }`}
            >
              {timeframe === "daily" ? "jounen an" : "semèn nan"}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const active = category === selectedCategory;
          return (
            <Link
              key={category}
              href={`/?timeframe=${selectedTimeframe}&category=${category}`}
              className={`rounded-full px-3 py-1 text-xs sm:text-sm ${
                active ? "bg-white text-slate-900" : "border border-white/20 text-slate-300"
              }`}
            >
              {categoryLabelsHt[category] ?? category}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

