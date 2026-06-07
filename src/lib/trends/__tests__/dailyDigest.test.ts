import { describe, expect, it } from "vitest";

import { buildDailyDigest, digestDisplayViews, digestTitleKey } from "@/lib/trends/dailyDigest";
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

describe("digestTitleKey", () => {
  it("treats punctuation and emoji variants as the same headline", () => {
    const a = digestTitleKey("Perú vs Haití 🔥 La Selección remontó");
    const b = digestTitleKey("Peru vs Haiti La Seleccion remonto");
    expect(a).toBe(b);
  });
});

describe("digestDisplayViews", () => {
  it("adds a stable seeded baseline to real views", () => {
    const first = digestDisplayViews("cluster-a", 0);
    const second = digestDisplayViews("cluster-a", 0);
    const withReal = digestDisplayViews("cluster-a", 12);

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(120);
    expect(first).toBeLessThan(900);
    expect(withReal).toBe(first + 12);
  });
});

describe("buildDailyDigest", () => {
  it("returns at most five unique headlines", () => {
    const bullets = buildDailyDigest(
      Array.from({ length: 8 }, (_, i) =>
        trend({ clusterId: `id-${i}`, title: `Istwa ${i}` }),
      ),
      5,
    );
    expect(bullets).toHaveLength(5);
  });

  it("skips duplicate titles from different clusters", () => {
    const title = "Perú vs Haití 🔥 La Selección remontó y abre el debate";
    const bullets = buildDailyDigest(
      [
        trend({ clusterId: "a1", title }),
        trend({ clusterId: "a2", title }),
        trend({ clusterId: "a3", title: "Yon lòt istwa" }),
      ],
      5,
    );
    expect(bullets).toHaveLength(2);
    expect(bullets[0]?.clusterId).toBe("a1");
  });

  it("includes display view counts from seeded baseline and real views", () => {
    const bullets = buildDailyDigest(
      [trend({ clusterId: "live-1", title: "Premye istwa", viewCount: 4 })],
      5,
    );
    expect(bullets[0]?.viewCount).toBe(digestDisplayViews("live-1", 4));
  });
});
