import { getEnv, isConfigured } from "@/lib/config/env";
import {
  buildApifySocialInputCandidates,
  type SocialNetwork,
} from "@/lib/ingestion/sources/apifyActorInputs";
import { runApifyActorForItems } from "@/lib/ingestion/sources/apifyRun";
import type { RawIngestionRecord, SourceAdapter } from "@/lib/ingestion/types";

type ApifySocialOptions = {
  sourceName: string;
  actorId: string | undefined;
  searchTerms: string[];
  maxItems?: number;
  network: SocialNetwork;
  inputCandidates?: Array<Record<string, unknown>>;
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
  const sourceUrl = pickString(item, [
    "url",
    "postUrl",
    "inputUrl",
    "canonicalUrl",
    "link",
    "videoUrl",
    "webVideoUrl",
    "shareUrl",
  ]);
  if (!sourceUrl) {
    return null;
  }
  const cleanText = text.trim();
  const title = cleanText.length > 0 ? cleanText.slice(0, 160) : `${network} post`;
  const author =
    pickString(item, ["authorUsername", "authorName", "ownerUsername", "username"]) ??
    getNestedAuthor(item);

  const thumbnailUrl = pickString(item, [
    "thumbnailUrl",
    "thumbnail",
    "displayUrl",
    "coverUrl",
    "imageUrl",
    "previewImageUrl",
  ]);
  const apifyVideoUrl = pickString(item, [
    "videoUrl",
    "downloadUrl",
    "mediaUrl",
    "playAddr",
    "video_downloadAddr",
  ]);
  const tiktokVideoId = pickString(item, ["aweme_id", "videoId", "id"]);

  const metadata: Record<string, unknown> = {
    network,
    author,
    rawSource: "apify",
    permalink: sourceUrl,
  };
  if (thumbnailUrl) metadata.thumbnailUrl = thumbnailUrl;
  if (apifyVideoUrl && /^https?:\/\//i.test(apifyVideoUrl)) metadata.videoUrl = apifyVideoUrl;
  if (network === "tiktok" && tiktokVideoId && /^\d+$/.test(tiktokVideoId)) {
    metadata.tiktokVideoId = tiktokVideoId;
  }

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
    metadata,
  };
}

async function runApifyActor(
  actorId: string,
  token: string,
  network: SocialNetwork,
  searchTerms: string[],
  maxItems: number,
  customCandidates?: Array<Record<string, unknown>>,
) {
  const candidateInputs = buildApifySocialInputCandidates(
    network,
    searchTerms,
    maxItems,
    customCandidates,
  );

  let lastErrorMessage = "unknown apify input error";
  let anyActorRunAccepted = false;
  for (const runInput of candidateInputs) {
    try {
      const items = await runApifyActorForItems(actorId, token, runInput, { maxWaitMs: 90_000 });
      anyActorRunAccepted = true;
      if (items.length > 0) {
        return items;
      }
      lastErrorMessage = "Apify dataset empty for this input; trying next shape";
    } catch (error) {
      lastErrorMessage =
        error instanceof Error ? error.message : "Apify run failed for this input shape";
    }
  }
  if (!anyActorRunAccepted) {
    throw new Error(lastErrorMessage);
  }
  return [];
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
        options.network,
        options.searchTerms,
        options.maxItems ?? 100,
        options.inputCandidates,
      );
      return items
        .map((item) => mapItemToRecord(options.network, item))
        .filter((value): value is RawIngestionRecord => Boolean(value));
    },
  };
}
