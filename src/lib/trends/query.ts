import { supabaseAdmin } from "@/lib/db/client";
import { fallbackCreoleTrends, haitianInfluencers } from "@/lib/content/influencers";
import { extractPostMedia } from "@/lib/media/postMedia";
import {
  computeSocialPopularityScore,
  extractCandidateKeywords,
  getGoogleSearchInterest,
  type PopularityWindow,
} from "@/lib/trends/popularity";

export type TrendFeedItem = {
  clusterId: string;
  title: string;
  summary: string;
  trendCategory: string;
  trendScore: number;
  popularityScore?: number;
  googleSearchScore?: number;
  socialScore?: number;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
  sourceCount: number;
  topSources: Array<{
    sourceName: string;
    sourceUrl: string;
    snippet: string;
    platform?: string;
    imageUrl?: string;
    videoUrl?: string;
    embedUrl?: string;
  }>;
  influencers?: string[];
};

export type InfluencerTopic = {
  influencer: string;
  focus: string;
  topic: string;
  platform: string;
};

const FOCUSED_SOCIAL_PLATFORMS = new Set(["tiktok", "x", "facebook", "youtube"]);

function normalizePlatformName(input: string) {
  const value = input.toLowerCase();
  if (value.includes("twitter")) {
    return "x";
  }
  if (value.includes("youtube")) {
    return "youtube";
  }
  if (value.includes("tiktok")) {
    return "tiktok";
  }
  if (value.includes("reddit")) {
    return "reddit";
  }
  if (value.includes("facebook")) {
    return "facebook";
  }
  return value;
}

function detectFocusedPlatform(input: {
  platform: string;
  sourceName?: string;
  sourceUrl?: string;
}) {
  const platform = normalizePlatformName(input.platform);
  if (platform === "x" || platform === "youtube" || platform === "tiktok" || platform === "facebook") {
    return platform;
  }

  const sourceBlob = `${input.sourceName ?? ""} ${input.sourceUrl ?? ""}`.toLowerCase();
  if (sourceBlob.includes("tiktok")) {
    return "tiktok";
  }
  if (sourceBlob.includes("facebook") || sourceBlob.includes("fb.com")) {
    return "facebook";
  }
  if (sourceBlob.includes("twitter.com") || sourceBlob.includes("x.com")) {
    return "x";
  }
  if (sourceBlob.includes("youtube")) {
    return "youtube";
  }
  return platform;
}

function getFallbackFeed(): TrendFeedItem[] {
  return fallbackCreoleTrends.map((item, index) => ({
    clusterId: `fallback-${index + 1}`,
    title: item.title,
    summary: item.summary,
    trendCategory: item.trendCategory,
    trendScore: item.trendScore,
    sentiment: item.sentiment,
    tags: item.tags,
    sourceCount: item.sourceCount,
    topSources: [
      {
        sourceName: "Koleksyon piblik entènèt",
        sourceUrl: "#",
        snippet: "Done tanporè pandan sistèm scraping ap ranmase done ap viv yo.",
      },
    ],
    influencers: haitianInfluencers.map((influencer) => influencer.name).slice(0, 2),
  }));
}

export function getInfluencerTopics(): InfluencerTopic[] {
  return haitianInfluencers.flatMap((influencer) => [
    {
      influencer: influencer.name,
      focus: influencer.focus,
      topic: `Sa ${influencer.name} ap di sou nouvèl cho nan kominote ayisyen an`,
      platform: "X / YouTube",
    },
    {
      influencer: influencer.name,
      focus: influencer.focus,
      topic: `Videyo viral ak opinyon ${influencer.name} pataje jodi a`,
      platform: "TikTok / Facebook",
    },
  ]);
}

