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
const FALLBACK_ANTHROPIC_MODELS = [
  "claude-3-7-sonnet-latest",
  "claude-3-5-sonnet-latest",
  "claude-sonnet-4-20250514",
  "claude-3-5-sonnet-20241022",
] as const;

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
  let modelLabel = "fallback-creole-v1";
  const env = getEnv();
  const configuredModel = env.ANTHROPIC_MODEL?.trim();
  const requestedModel = configuredModel || "claude-3-5-sonnet-latest";
  if (!anthropic) {
    parsed = buildFallbackSummary(cluster);
    modelLabel = "fallback-creole-v1";
  } else {
    const userPrompt = buildUserPrompt({
      clusterId: cluster.clusterId,
      candidateTitle: cluster.title,
      posts: cluster.posts,
    });

    let message: Awaited<ReturnType<typeof anthropic.messages.create>> | null = null;
    let usedModel = requestedModel;
    let lastModelError: Error | null = null;
    const modelCandidates = Array.from(
      new Set([requestedModel, ...FALLBACK_ANTHROPIC_MODELS]),
    );
    for (const candidate of modelCandidates) {
      try {
        message = await anthropic.messages.create({
          model: candidate,
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
        usedModel = candidate;
        break;
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        const notFound = messageText.includes("not_found_error") || messageText.includes("model:");
        if (!notFound) {
          throw error;
        }
        lastModelError = error instanceof Error ? error : new Error(messageText);
      }
    }

    if (!message) {
      if (lastModelError) {
        console.warn(
          `Summarization model unavailable for cluster ${cluster.clusterId}; using fallback summary`,
          lastModelError.message,
        );
      }
      parsed = buildFallbackSummary(cluster);
      modelLabel = "fallback-creole-v1";
    } else {
      const text = message.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");

      parsed = summarySchema.parse(JSON.parse(text));
      parsed = {
        ...parsed,
        summary: normalizeSummaryText(parsed.summary),
      };
      modelLabel = usedModel;
    }
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
      llm_model: modelLabel,
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

function ensureTrailingPeriod(text: string) {
  const cleaned = text.trim();
  if (!cleaned) {
    return cleaned;
  }
  if (/[.!?…]$/.test(cleaned)) {
    return cleaned;
  }
  return `${cleaned}.`;
}

function stripRezimePrefix(text: string) {
  return text.replace(/^\s*rezime\s*:?\s*/i, "").trim();
}

function stripSourceMentions(text: string) {
  return normalizeWhitespace(
    text
      .replace(/\b(source|sous)\b[:\s-]*/gi, "")
      .replace(/\b(rss-news|haitian-media-scrape|facebook|youtube|tiktok|x|twitter|instagram|reddit)\b/gi, "")
      .replace(/\s+/g, " "),
  );
}

function normalizeSummaryText(text: string) {
  const withoutPrefix = stripRezimePrefix(normalizeWhitespace(text));
  if (!withoutPrefix) {
    return "Sijè sa a ap devlope, n ap kontinye suiv pwen prensipal yo.";
  }
  return ensureTrailingPeriod(withoutPrefix);
}

function cleanSourceFact(value: string) {
  return normalizeWhitespace(
    value
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\[[^\]]+\]\([^)]+\)/g, "")
      .replace(/\s+/g, " "),
  );
}

function extractSourceFact(post: ClusterWithPosts["posts"][number], maxLength = 180) {
  const raw = post.content?.trim() ? post.content : post.title;
  const sentence = cleanSourceFact(raw).split(/[.!?]\s+/)[0] ?? "";
  return trimSentence(sentence, maxLength);
}

function stableIndex(seed: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }
  const value = hash;
  return modulo > 0 ? value % modulo : 0;
}

function buildFallbackEnding(input: {
  cluster: ClusterWithPosts;
  hasSecondPoint: boolean;
  sentiment: SummaryPayload["sentiment"];
}) {
  const neutralEndings = input.hasSecondPoint
    ? [
        "Dosye a kontinye devlope ak nouvo detay.",
        "Plizyè moun ap suiv kijan sitiyasyon an ap evolye.",
        "Sijè a rete nan sant diskisyon jounen an.",
      ]
    : [
        "Nouvèl la ap fè anpil pale nan kominote a.",
        "Sijè a atire anpil atansyon jodi a.",
        "Plizyè moun ap pataje opinyon yo sou dosye a.",
      ];

  const positiveEndings = [
    "Anpil reyaksyon montre yon ton pozitif sou dosye a.",
    "Kominote a resevwa nouvèl la ak anpil espwa.",
    "Sa pote yon enèji pozitif nan diskisyon yo.",
  ];

  const negativeEndings = [
    "Nouvèl la leve anpil kestyon ak enkyetid.",
    "Gen anpil deba sou konsekans dosye sa a.",
    "Anpil moun ap mande plis klarifikasyon sou sitiyasyon an.",
  ];

  const endingPool =
    input.sentiment === "positive"
      ? positiveEndings
      : input.sentiment === "negative"
        ? negativeEndings
        : neutralEndings;

  const seed = `${input.cluster.clusterId}:${input.cluster.title}:${input.sentiment}:${input.hasSecondPoint}`;
  return endingPool[stableIndex(seed, endingPool.length)] ?? neutralEndings[0];
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
    .map((post) => extractSourceFact(post, 140))
    .filter(Boolean)
    .slice(0, 3);
  const mainPoint = stripSourceMentions(
    trimSentence(points[0] ?? cluster.title, 180),
  );
  const secondaryPoint = stripSourceMentions(trimSentence(points[1] ?? "", 140));
  const topicRef = trimSentence(mainPoint || cluster.title, 120);
  const sentiment = guessSentiment(cluster);
  const hasSecondPoint = Boolean(
    secondaryPoint && secondaryPoint.toLowerCase() !== mainPoint.toLowerCase(),
  );
  const ending = buildFallbackEnding({
    cluster,
    hasSecondPoint,
    sentiment,
  });
  const summaryBody =
    hasSecondPoint
      ? `Sijè prensipal la konsène "${topicRef}". ${ending}`
      : `Sijè prensipal la konsène "${topicRef}". ${ending}`;
  const summary = normalizeSummaryText(summaryBody);

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
    summary,
    key_points: points.length > 0 ? points : ["Nouvèl yo ap kontinye mete ajou nan kèk minit."],
    trend_reason:
      "Sijè a rete cho paske plizyè sous ap rapòte menm dosye a pandan kominote a ap reyaji sou konsekans li yo.",
    sentiment,
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

