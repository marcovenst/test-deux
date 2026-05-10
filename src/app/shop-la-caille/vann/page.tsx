import type { Metadata } from "next";
import Link from "next/link";

import { SellerListingForm } from "@/components/shop/SellerListingForm";
import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { absoluteUrl, SEO_KEYWORDS, SITE_NAME } from "@/lib/seo/site";

const VANN_DESC =
  "Mete atik ou an vant sou Shop Lakay marketplace Zen Rezo A. List products for sale in the Haitian community marketplace.";

export const metadata: Metadata = {
  title: shopLaCailleCopy.sellTitle,
  description: VANN_DESC,
  keywords: [...SEO_KEYWORDS, "vann sou entènèt Ayiti", "sell Haiti marketplace"],
  alternates: { canonical: "/shop-la-caille/vann" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ht_HT",
    url: absoluteUrl("/shop-la-caille/vann"),
    title: `${shopLaCailleCopy.sellTitle} | ${SITE_NAME}`,
    description: VANN_DESC,
  },
};

type PageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function ShopVannPage({ searchParams }: PageProps) {
  const q = await searchParams;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/shop-la-caille" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← {shopLaCailleCopy.backShop}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-white">{shopLaCailleCopy.sellTitle}</h1>

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
