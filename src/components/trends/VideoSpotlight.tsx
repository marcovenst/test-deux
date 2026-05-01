import Link from "next/link";

import type { TrendFeedItem } from "@/lib/trends/query";
import { pickFeaturedVideoSource } from "@/lib/media/pickFeaturedSource";

type VideoSpotlightProps = {
  trends: TrendFeedItem[];
};

export function VideoSpotlight({ trends }: VideoSpotlightProps) {
  const videoItems = trends
    .map((trend) => ({
      trend,
      media: pickFeaturedVideoSource(trend.topSources),
    }))
    .filter((item): item is { trend: TrendFeedItem; media: NonNullable<(typeof item)["media"]> } =>
      Boolean(item.media),
    )
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-fuchsia-100">
          Videyo k ap fè bri
        </h2>
        <Link href="/search?query=video" className="text-xs text-fuchsia-200 hover:text-white">
          Plis videyo →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {videoItems.length > 0 ? (
          videoItems.map(({ trend, media }) => (
            <article key={trend.clusterId} className="rounded-xl border border-white/15 bg-black/25 p-3">
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
                {media.embedUrl ? (
                  <iframe
                    src={media.embedUrl}
                    title={trend.title}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                ) : media.videoUrl ? (
                  <video
                    src={media.videoUrl}
                    controls
                    muted
                    preload="metadata"
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                ) : null}
              </div>
              <Link
                href={`/cluster/${trend.clusterId}`}
                className="mt-3 block text-sm font-semibold text-white transition hover:text-fuchsia-100"
              >
                {trend.title}
              </Link>
              <p className="mt-1 text-xs text-neutral-300">{media.sourceName}</p>
            </article>
          ))
        ) : (
          <article className="rounded-xl border border-white/15 bg-black/25 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-white">Videyo yo poko antre nan batch sa a.</p>
            <p className="mt-2 text-xs text-neutral-300">
              Nou deja prepare seksyon an; li pral ranpli otomatikman lè sous YouTube/TikTok/Facebook yo
              retounen medya dirèk nan pwochen ingestion yo.
            </p>
            <Link
              href="/search?query=youtube"
              className="mt-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs text-fuchsia-100 hover:border-fuchsia-300/40"
            >
              Tcheke sous videyo yo
            </Link>
          </article>
        )}
      </div>
    </section>
  );
}
