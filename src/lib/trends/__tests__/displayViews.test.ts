import { describe, expect, it, vi } from "vitest";

import {
  VIEW_DISPLAY_MIN,
  VIEW_DISPLAY_RANGE,
  buildDisplayViews,
  composeDisplayViews,
  randomViewBaseline,
} from "@/lib/trends/displayViews";

describe("displayViews", () => {
  it("randomViewBaseline stays within the configured range", () => {
    const baseline = randomViewBaseline();
    expect(baseline).toBeGreaterThanOrEqual(VIEW_DISPLAY_MIN);
    expect(baseline).toBeLessThan(VIEW_DISPLAY_MIN + VIEW_DISPLAY_RANGE);
  });

  it("composeDisplayViews adds real views on top of the baseline", () => {
    expect(composeDisplayViews(200, 0)).toBe(200);
    expect(composeDisplayViews(200, 12)).toBe(212);
    expect(composeDisplayViews(200, -3)).toBe(200);
  });

  it("buildDisplayViews uses a random baseline when none is provided", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(buildDisplayViews(4)).toBe(
      VIEW_DISPLAY_MIN + Math.floor(0.5 * VIEW_DISPLAY_RANGE) + 4,
    );
    vi.restoreAllMocks();
  });
});
