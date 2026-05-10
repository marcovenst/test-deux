import type { TrendFeedItem } from "@/lib/trends/query";
import { matchesImmigrationTopic, matchesSportsTopic } from "@/lib/trends/topicMatch";

export { matchesImmigrationTopic, matchesSportsTopic };

export function isLiveTrendClusterId(clusterId: string) {
  return clusterId.length > 0 && !clusterId.startsWith("fallback-");
}

export function dedupeTrendsByClusterId(items: TrendFeedItem[]): TrendFeedItem[] {
  const m = new Map<string, TrendFeedItem>();
  for (const t of items) {
    if (!isLiveTrendClusterId(t.clusterId)) continue;
    const prev = m.get(t.clusterId);
    if (!prev || (t.popularityScore ?? 0) > (prev.popularityScore ?? 0)) {
      m.set(t.clusterId, t);
    }
  }
  return [...m.values()].sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
}

function pickByMatcher(
  dedicated: TrendFeedItem[],
  pool: TrendFeedItem[],
  matcher: (t: TrendFeedItem) => boolean,
  limit: number,
): TrendFeedItem[] {
  const out: TrendFeedItem[] = [];
  const seen = new Set<string>();
  const take = (rows: TrendFeedItem[]) => {
    for (const t of rows) {
      if (!isLiveTrendClusterId(t.clusterId) || seen.has(t.clusterId) || !matcher(t)) continue;
      seen.add(t.clusterId);
      out.push(t);
      if (out.length >= limit) return;
    }
  };
  take(dedupeTrendsByClusterId(dedicated));
  if (out.length < limit) take(pool);
  return out.slice(0, limit);
}

export function buildHomeSidebarSlices(input: {
  trends: TrendFeedItem[];
  hubFeed: TrendFeedItem[];
  immigrationFeed: TrendFeedItem[];
  sportsFeed: TrendFeedItem[];
}) {
  const pool = dedupeTrendsByClusterId([
    ...input.trends,
    ...input.hubFeed,
    ...input.immigrationFeed,
    ...input.sportsFeed,
  ]);

  const immigrationLive = pickByMatcher(
    input.immigrationFeed,
    pool,
    matchesImmigrationTopic,
    4,
  );
  const sportsLive = pickByMatcher(input.sportsFeed, pool, matchesSportsTopic, 4);

  const dailyPick = pool.slice(0, 3);

  return { immigrationLive, sportsLive, dailyPick, pool };
}