export async function getTrendFeed(
  timeframe: "daily" | "weekly",
  category?: string,
  popularityWindow: PopularityWindow = "24h",
) {
  try {
    const { data: scores, error: scoresError } = await supabaseAdmin
      .from("trend_scores")
      .select("cluster_id,trend_score,timeframe,computed_at")
      .eq("timeframe", timeframe)
      .order("computed_at", { ascending: false })
      .limit(500);

    if (scoresError) {
      throw scoresError;
    }

    const latestByCluster = new Map<
      string,
      {
        score: number;
        computedAt: string;
      }
    >();
    for (const score of scores ?? []) {
      if (!latestByCluster.has(score.cluster_id)) {
        latestByCluster.set(score.cluster_id, {
          score: score.trend_score,
          computedAt: score.computed_at,
        });
      }
    }
    const clusterIds = Array.from(latestByCluster.keys()).slice(0, 40);
    if (clusterIds.length === 0) {
      return [];
    }

    let clusterQuery = supabaseAdmin
      .from("clusters")
      .select("id,title,trend_category")
      .in("id", clusterIds);
    if (category && category !== "all") {
      clusterQuery = clusterQuery.eq("trend_category", category);
    }
    const { data: clusters, error: clusterError } = await clusterQuery;
    if (clusterError) {
      throw clusterError;
    }

    const { data: summaries } = await supabaseAdmin
      .from("cluster_summaries")
      .select("cluster_id,summary,sentiment,tags,cluster_title");

    const summaryByCluster = new Map(
      (summaries ?? []).map((summary) => [summary.cluster_id as string, summary]),
    );

    const { data: clusterItems } = await supabaseAdmin
      .from("cluster_items")
      .select(
        "cluster_id,raw_posts!inner(source_name,source_url,snippet,platform,raw_metadata,title,engagement)",
      )
      .in("cluster_id", clusterIds)
      .limit(1000);

    const sourcesByCluster = new Map<string, TrendFeedItem["topSources"]>();
    for (const item of clusterItems ?? []) {
      const rawPost = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
      const existing = sourcesByCluster.get(item.cluster_id as string) ?? [];
      if (existing.some((source) => source.sourceUrl === rawPost.source_url)) {
        continue;
      }
      existing.push({
        sourceName: rawPost.source_name,
        sourceUrl: rawPost.source_url,
        snippet: rawPost.snippet ?? "",
        platform: rawPost.platform,
        ...extractPostMedia({
          sourceUrl: rawPost.source_url,
          platform: rawPost.platform,
          rawMetadata: (rawPost.raw_metadata as Record<string, unknown> | undefined) ?? {},
        }),
      });
      sourcesByCluster.set(item.cluster_id as string, existing);
    }

    const itemsWithSignals = await Promise.all(
      (clusters ?? []).map(async (cluster) => {
        const summary = summaryByCluster.get(cluster.id as string);
        const sources = sourcesByCluster.get(cluster.id as string) ?? [];
        const relevantItems = (clusterItems ?? []).filter(
          (item) => (item.cluster_id as string) === (cluster.id as string),
        );
        const focusedItems = relevantItems.filter((item) => {
          const rawPost = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
          const detected = detectFocusedPlatform({
            platform: rawPost.platform as string,
            sourceName: rawPost.source_name as string | undefined,
            sourceUrl: rawPost.source_url as string | undefined,
          });
          return FOCUSED_SOCIAL_PLATFORMS.has(detected);
        });

        const engagementTotals = (focusedItems.length > 0 ? focusedItems : relevantItems).reduce(
          (acc, item) => {
            const rawPost = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
            const engagement = (rawPost.engagement as {
              likes?: number;
              shares?: number;
              comments?: number;
              views?: number;
            }) ?? {
              likes: 0,
              shares: 0,
              comments: 0,
              views: 0,
            };
            acc.likes += engagement.likes ?? 0;
            acc.shares += engagement.shares ?? 0;
            acc.comments += engagement.comments ?? 0;
            acc.views += engagement.views ?? 0;
            return acc;
          },
          { likes: 0, shares: 0, comments: 0, views: 0 },
        );

        const platformSet = new Set(
          relevantItems.map((item) => {
            const rawPost = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
            return detectFocusedPlatform({
              platform: rawPost.platform as string,
              sourceName: rawPost.source_name as string | undefined,
              sourceUrl: rawPost.source_url as string | undefined,
            });
          }),
        );

        const baseText = [
          summary?.cluster_title as string | undefined,
          summary?.summary as string | undefined,
          cluster.title as string | undefined,
          ...relevantItems.slice(0, 3).map((item) => {
            const rawPost = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
            return rawPost.title as string;
          }),
        ]
          .filter(Boolean)
          .join(" ");

        const keywords = extractCandidateKeywords(baseText, 4);
        const googleScores = await Promise.all(
          keywords.map((keyword) => getGoogleSearchInterest(keyword, popularityWindow)),
        );
        const googleSearchScore =
          googleScores.length > 0
            ? Number(
                (googleScores.reduce((acc, value) => acc + value, 0) / googleScores.length).toFixed(
                  2,
                ),
              )
            : 0;
        const socialScore = computeSocialPopularityScore({
          engagementTotals,
          mentionCount: focusedItems.length > 0 ? focusedItems.length : relevantItems.length,
          platformCount: [...platformSet].filter((p) => FOCUSED_SOCIAL_PLATFORMS.has(p)).length || platformSet.size,
        });
        const popularityScore = Number(
          (
            (latestByCluster.get(cluster.id as string)?.score ?? 0) * 0.35 +
            googleSearchScore * 0.35 +
            socialScore * 0.3
          ).toFixed(2),
        );

        return {
          clusterId: cluster.id as string,
          title:
            (summary?.cluster_title as string | undefined) ??
            (cluster.title as string) ??
            "Untitled cluster",
          summary: (summary?.summary as string | undefined) ?? "Summary is being generated.",
          trendCategory: (cluster.trend_category as string | null) ?? "general",
          trendScore: latestByCluster.get(cluster.id as string)?.score ?? 0,
          popularityScore,
          googleSearchScore,
          socialScore,
          sentiment: (summary?.sentiment as TrendFeedItem["sentiment"]) ?? "neutral",
          tags: (summary?.tags as string[]) ?? [],
          sourceCount: sources.length,
          topSources: sources.slice(0, 3),
          influencers: sources
            .map((source) => {
              const lower = `${source.sourceName} ${source.snippet}`.toLowerCase();
              const matched = haitianInfluencers.find((influencer) =>
                influencer.aliases.some((alias) => lower.includes(alias.toLowerCase())),
              );
              return matched?.name;
            })
            .filter((value): value is string => Boolean(value)),
        };
      }),
    );

    const items: TrendFeedItem[] = itemsWithSignals.sort(
      (a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0),
    );

    if (items.length === 0) {
      return getFallbackFeed();
    }
    return items;
  } catch {
    return getFallbackFeed();
  }
}

