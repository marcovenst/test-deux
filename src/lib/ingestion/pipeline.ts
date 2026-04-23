import { supabaseAdmin } from "@/lib/db/client";
import { haitianInfluencers } from "@/lib/content/influencers";
import { normalizeRecord, normalizedPostToRawPostRow } from "@/lib/ingestion/normalize";
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

  const adapters: SourceAdapter[] = [
    createRssAdapter(DEFAULT_RSS_FEEDS),
    createScrapeAdapter(DEFAULT_SCRAPE_SOURCES),
    createScrapeAdapter(INFLUENCER_SOCIAL_SCRAPES),
    createRedditAdapter("Haiti OR Ayiti OR Haitian OR Kreyol"),
    createRedditAdapter("Haitian immigration OR USCIS OR TPS Haiti OR parole Haiti"),
    createYoutubeAdapter("Haiti OR Ayiti diaspora news"),
    createYoutubeAdapter("USCIS Haitian TPS update OR Haitian immigration lawyer"),
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

