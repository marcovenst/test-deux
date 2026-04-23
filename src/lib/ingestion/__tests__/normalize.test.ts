import {
  computeCanonicalUrlHash,
  computeContentFingerprint,
  normalizeRecord,
  normalizedPostToRawPostRow,
} from "@/lib/ingestion/normalize";

describe("normalizeRecord", () => {
  it("normalizes a valid raw record", () => {
    const normalized = normalizeRecord(
      {
        platform: "news",
        title: "Haiti Diaspora Support Rises",
        content: "A long article body that is definitely more than twenty characters.",
        sourceUrl: "https://example.com/story",
        publishedAt: "2026-04-23T00:00:00.000Z",
        language: "fr",
        engagement: {
          likes: 12,
          shares: 5,
          comments: 3,
          views: 100,
        },
      },
      { name: "rss-news", platform: "news" },
    );

    expect(normalized).toBeTruthy();
    expect(normalized?.platform).toBe("news");
    expect(normalized?.language).toBe("fr");
    expect(normalized?.engagement.likes).toBe(12);
    expect(normalized?.source_url).toBe("https://example.com/story");
  });

  it("rejects records missing title or url", () => {
    const noTitle = normalizeRecord(
      {
        platform: "news",
        title: "",
        content: "A valid length content body for this test case.",
        sourceUrl: "https://example.com/story",
      },
      { name: "rss-news", platform: "news" },
    );
    const noUrl = normalizeRecord(
      {
        platform: "news",
        title: "Hello",
        content: "A valid length content body for this test case.",
      },
      { name: "rss-news", platform: "news" },
    );

    expect(noTitle).toBeNull();
    expect(noUrl).toBeNull();
  });
});

describe("fingerprint helpers", () => {
  it("creates stable hashes for fingerprint and canonical url", () => {
    const fpA = computeContentFingerprint("Title", "This is content");
    const fpB = computeContentFingerprint("title", "This   is   content");
    const urlHash = computeCanonicalUrlHash("HTTPS://EXAMPLE.COM/Story");

    expect(fpA).toEqual(fpB);
    expect(urlHash).toHaveLength(64);
  });

  it("maps normalized record to raw row shape", () => {
    const normalized = normalizeRecord(
      {
        platform: "reddit",
        title: "Post title",
        content: "This body has enough content to be accepted by the normalizer.",
        sourceUrl: "https://reddit.com/r/test/comments/123",
      },
      { name: "reddit-search", platform: "reddit" },
    );

    const row = normalizedPostToRawPostRow(normalized);
    expect(row).toBeTruthy();
    expect(row?.platform).toBe("reddit");
    expect(row?.content_fingerprint).toHaveLength(64);
  });
});

