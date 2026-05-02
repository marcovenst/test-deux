import Link from "next/link";

import { shopLaCailleCopy } from "@/lib/i18n/ht";

export default function ShopLaCailleHomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← Paj prensipal
        </Link>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white">{shopLaCailleCopy.title}</h1>
        <p className="mt-3 text-neutral-300">{shopLaCailleCopy.subtitle}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/shop-la-caille/ashti"
            className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-8 transition hover:border-emerald-300/60 hover:bg-emerald-500/25"
          >
            <p className="text-2xl font-bold text-emerald-200">{shopLaCailleCopy.ashtiLabel}</p>
            <p className="mt-2 text-sm text-neutral-200">{shopLaCailleCopy.ashtiHint}</p>
          </Link>
          <Link
            href="/shop-la-caille/vann"
            className="rounded-2xl border border-amber-400/40 bg-amber-500/15 p-8 transition hover:border-amber-300/60 hover:bg-amber-500/25"
          >
            <p className="text-2xl font-bold text-amber-200">{shopLaCailleCopy.vannLabel}</p>
            <p className="mt-2 text-sm text-neutral-200">{shopLaCailleCopy.vannHint}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
