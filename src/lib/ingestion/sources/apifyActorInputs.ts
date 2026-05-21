/**
 * Input shapes for Apify Store actors used in production (see each actor's input-schema on apify.com).
 */

export type SocialNetwork = "instagram" | "tiktok" | "facebook";

function uniqStrings(values: string[], max?: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (max != null && out.length >= max) break;
  }
  return out;
}

/** Split pipeline terms into hashtag-friendly tokens (Latin letters/digits/underscore). */
export function tokensFromSearchTerms(searchTerms: string[]): string[] {
  const out: string[] = [];
  for (const term of searchTerms) {
    const parts = term.split(/[\s,]+/);
    for (const p of parts) {
      const raw = p.replace(/^#/, "").trim();
      if (!raw) continue;
      const token = raw.replace(/[^a-zA-Z0-9_]/g, "");
      if (token.length >= 2) out.push(token.toLowerCase());
    }
  }
  return uniqStrings(out, 40);
}

/**
 * Candidate inputs in priority order. First non-empty dataset wins (see runApifyActor loop).
 */
export function buildApifySocialInputCandidates(
  network: SocialNetwork,
  searchTerms: string[],
  maxItems: number,
  customCandidates?: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const tokens = tokensFromSearchTerms(searchTerms);
  const hashtagList = tokens.length > 0 ? tokens : ["haiti", "ayiti", "haitian"];
  const cap = Math.max(1, Math.min(maxItems, 200));
  const resultsPerPage = Math.max(1, Math.min(cap, 100));

  const base: Array<Record<string, unknown>> = [];

  if (network === "instagram") {
    const directUrls = hashtagList
      .slice(0, 12)
      .map((tag) => `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`);
    base.push({
      directUrls,
      resultsLimit: cap,
      resultsType: "posts",
    });
    const primaryTag = hashtagList[0] ?? "haiti";
    base.push({
      search: `#${primaryTag}`,
      searchType: "hashtag",
      searchLimit: 10,
      resultsLimit: cap,
      resultsType: "posts",
    });
    base.push({
      search: "haiti",
      searchType: "hashtag",
      searchLimit: 8,
      resultsLimit: cap,
      resultsType: "posts",
    });
  }

  if (network === "tiktok") {
    base.push({
      hashtags: hashtagList.slice(0, 15),
      resultsPerPage,
    });
    base.push({
      searchQueries: searchTerms.slice(0, 10).map((s) => s.trim()).filter(Boolean).length
        ? searchTerms.slice(0, 10).map((s) => s.trim()).filter(Boolean)
        : ["Haiti", "Ayiti diaspora"],
      resultsPerPage,
      searchSection: "/video",
      videoSearchSorting: "LATEST",
    });
    base.push({
      hashtags: ["haiti", "ayiti"],
      resultsPerPage,
    });
  }

  if (network === "facebook") {
    // URL-based scraping only; searchTerms alone are not supported by apify/facebook-posts-scraper.
    // Custom candidates (startUrls) are required — still include legacy fallbacks for odd actors.
    base.push({
      searchTerms: hashtagList,
      maxItems: cap,
    });
  }

  const legacy: Array<Record<string, unknown>> = [
    { searchTerms, maxItems: cap, sort: "Latest" },
    { queries: searchTerms, maxItems: cap, sort: "Latest" },
    { search: searchTerms.join(" OR "), maxItems: cap },
    { query: searchTerms.join(" OR "), maxItems: cap },
    { hashtags: hashtagList, resultsLimit: cap },
  ];

  return [...(customCandidates ?? []), ...base, ...legacy];
}
