import Parser from "rss-parser";

import type { FeedSourceConfig, SourceAdapter } from "@/lib/ingestion/types";

const parser = new Parser();

export type GoogleNewsFeedConfig = FeedSourceConfig & {
  hl?: string;
  gl?: string;
  ceid?: string;
};

/** Build a Google News RSS search URL for a query. */
export function googleNewsRssUrl(
  query: string,
  options?: { hl?: string; gl?: string; ceid?: string },
): string {
  const params = new URLSearchParams({
    q: query,
    hl: options?.hl ?? "en-US",
    gl: options?.gl ?? "US",
    ceid: options?.ceid ?? "US:en",
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

export const DEFAULT_GOOGLE_NEWS_FEEDS: GoogleNewsFeedConfig[] = [
  {
    url: googleNewsRssUrl("Haiti"),
    sourceName: "Google News — Haiti",
  },
  {
    url: googleNewsRssUrl("Ayiti", { hl: "fr", gl: "HT", ceid: "HT:fr" }),
    sourceName: "Google News — Ayiti",
  },
  {
    url: googleNewsRssUrl("Haitian diaspora OR Ayisyen diaspora"),
    sourceName: "Google News — Diaspora",
  },
  {
    url: googleNewsRssUrl("USCIS Haiti TPS immigration"),
    sourceName: "Google News — Immigration",
  },
  {
    url: googleNewsRssUrl("Haiti football Grenadiers national team"),
    sourceName: "Google News — Sports",
  },
  {
    url: googleNewsRssUrl("Port-au-Prince Haiti news"),
    sourceName: "Google News — Port-au-Prince",
  },
  {
    url: googleNewsRssUrl("Haiti politics government"),
    sourceName: "Google News — Politics",
  },
];

export function createGoogleNewsAdapter(
  feeds: GoogleNewsFeedConfig[] = DEFAULT_GOOGLE_NEWS_FEEDS,
): SourceAdapter {
  return {
    source: {
      name: "google-news-top-stories",
      platform: "news",
    },
    async fetchRecords() {
      const items = await Promise.all(
        feeds.map(async (feed) => {
          try {
            const parsed = await parser.parseURL(feed.url);
            // rss-parser has loose typing for custom extensions.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const withLooseTypes = parsed.items as any[] | undefined;
            return (withLooseTypes ?? []).map((item) => ({
              externalId: item.guid ?? item.link ?? null,
              title: item.title ?? null,
              content:
                item.contentSnippet ??
                item.content ??
                item.summary ??
                item.title ??
                null,
              sourceUrl: item.link ?? null,
              canonicalUrl: item.link ?? null,
              publishedAt: item.isoDate ?? item.pubDate ?? null,
              language: parsed.language ?? null,
              platform: "news" as const,
              metadata: {
                feedUrl: feed.url,
                feedTitle: parsed.title,
                sourceName: feed.sourceName,
                provider: "google-news",
                thumbnailUrl: item.enclosure?.url ?? item["media:content"]?.url ?? null,
              },
            }));
          } catch (error) {
            return [
              {
                title: null,
                content: null,
                sourceUrl: null,
                platform: "news" as const,
                metadata: {
                  feedUrl: feed.url,
                  sourceName: feed.sourceName,
                  provider: "google-news",
                  error: error instanceof Error ? error.message : "unknown google news error",
                },
              },
            ];
          }
        }),
      );

      return items.flat();
    },
  };
}
