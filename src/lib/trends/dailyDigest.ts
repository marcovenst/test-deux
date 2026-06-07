import type { TrendFeedItem } from "@/lib/trends/query";

export type DailyDigestBullet = {
  clusterId: string;
  title: string;
  trendCategory: string;
  viewCount: number;
};

const DIGEST_VIEW_SEED_MIN = 120;
const DIGEST_VIEW_SEED_RANGE = 780;

function stableDigestSeed(clusterId: string): number {
  let hash = 0;
  for (let i = 0; i < clusterId.length; i += 1) {
    hash = (hash * 31 + clusterId.charCodeAt(i)) % 2147483647;
  }
  return DIGEST_VIEW_SEED_MIN + (hash % DIGEST_VIEW_SEED_RANGE);
}

/** Seeded baseline plus real cluster views from `cluster_views`. */
export function digestDisplayViews(clusterId: string, realViews: number): number {
  return stableDigestSeed(clusterId) + Math.max(0, realViews);
}

export function isLiveDigestCluster(clusterId: string) {
  return clusterId.length > 0 && !clusterId.startsWith("fallback-");
}

/** Normalize titles so duplicate headlines from different clusters collapse to one row. */
export function digestTitleKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Top headlines for the compact daily digest (unique by cluster + title). */
export function buildDailyDigest(
  trends: TrendFeedItem[],
  maxBullets = 5,
): DailyDigestBullet[] {
  const seenClusters = new Set<string>();
  const seenTitles = new Set<string>();
  const bullets: DailyDigestBullet[] = [];

  for (const trend of trends) {
    if (!isLiveDigestCluster(trend.clusterId) || seenClusters.has(trend.clusterId)) {
      continue;
    }
    const title = trend.title.trim();
    const titleKey = digestTitleKey(title);
    if (!titleKey || seenTitles.has(titleKey)) {
      continue;
    }
    seenClusters.add(trend.clusterId);
    seenTitles.add(titleKey);
    bullets.push({
      clusterId: trend.clusterId,
      title,
      trendCategory: trend.trendCategory,
      viewCount: digestDisplayViews(trend.clusterId, trend.viewCount),
    });
    if (bullets.length >= maxBullets) {
      break;
    }
  }

  return bullets;
}
