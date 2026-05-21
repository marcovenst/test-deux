import { describe, expect, it } from "vitest";

import {
  buildApifySocialInputCandidates,
  tokensFromSearchTerms,
} from "@/lib/ingestion/sources/apifyActorInputs";

describe("buildApifySocialInputCandidates", () => {
  it("builds Instagram explore/tag URLs and hashtag search", () => {
    const terms = ["#Haiti", "Ayiti news", "haitian"];
    const c = buildApifySocialInputCandidates("instagram", terms, 50, undefined);
    const first = c[0] as { directUrls?: string[]; resultsLimit?: number };
    expect(first.directUrls?.some((u) => u.includes("/explore/tags/haiti"))).toBe(true);
    expect(first.resultsLimit).toBe(50);
  });

  it("builds TikTok hashtags and searchQueries", () => {
    const c = buildApifySocialInputCandidates("tiktok", ["Haiti OR Ayiti", "#kreyol"], 30, undefined);
    const first = c[0] as { hashtags: string[]; resultsPerPage: number };
    expect(first.hashtags?.length).toBeGreaterThan(0);
    expect(first.resultsPerPage).toBeGreaterThan(0);
    const withSearch = c.find((x) => "searchQueries" in x) as { searchQueries: string[] };
    expect(Array.isArray(withSearch.searchQueries)).toBe(true);
  });

  it("tokenizes mixed search strings", () => {
    expect(tokensFromSearchTerms(["#Haiti", "foo bar"])).toContain("haiti");
    expect(tokensFromSearchTerms(["foo bar"]).length).toBeGreaterThanOrEqual(2);
  });
});
