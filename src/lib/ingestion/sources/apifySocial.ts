import { getEnv, isConfigured } from "@/lib/config/env";
import type { RawIngestionRecord, SourceAdapter } from "@/lib/ingestion/types";

type SocialNetwork = "x" | "instagram" | "tiktok";

type ApifySocialOptions = {
  sourceName: string;
  actorId: string | undefined;
  searchTerms: string[];
  maxItems?: number;
  network: SocialNetwork;
};

function toStringValue(input: unknown): string | null {
  return typeof input === "string" && input.trim().length > 0 ? input.trim() : null;
}

function pickString(input: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = toStringValue(input[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function pickNumber(input: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, value);
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.max(0, parsed);
      }
    }
  }
  return 0;
}

function getNestedAuthor(item: Record<string, unknown>): string | null {
  const nestedKeys = ["author", "owner", "user"];
  for (const key of nestedKeys) {
    const nested = item[key];
    if (!nested || typeof nested !== "object") {
      continue;
    }
    const nestedRecord = nested as Record<string, unknown>;
    const fromNested = pickString(nestedRecord, ["userName", "username", "name", "handle", "id"]);
    if (fromNested) {
      return fromNested;
    }
  }
  return null;
}

function mapItemToRecord(network: SocialNetwork, item: Record<string, unknown>): RawIngestionRecord | null {
  const text =
    pickString(item, ["text", "caption", "description", "fullText", "content", "title"]) ?? "";
  const sourceUrl = pickString(item, ["url", "postUrl", "inputUrl", "canonicalUrl", "link", "videoUrl"]);
  if (!sourceUrl) {
    return null;
  }
  const cleanText = text.trim();
  const title = cleanText.length > 0 ? cleanText.slice(0, 160) : `${network} post`;
  const author =
    pickString(item, ["authorUsername", "authorName", "ownerUsername", "username"]) ??
    getNestedAuthor(item);

  return {
    externalId: pickString(item, ["id", "postId", "tweetId"]),
    title,
    content: cleanText || title,
    sourceUrl,
    canonicalUrl: sourceUrl,
    publishedAt: pickString(item, ["createdAt", "timestamp", "publishedAt", "takenAt"]),
    language: pickString(item, ["lang", "language"]),
    platform: "twitter",
    engagement: {
      likes: pickNumber(item, ["likeCount", "likes", "likesCount"]),
      shares: pickNumber(item, ["retweetCount", "shareCount", "shares", "reshareCount"]),
      comments: pickNumber(item, ["replyCount", "commentCount", "comments"]),
      views: pickNumber(item, ["viewCount", "videoViewCount", "plays", "playCount"]),
    },
    metadata: {
      network,
      author,
      rawSource: "apify",
      permalink: sourceUrl,
    },
  };
}

async function runApifyActor(actorId: string, token: string, searchTerms: string[], maxItems: number) {
  const candidateInputs: Array<Record<string, unknown>> = [
    { searchTerms, maxItems, sort: "Latest" },
    { queries: searchTerms, maxItems, sort: "Latest" },
    { search: searchTerms.join(" OR "), maxItems },
    { query: searchTerms.join(" OR "), maxItems },
    { hashtags: searchTerms, resultsLimit: maxItems },
  ];

  let lastErrorMessage = "unknown apify input error";
  for (const runInput of candidateInputs) {
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(runInput),
    });
    if (!runRes.ok) {
      lastErrorMessage = `Apify run failed (${runRes.status})`;
      continue;
    }
    const runPayload = (await runRes.json()) as {
      data?: { defaultDatasetId?: string };
    };
    const datasetId = runPayload.data?.defaultDatasetId;
    if (!datasetId) {
      return [];
    }
    const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
    if (!datasetRes.ok) {
      throw new Error(`Apify dataset fetch failed (${datasetRes.status})`);
    }
    return (await datasetRes.json()) as Array<Record<string, unknown>>;
  }
  throw new Error(lastErrorMessage);
}

export function createApifySocialAdapter(options: ApifySocialOptions): SourceAdapter {
  return {
    source: {
      name: options.sourceName,
      platform: "twitter",
    },
    async fetchRecords() {
      const env = getEnv();
      if (
        !env.APIFY_TOKEN ||
        !options.actorId ||
        !isConfigured(env.APIFY_TOKEN) ||
        !isConfigured(options.actorId)
      ) {
        return [];
      }
      const items = await runApifyActor(
        options.actorId,
        env.APIFY_TOKEN,
        options.searchTerms,
        options.maxItems ?? 100,
      );
      return items
        .map((item) => mapItemToRecord(options.network, item))
        .filter((value): value is RawIngestionRecord => Boolean(value));
    },
  };
}
