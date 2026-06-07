import { describe, expect, it } from "vitest";

import { DEFAULT_GOOGLE_NEWS_FEEDS, googleNewsRssUrl } from "@/lib/ingestion/sources/googleNews";

describe("googleNewsRssUrl", () => {
  it("builds a Haiti search RSS URL", () => {
    const url = googleNewsRssUrl("Haiti");
    expect(url).toContain("news.google.com/rss/search");
    expect(url).toContain("q=Haiti");
  });

  it("supports locale overrides for Ayiti queries", () => {
    const url = googleNewsRssUrl("Ayiti", { hl: "fr", gl: "HT", ceid: "HT:fr" });
    expect(url).toContain("hl=fr");
    expect(url).toContain("gl=HT");
    expect(url).toContain("ceid=HT%3Afr");
  });
});

describe("DEFAULT_GOOGLE_NEWS_FEEDS", () => {
  it("includes Haiti-focused top-story queries", () => {
    const names = DEFAULT_GOOGLE_NEWS_FEEDS.map((feed) => feed.sourceName);
    expect(names).toContain("Google News — Haiti");
    expect(names).toContain("Google News — Immigration");
    expect(DEFAULT_GOOGLE_NEWS_FEEDS.every((feed) => feed.url.startsWith("https://news.google.com/rss/"))).toBe(
      true,
    );
  });
});
