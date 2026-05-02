import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyerCheckoutButton } from "@/components/shop/BuyerCheckoutButton";
import { fetchCatalogDetailForDisplay } from "@/lib/shop/catalog";
import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { fetchActiveListingForDisplay } from "@/lib/shop/marketplace";

export const dynamic = "force-dynamic";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type PageProps = { params: Promise<{ id: string }> };

export default async function ShopListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { listing: l, error: listingErr } = await fetchActiveListingForDisplay(id);
  if (listingErr) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/shop-la-caille/ashti" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← {shopLaCailleCopy.achteLabel}
          </Link>
          <div className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
            <p className="font-semibold">{shopLaCailleCopy.achteLoadErrorTitle}</p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-rose-200/90">{listingErr}</p>
          </div>
        </div>
      </div>
    );
  }

  if (l) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/shop-la-caille/ashti" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← {shopLaCailleCopy.achteLabel}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-2">
              {l.imageUrls.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-500">
                  {shopLaCailleCopy.listingImagePlaceholder}
                </div>
              ) : (
                l.imageUrls.map((url) => (
                  <div key={url} className="overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full object-cover" />
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {shopLaCailleCopy.badgeCommunityListing}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white">{l.title}</h1>
              <p className="mt-4 whitespace-pre-wrap text-neutral-300">{l.description || "—"}</p>
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between border-b border-white/10 py-2">
                  <dt className="text-neutral-400">Pri atik</dt>
                  <dd>{formatUsd(l.priceCents)}</dd>
                </div>
                <div className="flex justify-between border-b border-white/10 py-2">
                  <dt className="text-neutral-400">Transpò</dt>
                  <dd>{formatUsd(l.shippingCents)}</dd>
                </div>
              </dl>

              <BuyerCheckoutButton
                listingId={l.id}
                itemCents={l.priceCents}
                shippingCents={l.shippingCents}
                title={l.title}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { item: c, error: catErr } = await fetchCatalogDetailForDisplay(id);
  if (catErr) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/shop-la-caille/ashti" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← {shopLaCailleCopy.achteLabel}
          </Link>
          <div className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
            <p className="font-semibold">{shopLaCailleCopy.achteLoadErrorTitle}</p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-rose-200/90">{catErr}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!c) {
    notFound();
  }

  const isOnPlatform = c.purchaseMode === "on_platform";

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/shop-la-caille/ashti" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← {shopLaCailleCopy.achteLabel}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            {c.imageUrls.length === 0 ? (
              <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-500">
                {shopLaCailleCopy.listingImagePlaceholder}
              </div>
            ) : (
              c.imageUrls.map((url) => (
                <div key={url} className="overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full object-cover" />
                </div>
              ))
            )}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">
              {isOnPlatform ? shopLaCailleCopy.badgeCatalogOnPlatform : shopLaCailleCopy.badgeCatalogAffiliate}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">{c.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-neutral-300">{c.description || "—"}</p>
            {c.affiliateNote ? (
              <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-100/95">
                {c.affiliateNote}
              </p>
            ) : null}
            {!isOnPlatform && c.externalUrl ? (
              <p className="mt-3 text-xs text-neutral-500">{shopLaCailleCopy.catalogAffiliateStripeNote}</p>
            ) : null}
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between border-b border-white/10 py-2">
                <dt className="text-neutral-400">Pri atik</dt>
                <dd>{formatUsd(c.priceCents)}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 py-2">
                <dt className="text-neutral-400">Transpò</dt>
                <dd>{formatUsd(c.shippingCents)}</dd>
              </div>
            </dl>

            {isOnPlatform ? (
              <BuyerCheckoutButton
                catalogItemId={c.id}
                itemCents={c.priceCents}
                shippingCents={c.shippingCents}
                title={c.title}
              />
            ) : c.externalUrl ? (
              <a
                href={c.externalUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500"
              >
                {shopLaCailleCopy.catalogVisitPartnerCta}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
