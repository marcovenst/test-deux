import { getEnv, isConfigured } from "@/lib/config/env";
import type { SourceAdapter } from "@/lib/ingestion/types";

type ApifyItem = {
  id?: string;
  text?: string;
  createdAt?: string;
  url?: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  viewCount?: number;
  lang?: string;
  author?: { userName?: string };
};

export function createXApifyAdapter(
  searchTerms = ["Haiti", "Ayiti", "Haitian", "Kreyol"],
  options?: {
    sourceName?: string;
    maxItems?: number;
  },
): SourceAdapter {
  return {
    source: {
      name: options?.sourceName ?? "x-apify",
      platform: "twitter",
    },
    async fetchRecords() {
      const env = getEnv();
      if (
        !env.APIFY_TOKEN ||
        !env.APIFY_ACTOR_ID ||
        !isConfigured(env.APIFY_TOKEN) ||
        !isConfigured(env.APIFY_ACTOR_ID)
      ) {
        return [];
      }
      const apifyToken = env.APIFY_TOKEN;
      const apifyActorId = env.APIFY_ACTOR_ID;
      const maxItems = options?.maxItems ?? 100;
      const actorPath = encodeURIComponent(apifyActorId.trim());

      const runVariants = [
        { searchTerms, maxItems, sort: "Latest" },
        { searchTerms, maxItems, sort: "Latest + Top" },
        { searchTerms, maxItems, sort: "Top" },
      ];

      let items: ApifyItem[] = [];

      for (const runInput of runVariants) {
        const runRes = await fetch(
          `https://api.apify.com/v2/acts/${actorPath}/runs?token=${encodeURIComponent(apifyToken)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(runInput),
          },
        );
        if (!runRes.ok) {
          continue;
        }

        const runPayload = (await runRes.json()) as {
          data?: { defaultDatasetId?: string };
        };
        const datasetId = runPayload.data?.defaultDatasetId;
        if (!datasetId) {
          continue;
        }

        const datasetRes = await fetch(
          `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(apifyToken)}`,
        );
        if (!datasetRes.ok) {
          continue;
        }
        const batch = (await datasetRes.json()) as ApifyItem[];
        if (Array.isArray(batch) && batch.length > 0) {
          items = batch;
          break;
        }
      }

      if (items.length === 0) {
        return [];
      }

      return items
        .filter((item): item is ApifyItem & { url: string } => Boolean(item.url?.trim()))
        .map((item) => {
        const text = item.text?.trim() ?? "";
        const fallbackTitle = item.author?.userName
          ? `@${item.author.userName} sou X`
          : "Post sou X";
        return {
        externalId: item.id ?? null,
        title: text ? text.slice(0, 160) : fallbackTitle,
        content: text || fallbackTitle,
        sourceUrl: item.url ?? null,
        canonicalUrl: item.url ?? null,
        publishedAt: item.createdAt ?? null,
        language: item.lang ?? null,
        platform: "twitter" as const,
        engagement: {
          likes: item.likeCount ?? 0,
          shares: item.retweetCount ?? 0,
          comments: item.replyCount ?? 0,
          views: item.viewCount ?? 0,
        },
        metadata: {
          author: item.author?.userName,
          network: "x" as const,
        },
      };
      });
    },
  };
}

