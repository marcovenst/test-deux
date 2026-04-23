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
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
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

  const parsed = summarySchema.parse(JSON.parse(text));
  await supabaseAdmin.from("cluster_summaries").upsert(
    {
      cluster_id: cluster.clusterId,
      cluster_title: parsed.cluster_title,
      summary: parsed.summary,
      key_points: parsed.key_points,
      trend_reason: parsed.trend_reason,
      sentiment: parsed.sentiment,
      tags: parsed.tags,
      llm_model: "claude-sonnet-4-20250514",
      prompt_version: SUMMARY_PROMPT_VERSION,
    },
    {
      onConflict: "cluster_id",
    },
  );
}

export async function runSummarizationJob() {
  if (!isConfigured(getEnv().ANTHROPIC_API_KEY)) {
    return {
      attempted: 0,
      summarized: 0,
      failures: [{ clusterId: "all", error: "ANTHROPIC_API_KEY not configured" }],
    };
  }
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

