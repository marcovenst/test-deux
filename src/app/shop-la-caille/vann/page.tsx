import Link from "next/link";

import { SellerListingForm } from "@/components/shop/SellerListingForm";
import { shopLaCailleCopy } from "@/lib/i18n/ht";

type PageProps = {
  searchParams: Promise<{ checkout?: string; listingId?: string }>;
};

export default async function ShopVannPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const success = q.checkout === "success";

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/shop-la-caille" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← {shopLaCailleCopy.backShop}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-white">{shopLaCailleCopy.sellTitle}</h1>

        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-sm text-emerald-100">
            {shopLaCailleCopy.orderSuccess}{" "}
            {q.listingId ? `(ID: ${q.listingId})` : null}
          </p>
        ) : null}
        {q.checkout === "cancel" ? (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {shopLaCailleCopy.orderCancel}
          </p>
        ) : null}

        <div className="mt-8">
          <SellerListingForm />
        </div>
      </div>
    </div>
  );
}
