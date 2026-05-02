import Link from "next/link";

import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { fetchAchteBrowseForDisplay } from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function ShopAchtePage() {
  const { items, error } = await fetchAchteBrowseForDisplay(40, 24);

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/shop-la-caille" className="text-sm text-cyan-300 hover:text-cyan-200">
              ← {shopLaCailleCopy.backShop}
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-white">{shopLaCailleCopy.achteLabel}</h1>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
            <p className="font-semibold">{shopLaCailleCopy.achteLoadErrorTitle}</p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-rose-200/90">{error}</p>
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-neutral-300">
            {shopLaCailleCopy.emptyAchte}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((row) => {
              if (row.kind === "listing") {
                const l = row.listing;
                return (
                  <Link
                    key={`l-${l.id}`}
                    href={`/shop-la-caille/ashti/${l.id}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/40"
                  >
                    <div className="aspect-square bg-black/40">
                      {l.imageUrls[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={l.imageUrls[0]}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:opacity-95"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                          {shopLaCailleCopy.listingImagePlaceholder}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        {shopLaCailleCopy.badgeCommunityListing}
                      </p>
                      <p className="line-clamp-2 font-semibold text-white">{l.title}</p>
                      <p className="mt-2 text-emerald-300">{formatUsd(l.priceCents)}</p>
                      <p className="text-xs text-neutral-500">+ {formatUsd(l.shippingCents)} transpò</p>
                    </div>
                  </Link>
                );
              }
              const c = row.catalog;
              const badge =
                c.purchaseMode === "on_platform"
                  ? shopLaCailleCopy.badgeCatalogOnPlatform
                  : shopLaCailleCopy.badgeCatalogAffiliate;
              return (
                <Link
                  key={`c-${c.id}`}
                  href={`/shop-la-caille/ashti/${c.id}`}
                  className="group overflow-hidden rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] transition hover:border-violet-400/45"
                >
                  <div className="aspect-square bg-black/40">
                    {c.imageUrls[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={c.imageUrls[0]}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:opacity-95"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                        {shopLaCailleCopy.listingImagePlaceholder}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
                      {badge}
                    </p>
                    <p className="line-clamp-2 font-semibold text-white">{c.title}</p>
                    <p className="mt-2 text-emerald-300">{formatUsd(c.priceCents)}</p>
                    <p className="text-xs text-neutral-500">+ {formatUsd(c.shippingCents)} transpò</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
