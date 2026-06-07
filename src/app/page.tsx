import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/ads/AdSlot";
import { SelfServeAdLauncher } from "@/components/ads/SelfServeAdLauncher";
import { SubscribeDrawer } from "@/components/subscribers/SubscribeDrawer";
import { DailyDigest } from "@/components/trends/DailyDigest";
import { InfiniteTrendGrid } from "@/components/trends/InfiniteTrendGrid";
import { TrendFilters } from "@/components/trends/TrendFilters";
import { immigrationHubTopics, sportsHubTopics } from "@/lib/content/influencers";
import { htCopy, shopLaCailleCopy } from "@/lib/i18n/ht";
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

const QUICK_TOPICS: { label: string; category: string }[] = [
  { label: "#imigrasyon", category: "immigration" },
  { label: "#espò", category: "sports" },
  { label: "#mizik", category: "music" },
  { label: "#viral", category: "viral" },
  { label: "#politik", category: "politics" },
  { label: "#dyaspora", category: "diaspora" },
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
  const { immigrationLive, sportsLive } = buildHomeSidebarSlices({
    trends,
    hubFeed,
    immigrationFeed,
    sportsFeed,
  });
  const digestStories = buildDailyDigest(trends, 8);
  const digestClusterIds = new Set(digestStories.map((s) => s.clusterId));
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
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold tracking-tight">{htCopy.brandName}</p>
            <p className="truncate text-[11px] text-zinc-500">{htCopy.tagLine}</p>
          </div>
          <nav className="flex shrink-0 items-center gap-1.5" aria-label="Navigasyon">
            <Link
              href="/shop-la-caille"
              className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900"
            >
              {shopLaCailleCopy.navCtaMobilePrimary}
            </Link>
            <SubscribeDrawer />
            <Link
              href="/search"
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {htCopy.searchCta}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-3 py-3 pb-8">
        <section className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-zinc-200/80">
          <p className="text-sm font-semibold text-zinc-900">{htCopy.heroTitle}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{htCopy.heroSubtitle}</p>
          {scoresUpdatedLabel ? (
            <p className="mt-1 text-[10px] text-zinc-400">
              Mizajou {scoresUpdatedLabel}
            </p>
          ) : null}
          <div className="mt-3">
            <TrendFilters
              selectedCategory={category}
              selectedTimeframe={timeframe}
              popularityWindow={popularityWindow}
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_TOPICS.map(({ label, category: cat }) => (
              <Link
                key={cat}
                href={`/?timeframe=${timeframe}&category=${cat}&popularityWindow=${popularityWindow}`}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  category === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <DailyDigest stories={digestStories} timeframe={timeframe} />

        {gridTrends.length > 0 ? (
          <InfiniteTrendGrid trends={gridTrends} initialVisibleCount={6} chunkSize={6} />
        ) : digestStories.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-200/80">
            {htCopy.noData}
          </div>
        ) : null}

        <AdSlot slotId="feedMid" format="rectangle" />

        {(immigrationLive.length > 0 || sportsLive.length > 0) && (
          <section className="space-y-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/80">
            <p className="text-xs font-semibold text-zinc-700">{htCopy.socialHubsLabel}</p>
            <div className="space-y-2">
              {[...immigrationLive.slice(0, 2), ...sportsLive.slice(0, 2)].map((t) => (
                <Link
                  key={t.clusterId}
                  href={`/cluster/${t.clusterId}`}
                  className="block rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100"
                >
                  <p className="line-clamp-1 text-sm font-medium text-zinc-900">{t.title}</p>
                  <p className="text-[11px] text-zinc-500">#{t.trendCategory}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(immigrationLive.length === 0 || sportsLive.length === 0) && (
          <section className="grid grid-cols-2 gap-2">
            {immigrationHubTopics.slice(0, 1).map((topic) => (
              <Link
                key={topic.title}
                href={`/?timeframe=${timeframe}&category=immigration&popularityWindow=${popularityWindow}`}
                className="rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-zinc-200/80"
              >
                <p className="font-semibold text-zinc-900">{htCopy.immigrationHubTitle}</p>
                <p className="mt-1 line-clamp-2 text-zinc-600">{topic.title}</p>
              </Link>
            ))}
            {sportsHubTopics.slice(0, 1).map((topic) => (
              <Link
                key={topic.title}
                href={`/?timeframe=${timeframe}&category=sports&popularityWindow=${popularityWindow}`}
                className="rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-zinc-200/80"
              >
                <p className="font-semibold text-zinc-900">{htCopy.sportsHubTitle}</p>
                <p className="mt-1 line-clamp-2 text-zinc-600">{topic.title}</p>
              </Link>
            ))}
          </section>
        )}

        <div className="flex justify-center pt-2">
          <SelfServeAdLauncher buttonLabel="Mete anons" subtle />
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-lg space-y-1 px-4 py-4 text-center text-[11px] text-zinc-500">
          <p>{htCopy.footerRights}</p>
          <p>
            <a href={`mailto:${contactEmail}`} className="text-sky-600">
              {contactEmail}
            </a>
            {" · "}
            <Link href="/privacy" className="text-sky-600">
              {htCopy.footerPrivacy}
            </Link>
            {" · "}
            <Link href="/news" className="text-sky-600">
              {htCopy.archiveCta}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
