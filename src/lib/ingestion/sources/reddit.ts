import { getEnv, isConfigured } from "@/lib/config/env";
import type { SourceAdapter } from "@/lib/ingestion/types";

type RedditListing = {
  data?: {
    children?: Array<{
      data: {
        id: string;
        title: string;
        selftext?: string;
        permalink?: string;
        created_utc?: number;
        ups?: number;
        num_comments?: number;
        subreddit?: string;
      };
    }>;
  };
};

async function getRedditToken() {
  const env = getEnv();
  if (
    !env.REDDIT_CLIENT_ID ||
    !env.REDDIT_CLIENT_SECRET ||
    !isConfigured(env.REDDIT_CLIENT_ID) ||
    !isConfigured(env.REDDIT_CLIENT_SECRET)
  ) {
    return null;
  }
  const clientId = env.REDDIT_CLIENT_ID;
  const clientSecret = env.REDDIT_CLIENT_SECRET;
  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": env.REDDIT_USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit auth failed (${res.status})`);
  }

  const payload = (await res.json()) as { access_token: string };
  return payload.access_token;
}

export function createRedditAdapter(query = "Haiti OR Haitian"): SourceAdapter {
  return {
    source: {
      name: "reddit-search",
      platform: "reddit",
    },
    async fetchRecords() {
      const env = getEnv();
      const token = await getRedditToken();
      if (!token) {
        return [];
      }
      const params = new URLSearchParams({
        q: query,
        sort: "new",
        type: "link",
        limit: "50",
        t: "day",
      });
      const res = await fetch(`https://oauth.reddit.com/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": env.REDDIT_USER_AGENT,
        },
      });

      if (!res.ok) {
        throw new Error(`Reddit fetch failed (${res.status})`);
      }

      const payload = (await res.json()) as RedditListing;
      const children = payload.data?.children ?? [];

      return children.map((item) => {
        const post = item.data;
        const sourceUrl = post.permalink
          ? `https://reddit.com${post.permalink}`
          : null;
        return {
          externalId: post.id,
          title: post.title,
          content: post.selftext ?? post.title,
          sourceUrl,
          canonicalUrl: sourceUrl,
          publishedAt: post.created_utc
            ? new Date(post.created_utc * 1000).toISOString()
            : null,
          language: "en",
          platform: "reddit" as const,
          engagement: {
            likes: post.ups ?? 0,
            comments: post.num_comments ?? 0,
          },
          metadata: {
            subreddit: post.subreddit,
          },
        };
      });
    },
  };
}

