import { describe, expect, it } from "vitest";

import type { TrendFeedItem } from "@/lib/trends/query";
import { splitTrendFeed, trendHasPlayableVideo } from "@/lib/trends/splitFeed";

function trend(partial: Partial<TrendFeedItem> & { clusterId: string }): TrendFeedItem {
  return {
    title: "Test",
    summary: "Rezime",
    trendCategory: "general",
    trendScore: 50,
    viewCount: 0,
    reactions: { saRaz: 0, saKomik: 0, saEnteresan: 0, totalVotes: 0 },
    reactionScore: 0,
    playCount: 0,
    averagePlaySeconds: 0,
    interactionScore: 0,
    sentiment: "neutral",
    tags: [],
    sourceCount: 1,
    topSources: [],
    ...partial,
  };
}

describe("splitTrendFeed", () => {
  it("detects playable video sources", () => {
    expect(
      trendHasPlayableVideo(
        trend({
          clusterId: "v1",
          topSources: [{ sourceName: "YT", sourceUrl: "https://youtube.com/watch?v=1", embedUrl: "https://youtube.com/embed/1" }],
        }),
      ),
    ).toBe(true);
  });

  it("splits video and article trends into separate lists", () => {
    const video = trend({
      clusterId: "v1",
      topSources: [{ sourceName: "YT", sourceUrl: "https://youtube.com/watch?v=1", embedUrl: "https://youtube.com/embed/1" }],
    });
    const article = trend({
      clusterId: "a1",
      topSources: [{ sourceName: "News", sourceUrl: "https://example.com/story", snippet: "text" }],
    });

    const { videoTrends, articleTrends } = splitTrendFeed([video, article, video]);
    expect(videoTrends).toHaveLength(2);
    expect(articleTrends).toHaveLength(1);
    expect(articleTrends[0]?.clusterId).toBe("a1");
  });
});
