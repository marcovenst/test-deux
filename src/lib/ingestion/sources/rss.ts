import Parser from "rss-parser";

import type { FeedSourceConfig, SourceAdapter } from "@/lib/ingestion/types";

const parser = new Parser();

export function createRssAdapter(feeds: FeedSourceConfig[]): SourceAdapter {
  return {
    source: {
      name: "rss-news",
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
                  error: error instanceof Error ? error.message : "unknown rss error",
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

