import { supabaseAdmin } from "@/lib/db/client";

export type ClusterArchiveItem = {
  id: string;
  title: string;
  trendCategory: string;
  status: string;
  firstSeenAt: string;
  lastSeenAt: string;
  summary: string;
  tags: string[];
};

const DEFAULT_SUMMARY = "Rezime a ap prepare pou sijè sa a.";
const ARCHIVE_MIN_AGE_DAYS = 30;

function getArchiveCutoffIso() {
  const now = Date.now();
  return new Date(now - ARCHIVE_MIN_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function toIlikePattern(input: string) {
  return `%${input.replace(/[,%_()]/g, " ").replace(/\s+/g, " ").trim()}%`;
}

async function hydrateClusters(clusterIds: string[], olderThanIso = getArchiveCutoffIso()) {
  if (clusterIds.length === 0) {
    return [];
  }

  const { data: clusters } = await supabaseAdmin
    .from("clusters")
    .select("id,title,trend_category,status,first_seen_at,last_seen_at")
    .in("id", clusterIds)
    .lt("last_seen_at", olderThanIso);

  if (!clusters || clusters.length === 0) {
    return [];
  }

  const { data: summaries } = await supabaseAdmin
    .from("cluster_summaries")
    .select("cluster_id,cluster_title,summary,tags")
    .in(
      "cluster_id",
      clusters.map((cluster) => cluster.id as string),
    );

  const summaryByCluster = new Map(
    (summaries ?? []).map((summary) => [summary.cluster_id as string, summary]),
  );

  return clusters
    .map((cluster) => {
      const summary = summaryByCluster.get(cluster.id as string);
      return {
        id: cluster.id as string,
        title:
          (summary?.cluster_title as string | undefined) ??
          (cluster.title as string | null) ??
          "Sijè san tit",
        trendCategory: (cluster.trend_category as string | null) ?? "jeneral",
        status: (cluster.status as string | null) ?? "active",
        firstSeenAt: cluster.first_seen_at as string,
        lastSeenAt: cluster.last_seen_at as string,
        summary: (summary?.summary as string | undefined) ?? DEFAULT_SUMMARY,
        tags: (summary?.tags as string[] | undefined) ?? [],
      } satisfies ClusterArchiveItem;
    })
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
}

export async function searchArchivedClusters(query: string, limit = 60) {
  const q = query.trim();
  if (!q) {
    return [];
  }
  const pattern = toIlikePattern(q);
  const archiveCutoff = getArchiveCutoffIso();
  if (pattern === "%%") {
    return [];
  }

  try {
    const [clusterMatches, summaryMatches, postMatches] = await Promise.all([
      supabaseAdmin
        .from("clusters")
        .select("id")
        .or(`title.ilike.${pattern},trend_category.ilike.${pattern}`)
        .lt("last_seen_at", archiveCutoff)
        .limit(limit),
      supabaseAdmin
        .from("cluster_summaries")
        .select("cluster_id")
        .or(`cluster_title.ilike.${pattern},summary.ilike.${pattern}`)
        .limit(limit),
      supabaseAdmin
        .from("raw_posts")
        .select("id")
        .or(`title.ilike.${pattern},snippet.ilike.${pattern},content.ilike.${pattern}`)
        .limit(limit * 3),
    ]);

    let postClusterIds: string[] = [];
    const rawPostIds = (postMatches.data ?? []).map((post) => post.id as string);
    if (rawPostIds.length > 0) {
      const { data: clusterItems } = await supabaseAdmin
        .from("cluster_items")
        .select("cluster_id")
        .in("raw_post_id", rawPostIds)
        .limit(limit * 3);
      postClusterIds = (clusterItems ?? []).map((item) => item.cluster_id as string);
    }

    const clusterIds = Array.from(
      new Set([
        ...(clusterMatches.data ?? []).map((item) => item.id as string),
        ...(summaryMatches.data ?? []).map((item) => item.cluster_id as string),
        ...postClusterIds,
      ]),
    ).slice(0, limit);

    return hydrateClusters(clusterIds, archiveCutoff);
  } catch {
    return [];
  }
}

export async function getArchivedClustersPage(page: number, pageSize = 30) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize;

  const archiveCutoff = getArchiveCutoffIso();
  const { data } = await supabaseAdmin
    .from("clusters")
    .select("id")
    .lt("last_seen_at", archiveCutoff)
    .order("last_seen_at", { ascending: false })
    .range(from, to);

  const pageIds = (data ?? []).map((item) => item.id as string);
  const hasNextPage = pageIds.length > pageSize;
  const idsForPage = pageIds.slice(0, pageSize);

  const results = await hydrateClusters(idsForPage, archiveCutoff);
  return { page: safePage, hasNextPage, data: results };
}
