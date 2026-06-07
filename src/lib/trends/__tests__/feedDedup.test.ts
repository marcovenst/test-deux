import { describe, expect, it } from "vitest";

import { dedupeTrendsByTitle } from "@/lib/trends/feedDedup";
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

describe("dedupeTrendsByTitle", () => {
  it("keeps only the first item for duplicate headlines", () => {
    const title = "Perú vs Haití 🔥 La Selección remontó y abre el debate";
    const deduped = dedupeTrendsByTitle([
      trend({ clusterId: "a1", title, popularityScore: 90 }),
      trend({ clusterId: "a2", title, popularityScore: 40 }),
      trend({ clusterId: "a3", title: "Yon lòt istwa", popularityScore: 30 }),
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped[0]?.clusterId).toBe("a1");
    expect(deduped[1]?.title).toBe("Yon lòt istwa");
  });

  it("treats punctuation and accent variants as the same headline", () => {
    const deduped = dedupeTrendsByTitle([
      trend({ clusterId: "a1", title: "Perú vs Haití remontó" }),
      trend({ clusterId: "a2", title: "Peru vs Haiti remonto" }),
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.clusterId).toBe("a1");
  });
});
