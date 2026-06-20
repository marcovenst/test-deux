import { describe, expect, it } from "vitest";

import { haitiYoutubeChannels, YOUTUBE_SEARCH_QUERIES } from "@/lib/content/youtubeChannels";

describe("youtubeChannels", () => {
  it("lists curated Haiti media channels with valid IDs", () => {
    expect(haitiYoutubeChannels.length).toBeGreaterThanOrEqual(4);
    for (const channel of haitiYoutubeChannels) {
      expect(channel.channelId).toMatch(/^UC[\w-]{20,}$/);
      expect(channel.sourceName.length).toBeGreaterThan(2);
    }
  });

  it("includes diverse search queries for fresh uploads", () => {
    expect(YOUTUBE_SEARCH_QUERIES.length).toBeGreaterThanOrEqual(8);
    expect(YOUTUBE_SEARCH_QUERIES.some((q) => /kreyol|nouvèl/i.test(q))).toBe(true);
    expect(YOUTUBE_SEARCH_QUERIES.some((q) => /Grenadye|football/i.test(q))).toBe(true);
  });
});
