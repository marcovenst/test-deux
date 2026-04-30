import { supabaseAdmin } from "@/lib/db/client";
import { haitianInfluencers } from "@/lib/content/influencers";
import { normalizeRecord, normalizedPostToRawPostRow } from "@/lib/ingestion/normalize";
import { getEnv } from "@/lib/config/env";
import { createApifySocialAdapter } from "@/lib/ingestion/sources/apifySocial";
import { createRedditAdapter } from "@/lib/ingestion/sources/reddit";
import { createRssAdapter } from "@/lib/ingestion/sources/rss";
import { createScrapeAdapter } from "@/lib/ingestion/sources/scrape";
import { createXApifyAdapter } from "@/lib/ingestion/sources/xApify";
import { createYoutubeAdapter } from "@/lib/ingestion/sources/youtube";
import type { FeedSourceConfig, ScrapeSourceConfig, SourceAdapter } from "@/lib/ingestion/types";

const DEFAULT_RSS_FEEDS: FeedSourceConfig[] = [
  { url: "https://haitiantimes.com/feed/", sourceName: "Haitian Times" },
  { url: "https://lenouvelliste.com/rss.xml", sourceName: "Le Nouvelliste" },
  {
    url: "https://www.uscis.gov/newsroom/all-news",
    sourceName: "USCIS Newsroom",
  },
];

const DEFAULT_SCRAPE_SOURCES: ScrapeSourceConfig[] = [
  {
    url: "https://haitiantimes.com",
    sourceName: "Haitian Times",
    articleSelector: "article",
    titleSelector: "h2, h3",
    linkSelector: "a",
    contentSelector: "p",
    timeSelector: "time",
  },
  {
    url: "https://loopnews.com/content/haiti",
    sourceName: "Loop News Haiti",
    articleSelector: "article",
    titleSelector: "h2, h3",
    linkSelector: "a",
    contentSelector: "p",
    timeSelector: "time",
  },
  {
    url: "https://www.uscis.gov/newsroom",
    sourceName: "USCIS",
    articleSelector: "article, .views-row, .content",
    titleSelector: "h2, h3, a",
    linkSelector: "a",
    contentSelector: "p",
    timeSelector: "time",
  },
];

const INFLUENCER_SOCIAL_SCRAPES: ScrapeSourceConfig[] = haitianInfluencers.flatMap(
  (influencer) => [
    ...influencer.facebookProfiles.map((url) => ({
      url,
      sourceName: `${influencer.name} Facebook`,
      articleSelector: "div[role='article'], article, div",
      titleSelector: "h1, h2, h3, span",
      linkSelector: "a",
      contentSelector: "p, span",
      timeSelector: "time",
    })),
    ...influencer.tiktokProfiles.map((url) => ({
      url,
      sourceName: `${influencer.name} TikTok`,
      articleSelector: "div[data-e2e='search_top-item'], div, article",
      titleSelector: "h3, h2, strong, span",
      linkSelector: "a",
      contentSelector: "p, span",
      timeSelector: "time",
    })),
  ],
);

const CATEGORY_QUERY_HINTS: Record<string, string[]> = {
  politics: ["Haiti politics", "Ayiti eleksyon", "Haitian government"],
  immigration: ["Haitian immigration", "TPS Haiti", "USCIS Haiti update"],
  sports: ["Haiti football", "Grenadiers", "Haitian sports"],
  music: ["Haitian music", "kompa new release", "Ayiti mizik"],
  culture: ["Haitian culture", "Ayiti kilti", "Haitian festivals"],
  disaster: ["Haiti emergency", "Ayiti dezas", "Haiti weather alert"],
  community: ["Haitian community", "diaspora Haiti", "Ayiti kominote"],
  diaspora: ["Haitian diaspora", "Ayisyen diaspora", "Haiti abroad"],
  funny: ["Haitian funny videos", "Ayiti komik", "Haiti meme viral"],
  religion: ["Haiti church community", "Ayiti relijyon", "Haitian gospel and faith"],
  viral: ["Haiti viral videos", "Ayiti trending now", "Haitian internet buzz"],
  general: ["Haiti news", "Ayiti news", "Haitian latest updates"],
};

