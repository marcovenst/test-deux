import { pickFeaturedImageSource } from "@/lib/media/pickFeaturedSource";
import type { TrendFeedItem } from "@/lib/trends/query";

export type DailyDigestStory = {
  clusterId: string;
  title: string;
  summary: string;
  trendCategory: string;
  imageUrl?: string;
  sourceName?: string;
  viewCount: number;
  socialScore: number;
  totalVotes: number;
};

export function isLiveDigestCluster(clusterId: string) {
  return clusterId.length > 0 && !clusterId.startsWith("fallback-");
}

/** Top stories as social-style cards (media + engagement metadata). */
export function buildDailyDigest(trends: TrendFeedItem[], maxStories = 8): DailyDigestStory[] {
  const seen = new Set<string>();
  const stories: DailyDigestStory[] = [];

  for (const trend of trends) {
    if (!isLiveDigestCluster(trend.clusterId) || seen.has(trend.clusterId)) {
      continue;
    }
    seen.add(trend.clusterId);
    const image = pickFeaturedImageSource(trend.topSources);
    const topSource = trend.topSources[0];
    stories.push({
      clusterId: trend.clusterId,
      title: trend.title.trim(),
      summary: trend.summary.trim(),
      trendCategory: trend.trendCategory,
      imageUrl: image?.imageUrl,
      sourceName: topSource?.sourceName,
      viewCount: trend.viewCount,
      socialScore: trend.socialScore ?? 0,
      totalVotes: trend.reactions.totalVotes,
    });
    if (stories.length >= maxStories) {
      break;
    }
  }

  return stories;
}
