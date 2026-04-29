import Link from "next/link";

import { AdSlot } from "@/components/ads/AdSlot";
import { SelfServeAdLauncher } from "@/components/ads/SelfServeAdLauncher";
import { SelfServeAdStrip } from "@/components/ads/SelfServeAdStrip";
import { SubscribeDrawer } from "@/components/subscribers/SubscribeDrawer";
import { InfiniteTrendGrid } from "@/components/trends/InfiniteTrendGrid";
import { TrendFilters } from "@/components/trends/TrendFilters";
import { TrendViewPing } from "@/components/trends/TrendViewPing";
import { communityResourceLinks, dailyHighlights } from "@/lib/content/editorial";
import { immigrationHubTopics, sportsHubTopics } from "@/lib/content/influencers";
import { htCopy } from "@/lib/i18n/ht";
import { normalizeTrendCategory } from "@/lib/trends/categories";
import { getInfluencerTopics, getTrendFeed } from "@/lib/trends/query";

type HomePageProps = {
  searchParams: Promise<{
    timeframe?: string;
    category?: string;
    popularityWindow?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const timeframe = params.timeframe === "weekly" ? "weekly" : "daily";
  const category = normalizeTrendCategory(params.category);
  const popularityWindow =
    params.popularityWindow === "1h" || params.popularityWindow === "5h"
      ? params.popularityWindow
      : "24h";
  const trends = await getTrendFeed(timeframe, category, popularityWindow);
  const influencerTopics = getInfluencerTopics().slice(0, 8);
  const headliner = trends[0];
  const moreTrends = trends.slice(1);
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? htCopy.footerContactEmail;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-red-400">{htCopy.brandName}</p>
            <p className="text-xs text-neutral-400">{htCopy.tagLine}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-neutral-200">
                <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" />
                <span className="h-2 w-2 rounded-full bg-white" />
                <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              </div>
              <SelfServeAdLauncher buttonLabel="Mete anons" subtle />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              {htCopy.liveLabel}
            </span>
            <Link
              href="/news"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              {htCopy.archiveCta}
            </Link>
            <SubscribeDrawer />
            <Link
              href="/search"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
            >
              {htCopy.searchCta}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="h-1 w-full bg-gradient-to-r from-[#1D4ED8] via-white to-[#DC2626]" />
            <p className="px-4 py-2 text-xs text-neutral-300">{htCopy.haitiSignatureText}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/20 via-fuchsia-500/10 to-cyan-500/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200">
              {htCopy.heroBadge}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              {htCopy.heroTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-neutral-200 sm:text-base">
              {htCopy.heroSubtitle}
            </p>
            <div className="mt-4">
              <TrendFilters selectedCategory={category} selectedTimeframe={timeframe} />
              <div className="mt-3 flex flex-wrap gap-2">
                {(["1h", "5h", "24h"] as const).map((window) => (
                  <Link
                    key={window}
                    href={`/?timeframe=${timeframe}&category=${category}&popularityWindow=${window}`}
                    className={`rounded-full px-3 py-1 text-xs ${
                      popularityWindow === window
                        ? "bg-amber-300 text-black"
                        : "border border-white/20 text-neutral-300"
                    }`}
                  >
                    TikTok + X + Facebook + YouTube {window}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-cyan-200">
                Pwen esansyèl jounen an
              </h2>
              <Link href="/search" className="text-xs text-cyan-300 hover:text-cyan-200">
                Gade plis →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {dailyHighlights.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-300">{item.snippet}</p>
                </article>
              ))}
            </div>
          </section>

          <AdSlot slotId="feedTop" format="horizontal" />

          {headliner ? (
            <section className="rounded-2xl border border-red-400/30 bg-white/[0.03] p-5">
              <TrendViewPing clusterId={headliner.clusterId} />
              <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
                <span className="rounded-full border border-red-300/40 bg-red-300/10 px-2 py-1 text-red-200">
                  {htCopy.megaTrendLabel}
                </span>
                <span>{htCopy.trendScoreLabel} {headliner.trendScore.toFixed(1)}</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                <span className="rounded-full border border-white/20 px-2 py-1">
                  Popilarite entènèt {(headliner.popularityScore ?? 0).toFixed(1)}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  Google {(headliner.googleSearchScore ?? 0).toFixed(1)}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  Sosyal {(headliner.socialScore ?? 0).toFixed(1)}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  👁 {headliner.viewCount.toLocaleString()} views
                </span>
              </div>
              <Link
                href={`/cluster/${headliner.clusterId}`}
                className="text-2xl font-bold leading-tight text-white transition hover:text-red-200"
              >
                {headliner.title}
              </Link>
              <p className="mt-3 text-neutral-300">{headliner.summary}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {headliner.topSources.map((source) => (
                  <a
                    key={`${source.sourceName}-${source.sourceUrl}`}
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm transition hover:border-red-300/40"
                  >
                    <p className="font-medium text-white">{source.sourceName}</p>
                    <p className="line-clamp-2 text-xs text-neutral-400">{source.snippet}</p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {moreTrends.length === 0 && !headliner ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-neutral-300">
              {htCopy.noData}
            </div>
          ) : (
            <InfiniteTrendGrid trends={moreTrends} initialVisibleCount={8} chunkSize={8} />
          )}

          <AdSlot slotId="feedMid" format="rectangle" />

          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-sm text-cyan-50">
            <p>{htCopy.footerNote}</p>
            <p className="mt-2 text-cyan-100/90">{htCopy.archiveBlurb}</p>
          </section>
        </section>

        <aside className="space-y-4">
          <AdSlot slotId="sidebar" format="rectangle" />
          <SelfServeAdStrip />

          <section className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
            <h2 className="text-lg font-bold text-white">{htCopy.immigrationHubTitle}</h2>
            <p className="mt-1 text-xs text-neutral-300">{htCopy.immigrationHubSubtitle}</p>
            <div className="mt-3 space-y-3">
              {immigrationHubTopics.map((topic) => (
                <article
                  key={topic.title}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-sm font-semibold text-amber-100">{topic.title}</p>
                  <p className="mt-1 text-xs text-neutral-300">{topic.snippet}</p>
                  <p className="mt-2 text-[11px] text-amber-200">{topic.sourceHint}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-lg font-bold text-white">{htCopy.influencerTitle}</h2>
            <p className="mt-1 text-xs text-neutral-400">
              {htCopy.influencerSubtitle}
            </p>
            <div className="mt-4 space-y-3">
              {influencerTopics.map((item, idx) => (
                <article
                  key={`${item.influencer}-${idx}`}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-sm font-semibold text-red-200">{item.influencer}</p>
                  <p className="mt-1 text-xs text-neutral-300">{item.topic}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {item.platform} • {item.focus}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <h2 className="text-lg font-bold text-white">{htCopy.sportsHubTitle}</h2>
            <p className="mt-1 text-xs text-neutral-300">{htCopy.sportsHubSubtitle}</p>
            <div className="mt-3 space-y-3">
              {sportsHubTopics.map((topic) => (
                <article
                  key={topic.title}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-sm font-semibold text-emerald-200">{topic.title}</p>
                  <p className="mt-1 text-xs text-neutral-300">{topic.snippet}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-lg font-bold text-white">{htCopy.categoryTitle}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "imigrasyon",
                "mizik",
                "dyaspora",
                "kilti",
                "politik",
                "espò",
                "viral",
                "foutbòl",
                "komik",
                "relijyon",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 bg-white/[0.02] px-2 py-1 text-xs text-neutral-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4">
            <h2 className="text-lg font-bold text-white">Lyen itil kominote a</h2>
            <div className="mt-3 space-y-3">
              {communityResourceLinks.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-lg border border-white/15 bg-black/20 p-3 transition hover:border-cyan-300/40"
                >
                  <p className="text-sm font-semibold text-cyan-100">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-300">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer className="border-t border-white/10 bg-neutral-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-neutral-400 sm:px-6">
          <div className="space-y-1">
            <p>{htCopy.footerRights}</p>
            <p>
              {htCopy.footerContactLead}{" "}
              <a href={`mailto:${contactEmail}`} className="text-cyan-200 hover:text-cyan-100">
                {contactEmail}
              </a>
            </p>
          </div>
          <SelfServeAdLauncher buttonLabel="Mete anons ou" />
        </div>
      </footer>
    </div>
  );
}
