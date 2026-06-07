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
    <section className="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-violet-900">
          Videyo k ap fè bri
        </h2>
        <Link href="/search?query=video" className="text-xs font-medium text-violet-700 hover:text-violet-900">
          Plis videyo →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {videoItems.length > 0 ? (
          videoItems.map(({ trend, media }) => (
            <article key={trend.clusterId} className="rounded-xl border border-violet-100 bg-white p-3 shadow-sm">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
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
                className="mt-3 block text-sm font-semibold text-slate-900 transition hover:text-violet-700"
              >
                {trend.title}
              </Link>
              <p className="mt-1 text-xs text-slate-500">{media.sourceName}</p>
            </article>
          ))
        ) : (
          <article className="rounded-xl border border-violet-100 bg-white p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">Videyo yo poko antre nan batch sa a.</p>
            <p className="mt-2 text-xs text-slate-600">
              Nou deja prepare seksyon an; li pral ranpli otomatikman lè sous YouTube/TikTok/Facebook yo
              retounen medya dirèk nan pwochen ingestion yo.
            </p>
            <Link
              href="/search?query=youtube"
              className="mt-3 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800 hover:border-violet-300"
            >
              Tcheke sous videyo yo
            </Link>
          </article>
        )}
      </div>
    </section>
  );
}