async function getEngagementBoostQueries(limit = 4) {
  const { data: clusters } = await supabaseAdmin
    .from("clusters")
    .select("id,trend_category,last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(250);

  if (!clusters || clusters.length === 0) {
    return [] as string[];
  }

  const clusterIds = clusters.map((cluster) => cluster.id as string);
  const { data: views } = await supabaseAdmin
    .from("cluster_views")
    .select("cluster_id,total_views")
    .in("cluster_id", clusterIds);
  const { data: plays } = await supabaseAdmin
    .from("cluster_play_metrics")
    .select("cluster_id,total_plays,total_play_seconds")
    .in("cluster_id", clusterIds);
  const { data: votes } = await supabaseAdmin
    .from("cluster_reaction_votes")
    .select("cluster_id")
    .in("cluster_id", clusterIds)
    .limit(20000);

  const viewMap = new Map((views ?? []).map((row) => [row.cluster_id as string, Number(row.total_views ?? 0)]));
  const playMap = new Map(
    (plays ?? []).map((row) => [
      row.cluster_id as string,
      {
        plays: Number(row.total_plays ?? 0),
        seconds: Number(row.total_play_seconds ?? 0),
      },
    ]),
  );
  const voteMap = new Map<string, number>();
  for (const row of votes ?? []) {
    const clusterId = row.cluster_id as string;
    voteMap.set(clusterId, (voteMap.get(clusterId) ?? 0) + 1);
  }

  const categoryScores = new Map<string, number>();
  for (const cluster of clusters) {
    const clusterId = cluster.id as string;
    const viewCount = viewMap.get(clusterId) ?? 0;
    const playStats = playMap.get(clusterId) ?? { plays: 0, seconds: 0 };
    const avgPlay = playStats.plays > 0 ? playStats.seconds / playStats.plays : 0;
    const voteCount = voteMap.get(clusterId) ?? 0;
    const engagementScore =
      Math.log10(viewCount + 1) * 1.6 +
      Math.log10(playStats.plays + 1) * 2.2 +
      Math.log10(avgPlay + 1) * 1.4 +
      Math.log10(voteCount + 1) * 2.1;
    const category = (cluster.trend_category as string | null) ?? "general";
    categoryScores.set(category, (categoryScores.get(category) ?? 0) + engagementScore);
  }

  const boostedCategories = [...categoryScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  return boostedCategories
    .flatMap((category) => CATEGORY_QUERY_HINTS[category] ?? [])
    .slice(0, limit);
}

async function createIngestionRun(sourceName: string, platform: SourceAdapter["source"]["platform"]) {
  const { data, error } = await supabaseAdmin
    .from("ingestion_runs")
    .insert({
      source_name: sourceName,
      source_platform: platform,
      status: "started",
    })
    .select("id")
    .single();
  if (error) {
    throw error;
  }
  return data.id as string;
}

async function updateIngestionRun(
  runId: string,
  input: {
    status: "succeeded" | "failed";
    itemsSeen: number;
    itemsWritten: number;
    error?: string;
  },
) {
  await supabaseAdmin
    .from("ingestion_runs")
    .update({
      status: input.status,
      items_seen: input.itemsSeen,
      items_written: input.itemsWritten,
      error: input.error ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

async function touchSourceHealth(
  sourceName: string,
  platform: SourceAdapter["source"]["platform"],
  input: { success: boolean; latencyMs: number; error?: string },
) {
  const now = new Date().toISOString();
  const patch = input.success
    ? {
        source_name: sourceName,
        source_platform: platform,
        last_success_at: now,
        consecutive_failures: 0,
        avg_latency_ms: input.latencyMs,
        updated_at: now,
      }
    : {
        source_name: sourceName,
        source_platform: platform,
        last_failure_at: now,
        updated_at: now,
        metadata: {
          last_error: input.error ?? "unknown",
        },
      };

  await supabaseAdmin.from("source_health").upsert(patch, {
    onConflict: "source_name",
  });
}

async function writeNormalizedRecords(
  source: SourceAdapter["source"],
  records: Awaited<ReturnType<SourceAdapter["fetchRecords"]>>,
) {
  let written = 0;
  for (const record of records) {
    const normalized = normalizeRecord(record, source);
    const row = normalizedPostToRawPostRow(normalized);
    if (!row) {
      continue;
    }

    const dedupeQuery = supabaseAdmin
      .from("raw_posts")
      .select("id")
      .or(
        [
          row.canonical_url_hash
            ? `canonical_url_hash.eq.${row.canonical_url_hash}`
            : null,
          row.content_fingerprint
            ? `content_fingerprint.eq.${row.content_fingerprint}`
            : null,
        ]
          .filter(Boolean)
          .join(","),
      )
      .limit(1);

    const { data: existing } = await dedupeQuery;
    if (existing && existing.length > 0) {
      continue;
    }

    const { error } = await supabaseAdmin.from("raw_posts").insert(row);
    if (!error) {
      written += 1;
    }
  }

  return written;
}

export async function runIngestionPipeline() {
  const env = getEnv();
  const engagementBoostQueries = await getEngagementBoostQueries();
  const influencerXQueries = haitianInfluencers.flatMap((influencer) => {
    const aliasTerms = influencer.aliases;
    const handleTerms = influencer.xHandles.map((handle) => `from:${handle}`);
    return [...aliasTerms, ...handleTerms];
  });

  const influencerYouTubeQueries = haitianInfluencers.flatMap((influencer) =>
    influencer.youtubeQueries.map((query) => ({
      query,
      sourceName: `youtube-${influencer.name.toLowerCase().replace(/\s+/g, "-")}`,
    })),
  );
  const influencerSocialQueries = haitianInfluencers.flatMap((influencer) => influencer.aliases);
  const influencerFacebookUrls = haitianInfluencers.flatMap((influencer) => influencer.facebookProfiles);
  const baseFacebookUrls = [
    "https://www.facebook.com/HaitianTimes",
    "https://www.facebook.com/lenouvelliste",
  ];
  const facebookUrls = Array.from(new Set([...baseFacebookUrls, ...influencerFacebookUrls])).slice(
    0,
    30,
  );

  const adapters: SourceAdapter[] = [
    createRssAdapter(DEFAULT_RSS_FEEDS),
    createScrapeAdapter(DEFAULT_SCRAPE_SOURCES),
    createScrapeAdapter(INFLUENCER_SOCIAL_SCRAPES),
    createRedditAdapter("Haiti OR Ayiti OR Haitian OR Kreyol"),
    createRedditAdapter("Haitian immigration OR USCIS OR TPS Haiti OR parole Haiti"),
    ...engagementBoostQueries.map((query, index) =>
      createRedditAdapter(query, { sourceName: `reddit-engagement-${index + 1}` }),
    ),
    createYoutubeAdapter("Haiti OR Ayiti diaspora news"),
    createYoutubeAdapter("USCIS Haitian TPS update OR Haitian immigration lawyer"),
    ...engagementBoostQueries.map((query, index) =>
      createYoutubeAdapter(query, {
        sourceName: `youtube-engagement-${index + 1}`,
        maxResults: 20,
      }),
    ),
    ...influencerYouTubeQueries.map((item) =>
      createYoutubeAdapter(item.query, {
        sourceName: item.sourceName,
        maxResults: 15,
      }),
    ),
    createXApifyAdapter(["Haiti", "Ayiti", "Haitian", "Kreyol"]),
    createXApifyAdapter(["USCIS Haiti", "Haitian TPS", "Haitian immigration lawyer", "parole Haiti"], {
      sourceName: "x-apify-immigration",
      maxItems: 150,
    }),
    createXApifyAdapter(influencerXQueries, {
      sourceName: "x-apify-influencers",
      maxItems: 150,
    }),
    ...engagementBoostQueries.map((query, index) =>
      createXApifyAdapter([query, "Haiti", "Ayiti"], {
        sourceName: `x-apify-engagement-${index + 1}`,
        maxItems: 120,
      }),
    ),
    createApifySocialAdapter({
      sourceName: "instagram-apify",
      network: "instagram",
      actorId: env.APIFY_INSTAGRAM_ACTOR_ID,
      searchTerms: ["Haiti", "Ayiti", "Haitian", "Kreyol", "diaspora ayisyen"],
      maxItems: 120,
    }),
    createApifySocialAdapter({
      sourceName: "instagram-apify-influencers",
      network: "instagram",
      actorId: env.APIFY_INSTAGRAM_ACTOR_ID,
      searchTerms: influencerSocialQueries,
      maxItems: 120,
    }),
    createApifySocialAdapter({
      sourceName: "tiktok-apify",
      network: "tiktok",
      actorId: env.APIFY_TIKTOK_ACTOR_ID,
      searchTerms: ["Haiti", "Ayiti", "Haitian", "Kreyol", "viral ayiti"],
      maxItems: 120,
    }),
    createApifySocialAdapter({
      sourceName: "tiktok-apify-influencers",
      network: "tiktok",
      actorId: env.APIFY_TIKTOK_ACTOR_ID,
      searchTerms: influencerSocialQueries,
      maxItems: 120,
    }),
    createApifySocialAdapter({
      sourceName: "facebook-apify",
      network: "facebook",
      actorId: env.APIFY_FACEBOOK_ACTOR_ID,
      searchTerms: ["Haiti", "Ayiti", "diaspora ayisyen"],
      maxItems: 100,
      inputCandidates: [
        { facebookUrls, resultsLimit: 100, includeVideoTranscript: false },
        { startUrls: facebookUrls.map((url) => ({ url })), maxItems: 100 },
      ],
    }),
    createApifySocialAdapter({
      sourceName: "facebook-apify-influencers",
      network: "facebook",
      actorId: env.APIFY_FACEBOOK_ACTOR_ID,
      searchTerms: influencerSocialQueries,
      maxItems: 100,
      inputCandidates: [
        { facebookUrls: influencerFacebookUrls, resultsLimit: 100, includeVideoTranscript: false },
        { startUrls: influencerFacebookUrls.map((url) => ({ url })), maxItems: 100 },
      ],
    }),
  ];

  const results: Array<{
    source: string;
    platform: string;
    itemsSeen: number;
    itemsWritten: number;
    ok: boolean;
    error?: string;
  }> = [];

  for (const adapter of adapters) {
    const started = Date.now();
    const runId = await createIngestionRun(adapter.source.name, adapter.source.platform);

    try {
      const records = await adapter.fetchRecords();
      const itemsWritten = await writeNormalizedRecords(adapter.source, records);
      const latencyMs = Date.now() - started;
      await updateIngestionRun(runId, {
        status: "succeeded",
        itemsSeen: records.length,
        itemsWritten,
      });
      await touchSourceHealth(adapter.source.name, adapter.source.platform, {
        success: true,
        latencyMs,
      });
      results.push({
        source: adapter.source.name,
        platform: adapter.source.platform,
        itemsSeen: records.length,
        itemsWritten,
        ok: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      const latencyMs = Date.now() - started;
      await updateIngestionRun(runId, {
        status: "failed",
        itemsSeen: 0,
        itemsWritten: 0,
        error: message,
      });
      await touchSourceHealth(adapter.source.name, adapter.source.platform, {
        success: false,
        latencyMs,
        error: message,
      });
      results.push({
        source: adapter.source.name,
        platform: adapter.source.platform,
        itemsSeen: 0,
        itemsWritten: 0,
        ok: false,
        error: message,
      });
    }
  }

  return results;
}

