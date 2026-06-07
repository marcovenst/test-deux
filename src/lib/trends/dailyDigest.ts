import { buildDisplayViews } from "@/lib/trends/displayViews";
import type { TrendFeedItem } from "@/lib/trends/query";
import { normalizeTrendTitleKey } from "@/lib/trends/titleKey";

export { normalizeTrendTitleKey as digestTitleKey };

export type DailyDigestBullet = {
  clusterId: string;
  title: string;
  trendCategory: string;
  viewCount: number;
};

export function isLiveDigestCluster(clusterId: string) {
  return clusterId.length > 0 && !clusterId.startsWith("fallback-");
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
    const titleKey = normalizeTrendTitleKey(title);
    if (!titleKey || seenTitles.has(titleKey)) {
      continue;
    }
    seenClusters.add(trend.clusterId);
    seenTitles.add(titleKey);
    bullets.push({
      clusterId: trend.clusterId,
      title,
      trendCategory: trend.trendCategory,
      viewCount: buildDisplayViews(trend.viewCount),
    });
    if (bullets.length >= maxBullets) {
      break;
    }
  }

  return bullets;
}
