import { getEnv, isConfigured } from "@/lib/config/env";
import { shouldRejectLikelyArabicContent } from "@/lib/ingestion/scriptFilter";
import type { RawIngestionRecord, SourceAdapter } from "@/lib/ingestion/types";

type YoutubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: YoutubeSnippet;
  }>;
};

type YoutubePlaylistResponse = {
  items?: Array<{
    snippet?: YoutubeSnippet & {
      resourceId?: { videoId?: string };
    };
  }>;
};

type YoutubeChannelsResponse = {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
};

type YoutubeSnippet = {
  title?: string;
  description?: string;
  publishedAt?: string;
  channelTitle?: string;
  thumbnails?: {
    default?: { url?: string };
    medium?: { url?: string };
    high?: { url?: string };
  };
};

type YoutubeVideosResponse = {
  items?: Array<{
    id?: string;
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
};

type YoutubeAdapterOptions = {
  sourceName?: string;
  maxResults?: number;
  /** ISO 639-1; biases results away from unrelated languages. */
  relevanceLanguage?: string;
  /** ISO 3166-1 alpha-2; helps diaspora/US-focused Haiti coverage vs global noise. */
  regionCode?: string;
  /** Only return videos published after this ISO timestamp. */
  publishedAfter?: string;
  order?: "date" | "viewCount" | "relevance";
};

const DEFAULT_PUBLISHED_AFTER_DAYS = 14;

function defaultPublishedAfterIso(days = DEFAULT_PUBLISHED_AFTER_DAYS) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function isPublishedAfter(publishedAt: string | null | undefined, cutoffIso: string) {
  if (!publishedAt) {
    return true;
  }
  return new Date(publishedAt).getTime() >= new Date(cutoffIso).getTime();
}

async function fetchVideoStats(apiKey: string, videoIds: string[]) {
  const statsMap = new Map<
    string,
    {
      views: number;
      likes: number;
      comments: number;
    }
  >();

  if (videoIds.length === 0) {
    return statsMap;
  }

  const videosParams = new URLSearchParams({
    key: apiKey,
    part: "statistics",
    id: videoIds.join(","),
  });
  const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams}`);
  if (!videosRes.ok) {
    return statsMap;
  }

  const videosData = (await videosRes.json()) as YoutubeVideosResponse;
  for (const item of videosData.items ?? []) {
    const id = item.id;
    if (!id) {
      continue;
    }
    statsMap.set(id, {
      views: Number(item.statistics?.viewCount ?? 0),
      likes: Number(item.statistics?.likeCount ?? 0),
      comments: Number(item.statistics?.commentCount ?? 0),
    });
  }

  return statsMap;
}

function recordFromSnippet(
  videoId: string,
  snippet: YoutubeSnippet | undefined,
  statsMap: Map<string, { views: number; likes: number; comments: number }>,
): RawIngestionRecord | null {
  const rawTitle = snippet?.title ?? "";
  const rawDesc = snippet?.description ?? snippet?.title ?? "";
  if (!videoId || shouldRejectLikelyArabicContent(rawTitle, rawDesc)) {
    return null;
  }

  const stats = statsMap.get(videoId);
  return {
    externalId: videoId,
    title: rawTitle || null,
    content: rawDesc || null,
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: snippet?.publishedAt ?? null,
    language: null,
    platform: "youtube" as const,
    engagement: {
      views: stats?.views ?? 0,
      likes: stats?.likes ?? 0,
      comments: stats?.comments ?? 0,
    },
    metadata: {
      channelTitle: snippet?.channelTitle,
      videoId,
      thumbnailUrl:
        snippet?.thumbnails?.high?.url ??
        snippet?.thumbnails?.medium?.url ??
        snippet?.thumbnails?.default?.url,
    },
  };
}

export function createYoutubeAdapter(
  query = "Haiti news",
  options?: YoutubeAdapterOptions,
): SourceAdapter {
  const publishedAfter = options?.publishedAfter ?? defaultPublishedAfterIso();

  return {
    source: {
      name: options?.sourceName ?? "youtube-search",
      platform: "youtube",
    },
    async fetchRecords() {
      const env = getEnv();
      if (!env.YOUTUBE_API_KEY || !isConfigured(env.YOUTUBE_API_KEY)) {
        return [];
      }
      const apiKey = env.YOUTUBE_API_KEY;
      const searchParams = new URLSearchParams({
        key: apiKey,
        part: "snippet",
        type: "video",
        q: query,
        order: options?.order ?? "date",
        maxResults: String(options?.maxResults ?? 25),
        relevanceLanguage: options?.relevanceLanguage ?? "en",
        regionCode: options?.regionCode ?? "US",
        publishedAfter,
      });
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
      );
      if (!searchRes.ok) {
        throw new Error(`Youtube search failed (${searchRes.status})`);
      }
      const searchData = (await searchRes.json()) as YoutubeSearchResponse;
      const videoIds = (searchData.items ?? [])
        .map((item) => item.id?.videoId)
        .filter((id): id is string => Boolean(id));

      const statsMap = await fetchVideoStats(apiKey, videoIds);

      return (searchData.items ?? []).flatMap((item) => {
        const videoId = item.id?.videoId ?? "";
        if (!isPublishedAfter(item.snippet?.publishedAt, publishedAfter)) {
          return [];
        }
        const record = recordFromSnippet(videoId, item.snippet, statsMap);
        return record ? [record] : [];
      });
    },
  };
}

export function createYoutubeChannelAdapter(
  channelId: string,
  options?: {
    sourceName?: string;
    maxResults?: number;
    publishedAfter?: string;
  },
): SourceAdapter {
  const publishedAfter = options?.publishedAfter ?? defaultPublishedAfterIso();

  return {
    source: {
      name: options?.sourceName ?? `youtube-channel-${channelId.slice(0, 8)}`,
      platform: "youtube",
    },
    async fetchRecords() {
      const env = getEnv();
      if (!env.YOUTUBE_API_KEY || !isConfigured(env.YOUTUBE_API_KEY)) {
        return [];
      }
      const apiKey = env.YOUTUBE_API_KEY;

      const channelParams = new URLSearchParams({
        key: apiKey,
        part: "contentDetails",
        id: channelId,
      });
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?${channelParams}`,
      );
      if (!channelRes.ok) {
        throw new Error(`Youtube channel lookup failed (${channelRes.status})`);
      }
      const channelData = (await channelRes.json()) as YoutubeChannelsResponse;
      const uploadsPlaylistId =
        channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return [];
      }

      const playlistParams = new URLSearchParams({
        key: apiKey,
        part: "snippet",
        playlistId: uploadsPlaylistId,
        maxResults: String(options?.maxResults ?? 20),
      });
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams}`,
      );
      if (!playlistRes.ok) {
        throw new Error(`Youtube playlist fetch failed (${playlistRes.status})`);
      }
      const playlistData = (await playlistRes.json()) as YoutubePlaylistResponse;

      const items = (playlistData.items ?? []).filter((item) =>
        isPublishedAfter(item.snippet?.publishedAt, publishedAfter),
      );
      const videoIds = items
        .map((item) => item.snippet?.resourceId?.videoId)
        .filter((id): id is string => Boolean(id));

      const statsMap = await fetchVideoStats(apiKey, videoIds);

      return items.flatMap((item) => {
        const videoId = item.snippet?.resourceId?.videoId ?? "";
        const record = recordFromSnippet(videoId, item.snippet, statsMap);
        return record ? [record] : [];
      });
    },
  };
}
