import { describe, expect, it } from "vitest";

import { buildDailyDigest } from "@/lib/trends/dailyDigest";
import type { TrendFeedItem } from "@/lib/trends/query";

function trend(partial: Partial<TrendFeedItem> & { clusterId: string; title: string }): TrendFeedItem {
  return {
    summary: "Rezime test.",
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

describe("buildDailyDigest", () => {
  it("returns top live stories as bullets", () => {
    const bullets = buildDailyDigest(
      [
        trend({ clusterId: "a1", title: "Premye istwa" }),
        trend({ clusterId: "a2", title: "Dezyèm istwa" }),
        trend({ clusterId: "fallback-1", title: "Pa dwe parèt" }),
      ],
      5,
    );
    expect(bullets).toHaveLength(2);
    expect(bullets[0]?.title).toBe("Premye istwa");
  });
});
