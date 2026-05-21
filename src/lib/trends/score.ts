import { rawPostChannelKey } from "@/lib/trends/rawPostChannel";

type Timeframe = "daily" | "weekly";

const TIMEFRAME_HOURS: Record<Timeframe, number> = {
  daily: 24,
  weekly: 24 * 7,
};

/** Shorter half-life than before so “top” stories turn over faster as new posts land. */
const RECENCY_HALF_LIFE_HOURS = 5;

export function normalizedEngagement(engagement: {
  likes?: number;
  shares?: number;
  comments?: number;
  views?: number;
}) {
  return (
    (engagement.likes ?? 0) * 1.5 +
    (engagement.shares ?? 0) * 2.2 +
    (engagement.comments ?? 0) * 1.2 +
    (engagement.views ?? 0) * 0.01
  );
}

export function recencyBoost(publishedAt: string): number {
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  return Math.max(0.15, 1 / (1 + hoursAgo / RECENCY_HALF_LIFE_HOURS));
}

export function calculateTrendComponents(input: {
  mentionCount: number;
  engagement: ReturnType<typeof normalizedEngagement>;
  recencyAverage: number;
  platformCount: number;
  socialChannelCount: number;
}) {
  const frequencyScore = Math.log2(1 + input.mentionCount) * 20;
  const engagementScore = Math.log10(1 + input.engagement) * 24;
  const recencyScore = input.recencyAverage * 20;
  const overlapBonus = Math.max(0, input.platformCount - 1) * 10;
  const socialDiversityBonus = Math.min(18, input.socialChannelCount * 5);
  const trendScore =
    frequencyScore + engagementScore + recencyScore + overlapBonus + socialDiversityBonus;

  return {
    trendScore: Number(trendScore.toFixed(2)),
    frequencyScore: Number(frequencyScore.toFixed(2)),
    engagementScore: Number(engagementScore.toFixed(2)),
    recencyScore: Number(recencyScore.toFixed(2)),
    overlapBonus: Number(overlapBonus.toFixed(2)),
  };
}

export async function computeTrendScores(timeframe: Timeframe) {
  const { supabaseAdmin } = await import("@/lib/db/client");
  const since = new Date(Date.now() - TIMEFRAME_HOURS[timeframe] * 3600 * 1000).toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("cluster_items")
    .select(
      "cluster_id,raw_posts!inner(platform,published_at,engagement,raw_metadata,source_url),clusters!inner(id,trend_category)",
    )
    .gte("raw_posts.published_at", since);

  if (error) {
    throw error;
  }

  const byCluster = new Map<
    string,
    {
      frequency: number;
      engagement: number;
      recency: number;
      platforms: Set<string>;
      socialChannels: Set<string>;
    }
  >();

  for (const item of rows ?? []) {
    const clusterId = item.cluster_id as string;
    const post = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
    const stats = byCluster.get(clusterId) ?? {
      frequency: 0,
      engagement: 0,
      recency: 0,
      platforms: new Set<string>(),
      socialChannels: new Set<string>(),
    };
    stats.frequency += 1;
    stats.engagement += normalizedEngagement(post.engagement ?? {});
    stats.recency += recencyBoost(post.published_at);
    stats.platforms.add(post.platform);
    const channel = rawPostChannelKey({
      platform: post.platform as string,
      raw_metadata: post.raw_metadata,
      source_url: post.source_url as string | null | undefined,
    });
    stats.socialChannels.add(channel);
    byCluster.set(clusterId, stats);
  }

  const output: Array<{
    cluster_id: string;
    timeframe: Timeframe;
    trend_score: number;
    frequency_score: number;
    engagement_score: number;
    recency_score: number;
    overlap_bonus: number;
    computed_at: string;
  }> = [];

  for (const [clusterId, stats] of byCluster.entries()) {
    const socialRelevant = new Set(["x", "instagram", "tiktok", "facebook"]);
    const socialChannelCount = [...stats.socialChannels].filter((c) => socialRelevant.has(c)).length;

    const components = calculateTrendComponents({
      mentionCount: stats.frequency,
      engagement: stats.engagement,
      recencyAverage: stats.recency / Math.max(1, stats.frequency),
      platformCount: stats.platforms.size,
      socialChannelCount,
    });

    output.push({
      cluster_id: clusterId,
      timeframe,
      trend_score: components.trendScore,
      frequency_score: components.frequencyScore,
      engagement_score: components.engagementScore,
      recency_score: components.recencyScore,
      overlap_bonus: components.overlapBonus,
      computed_at: new Date().toISOString(),
    });
  }

  if (output.length > 0) {
    const { error: writeError } = await supabaseAdmin.from("trend_scores").insert(output);
    if (writeError) {
      throw writeError;
    }
  }

  return {
    timeframe,
    clustersScored: output.length,
  };
}

