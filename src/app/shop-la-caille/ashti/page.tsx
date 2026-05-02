import Link from "next/link";

import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { fromListingRow, listActiveListings } from "@/lib/shop/marketplace";

export const dynamic = "force-dynamic";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function ShopAchtePage() {
  const rows = await listActiveListings(48);
  const listings = rows.map(fromListingRow);

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

        {listings.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-neutral-300">
            {shopLaCailleCopy.emptyAchte}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/shop-la-caille/ashti/${l.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/40"
              >
                <div className="aspect-square bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.imageUrls[0]}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:opacity-95"
                  />
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 font-semibold text-white">{l.title}</p>
                  <p className="mt-2 text-emerald-300">{formatUsd(l.priceCents)}</p>
                  <p className="text-xs text-neutral-500">+ {formatUsd(l.shippingCents)} transpò</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
