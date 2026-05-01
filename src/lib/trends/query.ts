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
  viewCount: number;
  reactions: {
    saRaz: number;
    saKomik: number;
    saEnteresan: number;
    totalVotes: number;
  };
  reactionScore: number;
  playCount: number;
  averagePlaySeconds: number;
  interactionScore: number;
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

function buildCreoleFallbackSummary(input: {
  clusterTitle: string;
  sourceSnippets: string[];
}) {
  const snippets = input.sourceSnippets
    .map((snippet) => snippet.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (snippets.length === 0) {
    return `Rezime rapid: sijè "${input.clusterTitle}" ap suiv pa kominote a pandan nou kontinye mete ajou plis detay.`;
  }
  return `Rezime rapid sou "${input.clusterTitle}": ${snippets.join(" ")}. N ap kontinye mete ajou pwen yo an Kreyòl.`;
}

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
    viewCount: 0,
    reactions: {
      saRaz: 0,
      saKomik: 0,
      saEnteresan: 0,
      totalVotes: 0,
    },
    reactionScore: 0,
    playCount: 0,
    averagePlaySeconds: 0,
    interactionScore: 0,
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
  const influencerTopics = haitianInfluencers.flatMap((influencer) => [
    {
      influencer: influencer.name,
      focus: influencer.focus,
      topic: `Sa ${influencer.name} ap di sou sijè ki cho nan kominote ayisyen an`,
      platform: "X / YouTube",
    },
    {
      influencer: influencer.name,
      focus: influencer.focus,
      topic: `Videyo viral ak opinyon ${influencer.name} pataje jodi a`,
      platform: "TikTok / Facebook",
    },
  ]);

  const communityVoiceTopics: InfluencerTopic[] = [
    {
      influencer: "Blogè ak analis sou entènèt",
      focus: "analiz cho, opinyon piblik, deba",
      topic: "Sa blogè ayisyen yo ap mete devan sou nouvèl ki pi diskite yo",
      platform: "X / Facebook / YouTube",
    },
    {
      influencer: "Animatè medya ak jounalis",
      focus: "aktyalite, entèvyou, verifikasyon enfòmasyon",
      topic: "Pwen kle medya ayisyen yo ap repete sou dosye jounen an",
      platform: "YouTube / Facebook / X",
    },
    {
      influencer: "Atis ak kreyatè",
      focus: "mizik, kilti, showbiz, tandans viral",
      topic: "Sa atis ak kreyatè yo ap pouse sou kilti ak videyo viral",
      platform: "TikTok / Instagram / YouTube",
    },
    {
      influencer: "Espòtif ak kominote espò",
      focus: "match, seleksyon, transfè, opinyon fanatik",
      topic: "Sa jwè, ansyen jwè, ak fanatik espò yo ap di sou pèfòmans ekip yo",
      platform: "X / YouTube / Facebook",
    },
    {
      influencer: "Aktè politik ak lidè opinyon",
      focus: "politik piblik, eleksyon, gouvènans",
      topic: "Mesaj politik ki pi pataje sou rezo sosyal nan kominote a",
      platform: "X / Facebook / medya sosyal",
    },
  ];

  return [...communityVoiceTopics, ...influencerTopics];
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
    const scoredClusterIds = Array.from(latestByCluster.keys());
    if (scoredClusterIds.length === 0) {
      return [];
    }

    let clusterMetaQuery = supabaseAdmin
      .from("clusters")
      .select("id,title,trend_category,last_seen_at")
      .in("id", scoredClusterIds.slice(0, 500));
    if (category && category !== "all") {
      clusterMetaQuery = clusterMetaQuery.eq("trend_category", category);
    }
    const { data: clusterMetaRows, error: clusterError } = await clusterMetaQuery;
    if (clusterError) {
      throw clusterError;
    }
    if (!clusterMetaRows || clusterMetaRows.length === 0) {
      return [];
    }

    const clusterMetaById = new Map(
      clusterMetaRows.map((cluster) => [cluster.id as string, cluster]),
    );
    const scopedScoredIds = scoredClusterIds.filter((id) => clusterMetaById.has(id));
    const baseClusterIds = scopedScoredIds.slice(0, 40);

    const { data: reactionRows } = await supabaseAdmin
      .from("cluster_reaction_votes")
      .select("cluster_id,reaction")
      .in("cluster_id", scopedScoredIds)
      .limit(20000);

    const reactionsByCluster = new Map<
      string,
      {
        saRaz: number;
        saKomik: number;
        saEnteresan: number;
        totalVotes: number;
      }
    >();

    for (const row of reactionRows ?? []) {
      const clusterId = row.cluster_id as string;
      const current = reactionsByCluster.get(clusterId) ?? {
        saRaz: 0,
        saKomik: 0,
        saEnteresan: 0,
        totalVotes: 0,
      };
      if (row.reaction === "sa_raz") {
        current.saRaz += 1;
      } else if (row.reaction === "sa_komik") {
        current.saKomik += 1;
      } else if (row.reaction === "sa_enteresan") {
        current.saEnteresan += 1;
      }
      current.totalVotes += 1;
      reactionsByCluster.set(clusterId, current);
    }

    const categoryReactionHeat = new Map<string, number>();
    for (const clusterId of baseClusterIds) {
      const cluster = clusterMetaById.get(clusterId);
      if (!cluster) {
        continue;
      }
      const votes = reactionsByCluster.get(clusterId)?.totalVotes ?? 0;
      if (votes <= 0) {
        continue;
      }
      const key = (cluster.trend_category as string | null) ?? "general";
      categoryReactionHeat.set(key, (categoryReactionHeat.get(key) ?? 0) + votes);
    }

    const boostedCategories = new Set(
      [...categoryReactionHeat.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([trendCategory]) => trendCategory),
    );

    const baseSet = new Set(baseClusterIds);
    const relatedCandidates = scopedScoredIds
      .filter((clusterId) => {
        if (baseSet.has(clusterId)) {
          return false;
        }
        const cluster = clusterMetaById.get(clusterId);
        if (!cluster) {
          return false;
        }
        const trendCategory = (cluster.trend_category as string | null) ?? "general";
        return boostedCategories.has(trendCategory);
      })
      .sort((a, b) => {
        const reactionDiff =
          (reactionsByCluster.get(b)?.totalVotes ?? 0) - (reactionsByCluster.get(a)?.totalVotes ?? 0);
        if (reactionDiff !== 0) {
          return reactionDiff;
        }
        return (
          (latestByCluster.get(b)?.score ?? 0) - (latestByCluster.get(a)?.score ?? 0)
        );
      })
      .slice(0, 20);

    const clusterIds =
      boostedCategories.size > 0 ? [...baseClusterIds, ...relatedCandidates] : baseClusterIds;
    const clusters = clusterIds
      .map((clusterId) => clusterMetaById.get(clusterId))
      .filter((value): value is NonNullable<(typeof clusterMetaRows)[number]> => Boolean(value));

    const { data: summaries } = await supabaseAdmin
      .from("cluster_summaries")
      .select("cluster_id,summary,sentiment,tags,cluster_title,llm_model");

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

    const { data: viewRows } = await supabaseAdmin
      .from("cluster_views")
      .select("cluster_id,total_views")
      .in("cluster_id", clusterIds);

    const viewsByCluster = new Map<string, number>(
      (viewRows ?? []).map((row) => [row.cluster_id as string, Number(row.total_views ?? 0)]),
    );
    const { data: playRows } = await supabaseAdmin
      .from("cluster_play_metrics")
      .select("cluster_id,total_plays,total_play_seconds")
      .in("cluster_id", clusterIds);

    const playsByCluster = new Map<
      string,
      {
        totalPlays: number;
        totalPlaySeconds: number;
      }
    >(
      (playRows ?? []).map((row) => [
        row.cluster_id as string,
        {
          totalPlays: Number(row.total_plays ?? 0),
          totalPlaySeconds: Number(row.total_play_seconds ?? 0),
        },
      ]),
    );

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
        const reactionStats = reactionsByCluster.get(cluster.id as string) ?? {
          saRaz: 0,
          saKomik: 0,
          saEnteresan: 0,
          totalVotes: 0,
        };
        const reactionScore = Number(
          Math.min(100, Math.log10(reactionStats.totalVotes + 1) * 20).toFixed(2),
        );
        const viewCount = viewsByCluster.get(cluster.id as string) ?? 0;
        const playStats = playsByCluster.get(cluster.id as string) ?? {
          totalPlays: 0,
          totalPlaySeconds: 0,
        };
        const averagePlaySeconds =
          playStats.totalPlays > 0 ? playStats.totalPlaySeconds / playStats.totalPlays : 0;
        const interactionScore = Number(
          (
            Math.min(100, Math.log10(viewCount + 1) * 18) +
            Math.min(100, Math.log10(playStats.totalPlays + 1) * 24) +
            Math.min(100, Math.log10(averagePlaySeconds + 1) * 20) +
            reactionScore
          ).toFixed(2),
        );
        const popularityScore = Number(
          (
            (latestByCluster.get(cluster.id as string)?.score ?? 0) * 0.24 +
            googleSearchScore * 0.24 +
            socialScore * 0.2 +
            reactionScore * 0.14 +
            interactionScore * 0.18
          ).toFixed(2),
        );

        const isFallbackSummary =
          !summary || (summary.llm_model as string | null | undefined) === "fallback-creole-v1";

        return {
          clusterId: cluster.id as string,
          title:
            (summary?.cluster_title as string | undefined) ??
            (cluster.title as string) ??
            "Untitled cluster",
          summary:
            (summary?.summary as string | undefined) ??
            buildCreoleFallbackSummary({
              clusterTitle: (cluster.title as string) ?? "sijè sa a",
              sourceSnippets: sources.map((source) => source.snippet ?? ""),
            }),
          trendCategory: (cluster.trend_category as string | null) ?? "general",
          trendScore: latestByCluster.get(cluster.id as string)?.score ?? 0,
          viewCount,
          reactions: reactionStats,
          reactionScore,
          playCount: playStats.totalPlays,
          averagePlaySeconds: Number(averagePlaySeconds.toFixed(1)),
          interactionScore,
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
          isFallbackSummary,
        };
      }),
    );

    const items: TrendFeedItem[] = itemsWithSignals
      .sort((a, b) => {
        if (a.isFallbackSummary !== b.isFallbackSummary) {
          return a.isFallbackSummary ? 1 : -1;
        }
        return (b.popularityScore ?? 0) - (a.popularityScore ?? 0);
      })
      .map(({ isFallbackSummary: _isFallbackSummary, ...item }) => item);

    if (items.length === 0) {
      return getFallbackFeed();
    }
    return items;
  } catch {
    return getFallbackFeed();
  }
}

