import Link from "next/link";

import { SummaryListenPanel } from "@/components/trends/SummaryListenPanel";
import { TrendViewPing } from "@/components/trends/TrendViewPing";
import { supabaseAdmin } from "@/lib/db/client";
import { socialSourceUrlRank } from "@/lib/media/pickFeaturedSource";
import { extractPostMedia } from "@/lib/media/postMedia";

export const dynamic = "force-dynamic";

type ClusterPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClusterPage({ params }: ClusterPageProps) {
  const { id } = await params;

  const { data: cluster } = await supabaseAdmin
    .from("clusters")
    .select("id,title,trend_category,last_seen_at")
    .eq("id", id)
    .single();

  if (!cluster) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <p>Nou pa jwenn sijè sa a.</p>
      </main>
    );
  }

  const { data: summary } = await supabaseAdmin
    .from("cluster_summaries")
    .select("cluster_title,summary,key_points,trend_reason,sentiment,tags")
    .eq("cluster_id", id)
    .maybeSingle();

  const { data: posts } = await supabaseAdmin
    .from("cluster_items")
    .select(
      "similarity_score,raw_posts!inner(title,snippet,source_name,source_url,platform,published_at,raw_metadata)",
    )
    .eq("cluster_id", id)
    .order("similarity_score", { ascending: false })
    .limit(50);

  const normalizedPosts = (posts ?? []).map((item, index) => {
    const post = Array.isArray(item.raw_posts) ? item.raw_posts[0] : item.raw_posts;
    const media = extractPostMedia({
      sourceUrl: post.source_url,
      platform: post.platform,
      rawMetadata: (post.raw_metadata as Record<string, unknown> | undefined) ?? {},
    });
    return {
      index,
      post,
      media,
    };
  });

  const videoHighlights = normalizedPosts
    .filter((item) => item.media.kind === "embed" || item.media.kind === "video")
    .sort(
      (a, b) =>
        socialSourceUrlRank(a.post.source_url) - socialSourceUrlRank(b.post.source_url),
    )
    .slice(0, 3);
  const fallbackHighlights = normalizedPosts.slice(0, 3);
  const fallbackSummary = fallbackHighlights
    .map((item) => item.post.snippet)
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/" className="text-sm text-cyan-200 hover:text-cyan-100">
          Retounen sou paj prensipal la
        </Link>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <TrendViewPing clusterId={cluster.id} />
          <h1 className="text-3xl font-semibold text-white">
            {summary?.cluster_title ?? cluster.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/20 px-2 py-1">
              {cluster.trend_category ?? "jeneral"}
            </span>
            <span className="rounded-full border border-white/20 px-2 py-1">
              Dènye aktyalizasyon: {new Date(cluster.last_seen_at).toLocaleString()}
            </span>
            <span className="rounded-full border border-white/20 px-2 py-1">
              {summary?.sentiment ?? "neutral"}
            </span>
          </div>
          <p className="mt-4 text-slate-300">
            {summary?.summary ??
              (fallbackSummary
                ? `Rezime rapid: ${fallbackSummary}`
                : "Rezime a ap prepare pou sijè sa a.")}
          </p>
          {summary?.trend_reason ? (
            <p className="mt-3 text-sm text-cyan-100">
              Poukisa sa ap pran tandans: {summary.trend_reason}
            </p>
          ) : null}
          {(summary?.key_points as string[] | undefined)?.length ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(summary?.key_points as string[]).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {videoHighlights.length === 0 ? (
            <SummaryListenPanel
              clusterId={cluster.id}
              title={String(summary?.cluster_title ?? cluster.title ?? "")}
              summary={String(
                summary?.summary ??
                  (fallbackSummary ? `Rezime rapid: ${fallbackSummary}` : ""),
              )}
            />
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Pòs sous yo</h2>
          {videoHighlights.length > 0 ? (
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">
                AI rezime videyo yo
              </p>
              <p className="mt-2 text-sm text-cyan-50">
                Men pwen prensipal videyo ki pi enpòtan yo nan sijè sa a.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cyan-50/90">
                {videoHighlights.map((item) => (
                  <li key={`${item.post.source_url}-${item.index}`}>
                    {item.post.title}
                    {item.post.snippet ? ` — ${item.post.snippet}` : ""}
                  </li>
                ))}
              </ul>
            </article>
          ) : (
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">
                Rezime rapid sou sous yo
              </p>
              <p className="mt-2 text-sm text-cyan-50">
                Pa gen videyo dirèk nan sijè sa a kounye a, men men pwen ki pi enpòtan yo:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cyan-50/90">
                {fallbackHighlights.map((item) => (
                  <li key={`${item.post.source_url}-${item.index}`}>
                    {item.post.title}
                    {item.post.snippet ? ` — ${item.post.snippet}` : ""}
                  </li>
                ))}
              </ul>
            </article>
          )}

          {normalizedPosts.map(({ post, media, index }) => {
            return (
              <article
                key={`${post.source_url}-${index}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>{post.source_name}</span>
                  <span>{post.platform}</span>
                </div>
                <h3 className="mt-2 text-lg font-medium text-white">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{post.snippet}</p>
                {media.kind === "embed" && media.embedUrl ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/15">
                    <iframe
                      src={media.embedUrl}
                      title={`video-${index}`}
                      className="h-56 w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                {media.kind === "video" && media.videoUrl ? (
                  <video
                    className="mt-3 w-full rounded-lg border border-white/15"
                    controls
                    preload="metadata"
                  >
                    <source src={media.videoUrl} />
                    Navigatè sa a pa sipòte videyo sa a.
                  </video>
                ) : null}
                {media.kind === "image" && media.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.imageUrl}
                    alt={post.title}
                    className="mt-3 h-56 w-full rounded-lg border border-white/15 object-cover"
                  />
                ) : null}
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm text-cyan-200 hover:text-cyan-100"
                >
                  Louvri sous la
                </a>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

