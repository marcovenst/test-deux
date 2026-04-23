import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db/client";

type RouteContext = {
  params: Promise<{ clusterId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { clusterId } = await context.params;
  const { data, error } = await supabaseAdmin
    .from("cluster_items")
    .select(
      "raw_posts!inner(id,title,snippet,source_name,source_url,platform,published_at,engagement)",
    )
    .eq("cluster_id", clusterId)
    .limit(60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sources = (data ?? []).map((item) => {
    const raw = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
    return {
      id: raw.id,
      title: raw.title,
      snippet: raw.snippet ?? "",
      sourceName: raw.source_name,
      sourceUrl: raw.source_url,
      platform: raw.platform,
      publishedAt: raw.published_at,
      engagement: raw.engagement,
    };
  });

  return NextResponse.json(
    {
      clusterId,
      count: sources.length,
      sources,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=180",
      },
    },
  );
}

