import { pickFeaturedVideoSource } from "@/lib/media/pickFeaturedSource";
import type { TrendFeedItem } from "@/lib/trends/query";

export function trendHasPlayableVideo(trend: TrendFeedItem): boolean {
  return pickFeaturedVideoSource(trend.topSources) != null;
}

export function splitTrendFeed(trends: TrendFeedItem[]) {
  const videoTrends: TrendFeedItem[] = [];
  const articleTrends: TrendFeedItem[] = [];

  for (const trend of trends) {
    if (trendHasPlayableVideo(trend)) {
      videoTrends.push(trend);
    } else {
      articleTrends.push(trend);
    }
  }

  return { videoTrends, articleTrends };
}
