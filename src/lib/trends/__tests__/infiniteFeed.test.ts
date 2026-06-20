import { describe, expect, it } from "vitest";

import { nextFeedVisibleCount } from "@/lib/trends/infiniteFeed";

describe("nextFeedVisibleCount", () => {
  it("adds a chunk until the total is reached", () => {
    expect(nextFeedVisibleCount(6, 20, 6)).toBe(12);
    expect(nextFeedVisibleCount(18, 20, 6)).toBe(20);
  });

  it("does not grow past the total", () => {
    expect(nextFeedVisibleCount(20, 20, 6)).toBe(20);
    expect(nextFeedVisibleCount(25, 20, 6)).toBe(25);
  });
});
