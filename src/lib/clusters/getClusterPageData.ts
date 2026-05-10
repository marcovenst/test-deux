import { cache } from "react";

import { supabaseAdmin } from "@/lib/db/client";

export type ClusterPageData = {
  cluster: {
    id: string;
    title: string;
    trend_category: string | null;
    last_seen_at: string;
    first_seen_at: string;
  };
  summary: {
    cluster_title: string | null;
    summary: string | null;
    trend_reason: string | null;
    key_points: unknown;
    sentiment: string | null;
    tags: unknown;
  } | null;
};

export const getClusterPageData = cache(async (id: string): Promise<ClusterPageData | null> => {
  const { data: cluster, error: clusterError } = await supabaseAdmin
    .from("clusters")
    .select("id,title,trend_category,last_seen_at,first_seen_at")
    .eq("id", id)
    .single();

  if (clusterError || !cluster) {
    return null;
  }

  const { data: summary } = await supabaseAdmin
    .from("cluster_summaries")
    .select("cluster_title,summary,key_points,trend_reason,sentiment,tags")
    .eq("cluster_id", id)
    .maybeSingle();

  return {
    cluster: cluster as ClusterPageData["cluster"],
    summary: summary ?? null,
  };
});
