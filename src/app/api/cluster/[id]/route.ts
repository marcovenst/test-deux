import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db/client";
import { extractPostMedia } from "@/lib/media/postMedia";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data: cluster, error: clusterError } = await supabaseAdmin
    .from("clusters")
    .select("id,title,trend_category,last_seen_at,first_seen_at")
    .eq("id", id)
    .single();
  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  const { data: summary } = await supabaseAdmin
    .from("cluster_summaries")
    .select("summary,key_points,trend_reason,sentiment,tags,cluster_title")
    .eq("cluster_id", id)
    .maybeSingle();

  const { data: posts } = await supabaseAdmin
    .from("cluster_items")
    .select(
      "similarity_score,raw_posts!inner(id,title,snippet,content,source_name,source_url,platform,published_at,engagement,raw_metadata)",
    )
    .eq("cluster_id", id)
    .order("similarity_score", { ascending: false })
    .limit(30);

  return NextResponse.json(
    {
      cluster: {
        id: cluster.id,
        title: summary?.cluster_title ?? cluster.title,
        trendCategory: cluster.trend_category ?? "general",
        firstSeenAt: cluster.first_seen_at,
        lastSeenAt: cluster.last_seen_at,
      },
      summary: summary
        ? {
            summary: summary.summary,
            keyPoints: summary.key_points ?? [],
            trendReason: summary.trend_reason,
            sentiment: summary.sentiment,
            tags: summary.tags ?? [],
          }
        : null,
      posts: (posts ?? []).map((item) => {
        const raw = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
        const media = extractPostMedia({
          sourceUrl: raw.source_url,
          platform: raw.platform,
          rawMetadata: (raw.raw_metadata as Record<string, unknown> | undefined) ?? {},
        });
        return {
          id: raw.id,
          title: raw.title,
          snippet: raw.snippet ?? raw.content.slice(0, 240),
          content: raw.content,
          sourceName: raw.source_name,
          sourceUrl: raw.source_url,
          platform: raw.platform,
          publishedAt: raw.published_at,
          engagement: raw.engagement,
          media,
          similarityScore: item.similarity_score,
        };
      }),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=180",
      },
    },
  );
}

