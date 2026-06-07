import Link from "next/link";

import { htCopy } from "@/lib/i18n/ht";
import type { DailyDigestStory } from "@/lib/trends/dailyDigest";

type DailyDigestProps = {
  stories: DailyDigestStory[];
  timeframe: "daily" | "weekly";
};

function categoryGradient(category: string) {
  const key = category.toLowerCase();
  if (key.includes("sport") || key.includes("esp")) {
    return "from-emerald-500 to-teal-600";
  }
  if (key.includes("immig") || key.includes("diaspora")) {
    return "from-amber-500 to-orange-600";
  }
  if (key.includes("mizik") || key.includes("music") || key.includes("viral")) {
    return "from-fuchsia-500 to-purple-600";
  }
  return "from-sky-500 to-indigo-600";
}

export function DailyDigest({ stories, timeframe }: DailyDigestProps) {
  if (stories.length === 0) {
    return null;
  }

  const label =
    timeframe === "weekly" ? htCopy.socialDigestLabelWeekly : htCopy.socialDigestLabelDaily;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold text-zinc-900">{label}</h2>
        <span className="text-xs text-zinc-500">{stories.length} pòs</span>
      </div>

      <div className="space-y-3">
        {stories.map((story) => (
          <article
            key={story.clusterId}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/80"
          >
            <header className="flex items-center gap-3 px-3 pb-2 pt-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${categoryGradient(story.trendCategory)}`}
                aria-hidden
              >
                {story.trendCategory.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {story.sourceName ?? "Zen Rezo A"}
                </p>
                <p className="text-xs text-zinc-500">#{story.trendCategory} · {htCopy.socialDigestHot}</p>
              </div>
            </header>

            <Link href={`/cluster/${story.clusterId}`} className="block">
              {story.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={story.imageUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover sm:aspect-video"
                />
              ) : (
                <div className="flex aspect-[2/1] w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-3xl">
                  🇭🇹
                </div>
              )}
            </Link>

            <div className="space-y-2 px-3 py-3">
              <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                <span>👁 {story.viewCount.toLocaleString()}</span>
                <span>🔥 {story.socialScore.toFixed(0)}</span>
                {story.totalVotes > 0 ? <span>💬 {story.totalVotes}</span> : null}
              </div>
              <Link href={`/cluster/${story.clusterId}`} className="block">
                <p className="text-[15px] font-semibold leading-snug text-zinc-900">{story.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                  {story.summary}
                </p>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
