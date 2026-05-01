import type { TrendFeedItem } from "@/lib/trends/query";

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

export function matchesImmigrationTopic(t: TrendFeedItem): boolean {
  if (t.trendCategory === "immigration" || t.trendCategory === "diaspora") return true;
  const blob = `${t.title} ${t.summary} ${(t.tags ?? []).join(" ")}`.toLowerCase();
  return /\b(immigration|uscis|\btps\b|parole|asylum|visa|deport|imigrasyon|deportasyon|viza|refijye|frontyè|border|green card|work permit)\b/i.test(
    blob,
  );
}

export function matchesSportsTopic(t: TrendFeedItem): boolean {
  if (t.trendCategory === "sports") return true;
  const blob = `${t.title} ${t.summary} ${(t.tags ?? []).join(" ")}`.toLowerCase();
  return /\b(esp[oò]|foutb[oò]l|football|soccer|grenady|match|jw[eè]|ekip|fifa|concacaf|lig|stade|stadium|klasman|goal|coup du monde|selection)\b/i.test(
    blob,
  );
}

function hasUsefulSourceLink(t: TrendFeedItem): boolean {
  return t.topSources.some((s) => {
    const u = (s.sourceUrl ?? "").trim();
    return u.startsWith("http");
  });
}

function hasCreatorSocialSignal(t: TrendFeedItem): boolean {
  if (t.influencers?.length) return true;
  const socialPlatforms = new Set(["youtube", "tiktok", "x", "facebook", "instagram"]);
  return t.topSources.some((s) => {
    const p = (s.platform ?? "").toLowerCase();
    if (socialPlatforms.has(p)) return true;
    const u = (s.sourceUrl ?? "").toLowerCase();
    return (
      u.includes("tiktok.com") ||
      u.includes("youtube.com") ||
      u.includes("youtu.be") ||
      u.includes("facebook.com") ||
      u.includes("fb.watch") ||
      u.includes("instagram.com") ||
      u.includes("x.com") ||
      u.includes("twitter.com")
    );
  });
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

  let influencerLive = pool.filter(hasCreatorSocialSignal).slice(0, 8);
  if (influencerLive.length < 4) {
    const seen = new Set(influencerLive.map((x) => x.clusterId));
    const extra = pool.filter((t) => !seen.has(t.clusterId) && hasUsefulSourceLink(t));
    influencerLive = [...influencerLive, ...extra].slice(0, 8);
  }
  if (influencerLive.length < 4) {
    const seen = new Set(influencerLive.map((x) => x.clusterId));
    influencerLive = [...influencerLive, ...pool.filter((t) => !seen.has(t.clusterId))].slice(
      0,
      8,
    );
  }

  const dailyPick = pool.slice(0, 3);

  return { immigrationLive, sportsLive, influencerLive, dailyPick, pool };
}
