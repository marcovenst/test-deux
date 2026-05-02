import Link from "next/link";
import { notFound } from "next/navigation";

import { SellerPayoutForm } from "@/components/shop/SellerPayoutForm";
import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { getSellerDashboardData, MIN_PAYOUT_CENTS } from "@/lib/shop/marketplace";

export const dynamic = "force-dynamic";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ published?: string }>;
};

export default async function SellerDashboardPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const q = await searchParams;
  let data: Awaited<ReturnType<typeof getSellerDashboardData>>;
  try {
    data = await getSellerDashboardData(token);
  } catch {
    notFound();
  }
  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/shop-la-caille" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← {shopLaCailleCopy.backShop}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">{shopLaCailleCopy.sellerDashboardTitle}</h1>
          {q.published === "1" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-sm text-emerald-100">
              {shopLaCailleCopy.orderSuccess}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-neutral-400">{data.seller.displayName}</p>
          <p className="text-xs text-neutral-600">{data.seller.email}</p>
        </div>

        <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-50">
          {shopLaCailleCopy.sellerDashboardExplain}
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {shopLaCailleCopy.sellerBalanceLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {usd(data.ledgerBalanceCents)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {shopLaCailleCopy.sellerReservedLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-200">
              {usd(data.pendingPayoutReserveCents)}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="text-xs uppercase tracking-wide text-cyan-200/80">
              {shopLaCailleCopy.sellerAvailableLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-cyan-200">
              {usd(data.availableToCashOutCents)}
            </p>
          </div>
        </div>

        <SellerPayoutForm
          accessToken={token}
          availableToCashOutCents={data.availableToCashOutCents}
        />

        <p className="text-xs text-neutral-600">
          {shopLaCailleCopy.sellerPayoutAdminNote.replace(
            "$MIN",
            `$${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`,
          )}
        </p>

        <section>
          <h2 className="text-lg font-semibold text-white">{shopLaCailleCopy.sellerHistoryTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.ledger.length === 0 ? (
              <li className="text-neutral-500">{shopLaCailleCopy.sellerHistoryEmpty}</li>
            ) : (
              data.ledger.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span className="text-neutral-400">
                    {row.entry_type === "sale_credit"
                      ? shopLaCailleCopy.sellerLedgerSale
                      : row.entry_type === "payout_debit"
                        ? shopLaCailleCopy.sellerLedgerPayout
                        : row.entry_type}
                  </span>
                  <span className={row.amount_cents >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {row.amount_cents >= 0 ? "+" : ""}
                    {usd(row.amount_cents)}
                  </span>
                  <span className="w-full text-xs text-neutral-600">
                    {new Date(row.created_at).toLocaleString()} · {row.memo ?? "—"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">{shopLaCailleCopy.sellerPayoutRequestsTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.payouts.length === 0 ? (
              <li className="text-neutral-500">{shopLaCailleCopy.sellerPayoutsEmpty}</li>
            ) : (
              data.payouts.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span>{usd(p.amount_cents)}</span>
                  <span className="text-neutral-400">{p.method}</span>
                  <span
                    className={
                      p.status === "paid"
                        ? "text-emerald-300"
                        : p.status === "pending" || p.status === "approved"
                          ? "text-amber-200"
                          : "text-neutral-500"
                    }
                  >
                    {p.status}
                  </span>
                  <span className="w-full text-xs text-neutral-600">
                    {new Date(p.created_at).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="text-xs text-neutral-600">{shopLaCailleCopy.sellerSaveLinkWarning}</p>
      </div>
    </div>
  );
}
