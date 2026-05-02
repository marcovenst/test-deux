"use client";

import { useState } from "react";

import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { platformFeeCents } from "@/lib/shop/marketplace";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Props =
  | { listingId: string; itemCents: number; shippingCents: number; title: string }
  | { catalogItemId: string; itemCents: number; shippingCents: number; title: string };

export function BuyerCheckoutButton(props: Props) {
  const { itemCents, shippingCents, title } = props;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fee = platformFeeCents(itemCents);
  const total = itemCents + shippingCents + fee;

  async function startCheckout() {
    if (!email.includes("@")) {
      setError("Antre yon imèl valab.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body =
        "listingId" in props
          ? { listingId: props.listingId, buyerEmail: email }
          : { catalogItemId: props.catalogItemId, buyerEmail: email };
      const res = await fetch("/api/shop/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; checkoutUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erè");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
      <p className="text-sm font-semibold text-emerald-100">{shopLaCailleCopy.buyTitle}</p>
      <p className="mt-1 text-xs text-neutral-300">{title}</p>
      <ul className="mt-3 space-y-1 text-xs text-neutral-200">
        <li>Atik: {formatUsd(itemCents)}</li>
        <li>Transpò: {formatUsd(shippingCents)}</li>
        <li>Frè platfòm (7% sou atik): {formatUsd(fee)}</li>
        <li className="font-semibold text-white">Total: {formatUsd(total)}</li>
      </ul>
      <label className="mt-4 block text-xs text-neutral-400">
        {shopLaCailleCopy.buyerEmail}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="ou@imel.com"
        />
      </label>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {busy ? shopLaCailleCopy.checkoutLoading : shopLaCailleCopy.payButton}
      </button>
    </div>
  );
}
