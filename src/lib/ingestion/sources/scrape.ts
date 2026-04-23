import { load } from "cheerio";

import type { ScrapeSourceConfig, SourceAdapter } from "@/lib/ingestion/types";

function resolveLink(baseUrl: string, path: string | undefined): string | null {
  if (!path) {
    return null;
  }
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return null;
  }
}

export function createScrapeAdapter(configs: ScrapeSourceConfig[]): SourceAdapter {
  return {
    source: {
      name: "haitian-media-scrape",
      platform: "web",
    },
    async fetchRecords() {
      const pages = await Promise.all(
        configs.map(async (config) => {
          try {
            const res = await fetch(config.url, {
              headers: {
                "user-agent":
                  "Mozilla/5.0 (compatible; AyitiBuzzBot/1.0; +https://example.com/bot)",
              },
              cache: "no-store",
            });
            if (!res.ok) {
              return [];
            }
            const html = await res.text();
            const $ = load(html);

            return $(config.articleSelector)
              .map((_, article) => {
                const title = $(article).find(config.titleSelector).first().text().trim();
                const contentSelector = config.contentSelector ?? config.titleSelector;
                const content = $(article).find(contentSelector).first().text().trim();
                const linkRaw = config.linkSelector
                  ? $(article).find(config.linkSelector).first().attr("href")
                  : $(article).find("a").first().attr("href");
                const sourceUrl = resolveLink(config.url, linkRaw);
                const imageRaw = $(article).find("img").first().attr("src");
                const imageUrl = resolveLink(config.url, imageRaw);
                const publishedRaw = config.timeSelector
                  ? $(article).find(config.timeSelector).first().attr("datetime") ??
                    $(article).find(config.timeSelector).first().text()
                  : null;

                return {
                  externalId: sourceUrl,
                  title,
                  content,
                  sourceUrl,
                  canonicalUrl: sourceUrl,
                  publishedAt: publishedRaw,
                  language: "ht",
                  platform: "web" as const,
                  metadata: {
                    scrapedFrom: config.url,
                    sourceName: config.sourceName,
                    imageUrl,
                  },
                };
              })
              .get();
          } catch {
            return [];
          }
        }),
      );

      return pages.flat();
    },
  };
}

