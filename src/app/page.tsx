import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/ads/AdSlot";
import { SelfServeAdLauncher } from "@/components/ads/SelfServeAdLauncher";
import { SelfServeAdStrip } from "@/components/ads/SelfServeAdStrip";
import { SubscribeDrawer } from "@/components/subscribers/SubscribeDrawer";
import { DailyDigest } from "@/components/trends/DailyDigest";
import { InfiniteTrendGrid } from "@/components/trends/InfiniteTrendGrid";
import { TrendFilters } from "@/components/trends/TrendFilters";
import { VideoSpotlight } from "@/components/trends/VideoSpotlight";
import { communityResourceLinks, dailyHighlights } from "@/lib/content/editorial";
import { immigrationHubTopics, sportsHubTopics } from "@/lib/content/influencers";
import { htCopy, shopLaCailleCopy, weeklyProgramSourcePills } from "@/lib/i18n/ht";
import {
  formatCommunityEventStartsAt,
  listUpcomingCommunityEvents,
  sourceDisplayLabel,
} from "@/lib/events/weeklyProgram";
import { buildDailyDigest } from "@/lib/trends/dailyDigest";
import { buildHomeSidebarSlices } from "@/lib/trends/homeSidebar";
import { normalizeTrendCategory } from "@/lib/trends/categories";
import { normalizePopularityWindow } from "@/lib/trends/popularity";
import { getLatestScoresComputedAt, getTrendFeed } from "@/lib/trends/query";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SEO_KEYWORDS,
  SITE_NAME,
} from "@/lib/seo/site";

