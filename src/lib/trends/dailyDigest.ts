import type { TrendFeedItem } from "@/lib/trends/query";

export type DailyDigestBullet = {
  clusterId: string;
  title: string;
  summary: string;
  trendCategory: string;
};

export function isLiveDigestCluster(clusterId: string) {
  return clusterId.length > 0 && !clusterId.startsWith("fallback-");
}

/** Top stories for the daily written digest (deduped, sorted by popularity). */
export function buildDailyDigest(
  trends: TrendFeedItem[],
  maxBullets = 10,
): DailyDigestBullet[] {
  const seen = new Set<string>();
  const bullets: DailyDigestBullet[] = [];

  for (const trend of trends) {
    if (!isLiveDigestCluster(trend.clusterId) || seen.has(trend.clusterId)) {
      continue;
    }
    seen.add(trend.clusterId);
    bullets.push({
      clusterId: trend.clusterId,
      title: trend.title.trim(),
      summary: trend.summary.trim(),
      trendCategory: trend.trendCategory,
    });
    if (bullets.length >= maxBullets) {
      break;
    }
  }

  return bullets;
}
