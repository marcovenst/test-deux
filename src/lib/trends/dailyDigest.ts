import { buildDisplayViews } from "@/lib/trends/displayViews";
import type { TrendFeedItem } from "@/lib/trends/query";

export type DailyDigestBullet = {
  clusterId: string;
  title: string;
  trendCategory: string;
  viewCount: number;
};

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
      viewCount: buildDisplayViews(trend.viewCount),
    });
    if (bullets.length >= maxBullets) {
      break;
    }
  }

  return bullets;
}
