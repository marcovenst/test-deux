import { describe, expect, it } from "vitest";

import { pickFeaturedPostTitle } from "@/lib/media/pickFeaturedSource";

describe("pickFeaturedPostTitle", () => {
  it("uses the embedded video post title over cluster headline", () => {
    const title = pickFeaturedPostTitle([
      {
        sourceUrl: "https://example.com/article",
        postTitle: "Cluster headline from LLM",
      },
      {
        sourceUrl: "https://www.youtube.com/watch?v=abc",
        embedUrl: "https://www.youtube.com/embed/abc",
        postTitle: "Exact YouTube video title",
      },
    ]);
    expect(title).toBe("Exact YouTube video title");
  });

  it("falls back to first source title when no video is present", () => {
    const title = pickFeaturedPostTitle([
      {
        sourceUrl: "https://haitiantimes.com/story",
        postTitle: "Original article headline",
        snippet: "Lead paragraph",
      },
    ]);
    expect(title).toBe("Original article headline");
  });
});
