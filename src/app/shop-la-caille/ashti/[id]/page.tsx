import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyerCheckoutButton } from "@/components/shop/BuyerCheckoutButton";
import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { fromListingRow, getActiveListingById } from "@/lib/shop/marketplace";

export const dynamic = "force-dynamic";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type PageProps = { params: Promise<{ id: string }> };

export default async function ShopListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const row = await getActiveListingById(id);
  if (!row) {
    notFound();
  }
  const l = fromListingRow(row);

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/shop-la-caille/ashti" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← {shopLaCailleCopy.ashtiLabel}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            {l.imageUrls.map((url) => (
              <div key={url} className="overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full object-cover" />
              </div>
            ))}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{l.title}</h1>
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
