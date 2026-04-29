import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { getEnv, isConfigured } from "@/lib/config/env";
import { supabaseAdmin } from "@/lib/db/client";
import { buildUserPrompt, SUMMARY_PROMPT_VERSION, systemPrompt } from "@/lib/summarization/prompts";

const summarySchema = z.object({
  cluster_title: z.string().min(1),
  summary: z.string().min(1),
  key_points: z.array(z.string().min(1)).max(8),
  trend_reason: z.string().min(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  tags: z.array(z.string().min(1)).max(10),
});

type ClusterWithPosts = {
  clusterId: string;
  title: string;
  posts: Array<{
    title: string;
    content: string;
    source_name: string;
    source_url: string;
    platform: string;
    published_at: string;
    engagement: {
      likes: number;
      shares: number;
      comments: number;
      views: number;
    };
  }>;
};

type SummaryPayload = z.infer<typeof summarySchema>;

function getAnthropicClient() {
  const env = getEnv();
  if (!isConfigured(env.ANTHROPIC_API_KEY)) {
    return null;
  }
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
}

async function fetchClustersForSummary(limit = 20): Promise<ClusterWithPosts[]> {
  const { data: clusters, error } = await supabaseAdmin
    .from("clusters")
    .select("id,title")
    .eq("status", "active")
    .order("last_seen_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }

  const results: ClusterWithPosts[] = [];
  for (const cluster of clusters ?? []) {
    const { data: items } = await supabaseAdmin
      .from("cluster_items")
      .select(
        "raw_posts!inner(title,content,source_name,source_url,platform,published_at,engagement)",
      )
      .eq("cluster_id", cluster.id)
      .limit(12);
    const posts = (items ?? [])
      .map((item) => (Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts))
      .filter(Boolean) as ClusterWithPosts["posts"];
    if (posts.length === 0) {
      continue;
    }
    results.push({
      clusterId: cluster.id as string,
      title: (cluster.title as string | null) ?? posts[0].title,
      posts,
    });
  }
  return results;
}

async function summarizeCluster(cluster: ClusterWithPosts) {
  const anthropic = getAnthropicClient();
  let parsed: SummaryPayload;
  if (!anthropic) {
    parsed = buildFallbackSummary(cluster);
  } else {
    const userPrompt = buildUserPrompt({
      clusterId: cluster.clusterId,
      candidateTitle: cluster.title,
      posts: cluster.posts,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1300,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");

    parsed = summarySchema.parse(JSON.parse(text));
  }
  await supabaseAdmin.from("cluster_summaries").upsert(
    {
      cluster_id: cluster.clusterId,
      cluster_title: parsed.cluster_title,
      summary: parsed.summary,
      key_points: parsed.key_points,
      trend_reason: parsed.trend_reason,
      sentiment: parsed.sentiment,
      tags: parsed.tags,
      llm_model: anthropic ? "claude-sonnet-4-20250514" : "fallback-creole-v1",
      prompt_version: SUMMARY_PROMPT_VERSION,
    },
    {
      onConflict: "cluster_id",
    },
  );
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function trimSentence(value: string, maxLength = 220) {
  const cleaned = normalizeWhitespace(value);
  if (!cleaned) {
    return "";
  }
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

function guessSentiment(cluster: ClusterWithPosts): SummaryPayload["sentiment"] {
  const text = `${cluster.title} ${cluster.posts.map((item) => item.title).join(" ")}`.toLowerCase();
  const negativeHints = ["crise", "crisis", "violence", "ensikirite", "danger", "catastrophe"];
  const positiveHints = ["win", "victory", "siksè", "celebration", "festival", "progress"];
  if (negativeHints.some((hint) => text.includes(hint))) {
    return "negative";
  }
  if (positiveHints.some((hint) => text.includes(hint))) {
    return "positive";
  }
  return "neutral";
}

function buildFallbackSummary(cluster: ClusterWithPosts): SummaryPayload {
  const topPosts = cluster.posts.slice(0, 3);
  const points = topPosts
    .map((post) => trimSentence(post.title || post.content, 140))
    .filter(Boolean)
    .slice(0, 3);

  const primarySnippet = trimSentence(topPosts[0]?.content ?? "", 220);
  const secondarySnippet = trimSentence(topPosts[1]?.content ?? "", 180);
  const summaryParts = [
    `Rezime rapid sou sijè sa a: "${trimSentence(cluster.title, 110)}".`,
    primarySnippet
      ? `Pi gwo pwen yo soti nan sous yo montre ke ${primarySnippet.toLowerCase()}.`
      : "Pi gwo pwen yo ap soti nan plizyè sous serye sou entènèt la.",
    secondarySnippet
      ? `Gen lòt sous ki ajoute ke ${secondarySnippet.toLowerCase()}.`
      : "N ap kontinye rafrechi done yo pandan nouvo post ap antre.",
    "Rezime sa a fèt otomatikman an Kreyòl pandan mòd AI avanse a poko aktive.",
  ];

  const allText = `${cluster.title} ${cluster.posts.map((post) => post.title).join(" ")}`.toLowerCase();
  const tags = Array.from(
    new Set(
      allText
        .split(/[^a-z0-9à-ÿ]+/i)
        .map((item) => item.trim())
        .filter((item) => item.length >= 4),
    ),
  ).slice(0, 8);

  return {
    cluster_title: trimSentence(cluster.title, 120) || "Sijè kominote a",
    summary: summaryParts.join(" "),
    key_points: points.length > 0 ? points : ["Nouvèl yo ap kontinye mete ajou nan kèk minit."],
    trend_reason:
      "Sijè a sou tandans paske plizyè sous ap pale de li an menm tan epi kominote a ap reyaji sou li sou rezo sosyal yo.",
    sentiment: guessSentiment(cluster),
    tags: tags.length > 0 ? tags : ["kominote", "aktyalite"],
  };
}

export async function runSummarizationJob() {
  const clusters = await fetchClustersForSummary();
  let summarized = 0;
  const failures: Array<{ clusterId: string; error: string }> = [];

  for (const cluster of clusters) {
    try {
      await summarizeCluster(cluster);
      summarized += 1;
    } catch (error) {
      failures.push({
        clusterId: cluster.clusterId,
        error: error instanceof Error ? error.message : "unknown summary error",
      });
    }
  }

  return {
    attempted: clusters.length,
    summarized,
    failures,
  };
}

