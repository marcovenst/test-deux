import { getEnv, isConfigured } from "@/lib/config/env";
import type { SourceAdapter } from "@/lib/ingestion/types";

type YoutubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
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
  }>;
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

export function createYoutubeAdapter(
  query = "Haiti news",
  options?: {
    sourceName?: string;
    maxResults?: number;
  },
): SourceAdapter {
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
        order: "date",
        maxResults: String(options?.maxResults ?? 25),
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

      const statsMap = new Map<
        string,
        {
          views: number;
          likes: number;
          comments: number;
        }
      >();

      if (videoIds.length > 0) {
        const videosParams = new URLSearchParams({
          key: apiKey,
          part: "statistics",
          id: videoIds.join(","),
        });
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?${videosParams}`,
        );
        if (videosRes.ok) {
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
        }
      }

      return (searchData.items ?? []).map((item) => {
        const videoId = item.id?.videoId ?? "";
        const stats = statsMap.get(videoId);
        return {
          externalId: videoId,
          title: item.snippet?.title ?? null,
          content: item.snippet?.description ?? item.snippet?.title ?? null,
          sourceUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
          canonicalUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
          publishedAt: item.snippet?.publishedAt ?? null,
          language: "ht",
          platform: "youtube" as const,
          engagement: {
            views: stats?.views ?? 0,
            likes: stats?.likes ?? 0,
            comments: stats?.comments ?? 0,
          },
          metadata: {
            channelTitle: item.snippet?.channelTitle,
            videoId,
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ??
              item.snippet?.thumbnails?.medium?.url ??
              item.snippet?.thumbnails?.default?.url,
          },
        };
      });
    },
  };
}

