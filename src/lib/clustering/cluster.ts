import { supabaseAdmin } from "@/lib/db/client";
import { cosineSimilarity, textToEmbedding } from "@/lib/clustering/embed";

type ClusterCandidate = {
  id: string;
  title: string | null;
  metadata: {
    centroid?: number[];
    item_count?: number;
    [key: string]: unknown;
  } | null;
};

const SIMILARITY_THRESHOLD = 0.72;

function averageVectors(current: number[], incoming: number[], currentCount: number): number[] {
  const nextCount = currentCount + 1;
  return current.map((value, idx) => (value * currentCount + incoming[idx]) / nextCount);
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/immigration|uscis|tps|parole|asylum|visa|deportation|residency/.test(lower)) {
    return "immigration";
  }
  if (/election|government|minister|policy|senate|president/.test(lower)) {
    return "politics";
  }
  if (/music|kompa|concert|artist|album/.test(lower)) {
    return "music";
  }
  if (/hurricane|earthquake|flood|storm|disaster/.test(lower)) {
    return "disaster";
  }
  if (/diaspora|community|immigration|abroad/.test(lower)) {
    return "diaspora";
  }
  if (/football|soccer|sport|olympic|match/.test(lower)) {
    return "sports";
  }
  return "general";
}

export async function runClusteringJob() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
  const { data: posts, error: postsError } = await supabaseAdmin
    .from("raw_posts")
    .select("id,title,content,published_at")
    .gte("published_at", since)
    .order("published_at", { ascending: false });

  if (postsError) {
    throw postsError;
  }

  const { data: existingClusters, error: clustersError } = await supabaseAdmin
    .from("clusters")
    .select("id,title,metadata")
    .eq("status", "active");

  if (clustersError) {
    throw clustersError;
  }

  const mutableClusters: ClusterCandidate[] = (existingClusters ?? []) as ClusterCandidate[];
  let createdClusters = 0;
  let attachedItems = 0;

  for (const post of posts ?? []) {
    const embedding = textToEmbedding(`${post.title}\n${post.content}`);

    let bestCluster: ClusterCandidate | null = null;
    let bestScore = 0;

    for (const cluster of mutableClusters) {
      const centroid = cluster.metadata?.centroid;
      if (!centroid || centroid.length !== embedding.length) {
        continue;
      }
      const similarity = cosineSimilarity(embedding, centroid);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestCluster = cluster;
      }
    }

    if (!bestCluster || bestScore < SIMILARITY_THRESHOLD) {
      const category = inferCategory(`${post.title} ${post.content}`);
      const { data: clusterData, error: createError } = await supabaseAdmin
        .from("clusters")
        .insert({
          title: post.title,
          trend_category: category,
          representative_post_id: post.id,
          last_seen_at: post.published_at,
          metadata: {
            centroid: embedding,
            item_count: 1,
          },
        })
        .select("id,title,metadata")
        .single();
      if (createError || !clusterData) {
        continue;
      }
      mutableClusters.push(clusterData as ClusterCandidate);
      bestCluster = clusterData as ClusterCandidate;
      bestScore = 1;
      createdClusters += 1;
    }

    const { error: itemError } = await supabaseAdmin.from("cluster_items").upsert(
      {
        cluster_id: bestCluster.id,
        raw_post_id: post.id,
        similarity_score: bestScore,
      },
      {
        onConflict: "cluster_id,raw_post_id",
        ignoreDuplicates: true,
      },
    );

    if (!itemError) {
      attachedItems += 1;
      const existingCount = Number(bestCluster.metadata?.item_count ?? 1);
      const previousCentroid = Array.isArray(bestCluster.metadata?.centroid)
        ? (bestCluster.metadata?.centroid as number[])
        : embedding;
      const updatedCentroid = averageVectors(previousCentroid, embedding, Math.max(1, existingCount));
      bestCluster.metadata = {
        ...(bestCluster.metadata ?? {}),
        centroid: updatedCentroid,
        item_count: existingCount + 1,
      };
      await supabaseAdmin
        .from("clusters")
        .update({
          title: bestCluster.title ?? post.title,
          last_seen_at: post.published_at,
          metadata: bestCluster.metadata,
        })
        .eq("id", bestCluster.id);
    }
  }

  return {
    processedPosts: (posts ?? []).length,
    createdClusters,
    attachedItems,
  };
}

