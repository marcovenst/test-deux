"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { MIN_PAYOUT_CENTS } from "@/lib/shop/marketplace";

type PayoutMethod = "ach" | "zelle" | "debit_card";

type Props = {
  accessToken: string;
  availableToCashOutCents: number;
};

export function SellerPayoutForm({ accessToken, availableToCashOutCents }: Props) {
  const router = useRouter();
  const [amountUsd, setAmountUsd] = useState("");
  const [method, setMethod] = useState<PayoutMethod>("zelle");
  const [zelleContact, setZelleContact] = useState("");
  const [achName, setAchName] = useState("");
  const [achBank, setAchBank] = useState("");
  const [achLast4, setAchLast4] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const minUsd = (MIN_PAYOUT_CENTS / 100).toFixed(2);
  const maxUsd = (availableToCashOutCents / 100).toFixed(2);

  async function submit() {
    setError(null);
    const n = Number.parseFloat(amountUsd.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(n) || n <= 0) {
      setError(shopLaCailleCopy.sellerPayoutInvalidAmount);
      return;
    }
    const amountCents = Math.round(n * 100);
    if (amountCents < MIN_PAYOUT_CENTS) {
      setError(shopLaCailleCopy.sellerPayoutMin.replace("$MIN", `$${minUsd}`));
      return;
    }
    if (amountCents > availableToCashOutCents) {
      setError(shopLaCailleCopy.sellerPayoutTooMuch);
      return;
    }

    let recipient: Record<string, unknown> = {};
    if (method === "zelle") {
      if (!zelleContact.trim()) {
        setError(shopLaCailleCopy.sellerPayoutZelleRequired);
        return;
      }
      recipient = { zelle_contact: zelleContact.trim() };
    } else if (method === "ach") {
      if (!achName.trim() || !achBank.trim() || achLast4.trim().length < 4) {
        setError(shopLaCailleCopy.sellerPayoutAchRequired);
        return;
      }
      recipient = {
        account_holder: achName.trim(),
        bank_name: achBank.trim(),
        account_last4: achLast4.trim().slice(-4),
      };
    } else {
      if (!cardName.trim() || cardLast4.trim().length < 4) {
        setError(shopLaCailleCopy.sellerPayoutCardRequired);
        return;
      }
      recipient = {
        name_on_card: cardName.trim(),
        card_last4: cardLast4.trim().slice(-4),
      };
    }

    setBusy(true);
    try {
      const res = await fetch("/api/shop/sellers/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, amountCents, method, recipient }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Echèk");
      }
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Echèk");
    } finally {
      setBusy(false);
    }
  }

  if (availableToCashOutCents < MIN_PAYOUT_CENTS) {
    return (
      <p className="rounded-lg border border-white/15 bg-white/[0.03] p-4 text-sm text-neutral-400">
        {shopLaCailleCopy.sellerPayoutBelowMin.replace("$MIN", `$${minUsd}`)}
      </p>
    );
  }

  if (done) {
    return (
      <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        {shopLaCailleCopy.sellerPayoutSubmitted}
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">{shopLaCailleCopy.sellerPayoutTitle}</h2>
      <p className="text-xs text-neutral-500">{shopLaCailleCopy.sellerPayoutDisclaimer}</p>

      <label className="block text-sm">
        <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutAmount}</span>
        <input
          type="text"
          inputMode="decimal"
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
          placeholder={`${minUsd} – ${maxUsd}`}
          value={amountUsd}
          onChange={(e) => setAmountUsd(e.target.value)}
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm text-neutral-400">{shopLaCailleCopy.sellerPayoutMethod}</legend>
        {(
          [
            ["zelle", shopLaCailleCopy.sellerPayoutZelle],
            ["ach", shopLaCailleCopy.sellerPayoutAch],
            ["debit_card", shopLaCailleCopy.sellerPayoutDebit],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="payout-method"
              checked={method === value}
              onChange={() => setMethod(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      {method === "zelle" ? (
        <label className="block text-sm">
          <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutZelleField}</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            value={zelleContact}
            onChange={(e) => setZelleContact(e.target.value)}
            placeholder="email oswa telefòn"
          />
        </label>
      ) : null}

      {method === "ach" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutAchName}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
              value={achName}
              onChange={(e) => setAchName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutAchBank}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
              value={achBank}
              onChange={(e) => setAchBank(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutAchLast4}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
              value={achLast4}
              onChange={(e) => setAchLast4(e.target.value)}
              maxLength={4}
              inputMode="numeric"
            />
          </label>
        </div>
      ) : null}

      {method === "debit_card" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutCardName}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-neutral-400">{shopLaCailleCopy.sellerPayoutCardLast4}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
              value={cardLast4}
              onChange={(e) => setCardLast4(e.target.value)}
              maxLength={4}
              inputMode="numeric"
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy ? shopLaCailleCopy.checkoutLoading : shopLaCailleCopy.sellerPayoutSubmit}
      </button>
    </div>
  );
}