/** Always read latest clusters from Supabase; avoid a frozen build-time HTML shell on `/`. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ht_HT",
    url: absoluteUrl("/"),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

const HOME_CATEGORY_TAGS: { label: string; category: string }[] = [
  { label: "imigrasyon", category: "immigration" },
  { label: "mizik", category: "music" },
  { label: "dyaspora", category: "diaspora" },
  { label: "kilti", category: "culture" },
  { label: "politik", category: "politics" },
  { label: "espò", category: "sports" },
  { label: "viral", category: "viral" },
  { label: "foutbòl", category: "sports" },
  { label: "komik", category: "funny" },
  { label: "relijyon", category: "religion" },
];

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
  const popularityWindow = normalizePopularityWindow(params.popularityWindow);
  const trends = await getTrendFeed(timeframe, category, popularityWindow);
  const [hubFeed, immigrationFeed, sportsFeed] = await Promise.all([
    getTrendFeed(timeframe, "all", popularityWindow),
    getTrendFeed(timeframe, "immigration", popularityWindow),
    getTrendFeed(timeframe, "sports", popularityWindow),
  ]);
  const { immigrationLive, sportsLive, dailyPick } = buildHomeSidebarSlices({
    trends,
    hubFeed,
    immigrationFeed,
    sportsFeed,
  });
  const { events: weeklyEvents, error: weeklyEventsError } = await listUpcomingCommunityEvents(10);
  const digestBullets = buildDailyDigest(trends, 5);
  const digestClusterIds = new Set(digestBullets.map((b) => b.clusterId));
  const gridTrends = trends.filter((t) => !digestClusterIds.has(t.clusterId));
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? htCopy.footerContactEmail;
  const scoresUpdatedAt = await getLatestScoresComputedAt(timeframe);
  const scoresUpdatedLabel =
    scoresUpdatedAt != null
      ? new Intl.DateTimeFormat("fr-HT", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Port-au-Prince",
        }).format(new Date(scoresUpdatedAt))
      : null;

  return (
    <div className="min-h-screen bg-page text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
          <div className="min-w-0 sm:max-w-[min(100%,28rem)]">
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{htCopy.brandName}</p>
            <p className="text-xs text-slate-500">{htCopy.tagLine}</p>
            {scoresUpdatedLabel ? (
              <p className="mt-1 text-[11px] text-slate-400">
                Dènye skò tandans: {scoresUpdatedLabel} (Ayiti)
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" />
                <span className="h-2 w-2 rounded-full bg-slate-200" />
                <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              </div>
              <SelfServeAdLauncher buttonLabel="Mete anons" subtle />
            </div>
          </div>
          <nav
            className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:w-auto sm:max-w-none sm:flex-nowrap sm:justify-end sm:gap-3"
            aria-label="Navigasyon"
          >
            <span className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              {htCopy.liveLabel}
            </span>
            <Link
              href="/news"
              className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              {htCopy.archiveCta}
            </Link>
            <Link
              href="/shop-la-caille"
              className="order-first inline-flex min-h-[3.25rem] w-full max-w-[20rem] touch-manipulation flex-col items-center justify-center gap-0.5 self-center rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100/80 px-4 py-2.5 text-center shadow-sm transition hover:border-amber-300 sm:order-none sm:min-h-0 sm:w-auto sm:max-w-none sm:self-auto sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-4 sm:py-2.5"
            >
              <span className="hidden text-sm font-semibold text-amber-900 sm:inline">{shopLaCailleCopy.navCta}</span>
              <span className="flex flex-col items-center leading-none sm:hidden">
                <span className="text-[0.8125rem] font-bold tracking-tight text-amber-900">
                  {shopLaCailleCopy.navCtaMobilePrimary}
                </span>
                <span className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-amber-700/90">
                  {shopLaCailleCopy.navCtaMobileSecondary}
                </span>
              </span>
            </Link>
            <SubscribeDrawer />
            <Link
              href="/search"
              className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {htCopy.searchCta}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-[#1D4ED8] via-slate-200 to-[#DC2626]" />
            <p className="px-4 py-2.5 text-xs text-slate-600">{htCopy.haitiSignatureText}</p>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
              {htCopy.heroBadge}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {htCopy.heroTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {htCopy.heroSubtitle}
            </p>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <TrendFilters
                selectedCategory={category}
                selectedTimeframe={timeframe}
                popularityWindow={popularityWindow}
              />
            </div>
          </section>

          <DailyDigest
            bullets={digestBullets}
            timeframe={timeframe}
            updatedLabel={scoresUpdatedLabel}
          />

          {gridTrends.length > 0 ? (
            <InfiniteTrendGrid trends={gridTrends} initialVisibleCount={8} chunkSize={8} />
          ) : digestBullets.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              {htCopy.noData}
            </div>
          ) : null}

          <AdSlot slotId="feedMid" format="rectangle" />

          <section className="rounded-2xl border border-sky-200/80 bg-sky-50 p-5 text-sm text-slate-700">
            <p>{htCopy.footerNote}</p>
            <p className="mt-2 text-slate-600">{htCopy.archiveBlurb}</p>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
                Pwen esansyèl jounen an
              </h2>
              <Link href="/search" className="text-xs font-medium text-sky-600 hover:text-sky-700">
                Gade plis →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {dailyPick.length > 0
                ? dailyPick.map((t) => (
                    <Link
                      key={t.clusterId}
                      href={`/cluster/${t.clusterId}`}
                      className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-sky-200 hover:bg-white hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs text-slate-600">{t.summary}</p>
                      <p className="mt-2 text-[11px] font-medium text-sky-700">
                        {htCopy.trendScoreLabel} {t.trendScore.toFixed(1)}
                      </p>
                    </Link>
                  ))
                : dailyHighlights.map((item) => (
                    <Link
                      key={item.title}
                      href={`/search?q=${encodeURIComponent(item.title)}`}
                      className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-sky-200 hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.snippet}</p>
                    </Link>
                  ))}
            </div>
          </section>

          <VideoSpotlight trends={trends} />
        </section>

        <aside className="space-y-4">
          <AdSlot slotId="sidebar" format="rectangle" />
          <SelfServeAdStrip />

          <section className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{htCopy.immigrationHubTitle}</h2>
                <p className="mt-1 text-xs text-slate-600">{htCopy.immigrationHubSubtitle}</p>
              </div>
              <Link
                href={`/?timeframe=${timeframe}&category=immigration&popularityWindow=${popularityWindow}`}
                className="shrink-0 text-xs font-medium text-amber-800 underline-offset-2 hover:underline"
              >
                Gade tout →
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {immigrationLive.length > 0
                ? immigrationLive.map((t) => (
                    <Link
                      key={t.clusterId}
                      href={`/cluster/${t.clusterId}`}
                      className="block rounded-xl border border-amber-100 bg-white p-3 transition hover:border-amber-200 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{t.summary}</p>
                      <p className="mt-2 text-[11px] font-medium text-amber-800">
                        {htCopy.trendScoreLabel} {t.trendScore.toFixed(1)}
                      </p>
                    </Link>
                  ))
                : immigrationHubTopics.map((topic) => (
                    <Link
                      key={topic.title}
                      href={`/search?q=${encodeURIComponent(topic.title)}`}
                      className="block rounded-xl border border-amber-100 bg-white p-3 transition hover:border-amber-200"
                    >
                      <p className="text-sm font-semibold text-slate-900">{topic.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{topic.snippet}</p>
                      <p className="mt-2 text-[11px] text-amber-800">{topic.sourceHint}</p>
                    </Link>
                  ))}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-200/80 bg-violet-50/50 p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{htCopy.weeklyProgramTitle}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{htCopy.weeklyProgramSubtitle}</p>
            {weeklyEventsError ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {weeklyEventsError}
              </p>
            ) : null}
            {!weeklyEventsError && weeklyEvents.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{htCopy.weeklyProgramEmpty}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              {weeklyEvents.map((ev) => (
                <a
                  key={ev.id}
                  href={ev.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-violet-100 bg-white p-3 transition hover:border-violet-200 hover:shadow-sm"
                >
                  <div className="flex gap-3">
                    {ev.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.imageUrl}
                        alt=""
                        className="h-16 w-20 shrink-0 rounded-md object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-violet-700">
                        {sourceDisplayLabel(ev.source)} · {formatCommunityEventStartsAt(ev.startsAt)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{ev.title}</p>
                      {ev.locationLabel ? (
                        <p className="mt-0.5 text-xs text-slate-500">{ev.locationLabel}</p>
                      ) : null}
                      {ev.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{ev.description}</p>
                      ) : null}
                      <p className="mt-2 text-[11px] font-semibold text-violet-700">
                        {htCopy.weeklyProgramExternalCta} ↗
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-700">
              {htCopy.weeklyProgramSourcesIntro}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {weeklyProgramSourcePills.map((name) => (
                <li
                  key={name}
                  className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-800"
                >
                  {name}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{htCopy.sportsHubTitle}</h2>
                <p className="mt-1 text-xs text-slate-600">{htCopy.sportsHubSubtitle}</p>
              </div>
              <Link
                href={`/?timeframe=${timeframe}&category=sports&popularityWindow=${popularityWindow}`}
                className="shrink-0 text-xs font-medium text-emerald-800 underline-offset-2 hover:underline"
              >
                Gade tout →
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {sportsLive.length > 0
                ? sportsLive.map((t) => (
                    <Link
                      key={t.clusterId}
                      href={`/cluster/${t.clusterId}`}
                      className="block rounded-xl border border-emerald-100 bg-white p-3 transition hover:border-emerald-200 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{t.summary}</p>
                      <p className="mt-2 text-[11px] font-medium text-emerald-800">
                        {htCopy.trendScoreLabel} {t.trendScore.toFixed(1)}
                      </p>
                    </Link>
                  ))
                : sportsHubTopics.map((topic) => (
                    <Link
                      key={topic.title}
                      href={`/search?q=${encodeURIComponent(topic.title)}`}
                      className="block rounded-xl border border-emerald-100 bg-white p-3 transition hover:border-emerald-200"
                    >
                      <p className="text-sm font-semibold text-slate-900">{topic.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{topic.snippet}</p>
                    </Link>
                  ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{htCopy.categoryTitle}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {HOME_CATEGORY_TAGS.map(({ label, category: cat }) => (
                <Link
                  key={`${label}-${cat}`}
                  href={`/?timeframe=${timeframe}&category=${cat}&popularityWindow=${popularityWindow}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                >
                  #{label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Lyen itil kominote a</h2>
            <div className="mt-3 space-y-3">
              {communityResourceLinks.map((item) => (
                <Link
                  key={item.title}
                  href={`/?timeframe=${timeframe}&category=${item.category}&popularityWindow=${popularityWindow}`}
                  className="block rounded-xl border border-sky-100 bg-white p-3 transition hover:border-sky-200 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <div className="space-y-1">
            <p>{htCopy.footerRights}</p>
            <p>
              {htCopy.footerContactLead}{" "}
              <a href={`mailto:${contactEmail}`} className="text-sky-600 hover:text-sky-700">
                {contactEmail}
              </a>
            </p>
            <p>
              <Link href="/privacy" className="text-sky-600 underline-offset-2 hover:text-sky-700 hover:underline">
                {htCopy.footerPrivacy}
              </Link>
            </p>
          </div>
          <SelfServeAdLauncher buttonLabel="Mete anons ou" />
        </div>
      </footer>
    </div>
  );
}
