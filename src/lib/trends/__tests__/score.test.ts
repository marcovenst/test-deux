import { calculateTrendComponents, normalizedEngagement, recencyBoost } from "@/lib/trends/score";

describe("trend scoring helpers", () => {
  it("weights engagement fields as expected", () => {
    const score = normalizedEngagement({
      likes: 10,
      shares: 5,
      comments: 4,
      views: 1000,
    });

    expect(score).toBeCloseTo(10 * 1.5 + 5 * 2.2 + 4 * 1.2 + 1000 * 0.01, 5);
  });

  it("gives higher trend score for stronger cross-platform trend", () => {
    const weak = calculateTrendComponents({
      mentionCount: 3,
      engagement: 35,
      recencyAverage: 0.4,
      platformCount: 1,
    });
    const strong = calculateTrendComponents({
      mentionCount: 15,
      engagement: 420,
      recencyAverage: 0.9,
      platformCount: 4,
    });

    expect(strong.trendScore).toBeGreaterThan(weak.trendScore);
    expect(strong.overlapBonus).toBeGreaterThan(weak.overlapBonus);
  });

  it("applies recency decay over time", () => {
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString();

    expect(recencyBoost(now)).toBeGreaterThan(recencyBoost(old));
  });
});

