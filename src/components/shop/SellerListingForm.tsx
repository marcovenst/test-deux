"use client";

import { useCallback, useState } from "react";

import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { MAX_LISTING_IMAGES } from "@/lib/shop/marketplace";

function dollarsToCents(s: string): number | null {
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function SellerListingForm() {
  const [sellerName, setSellerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [shipping, setShipping] = useState("0");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/shop/listings/upload", { method: "POST", body: form });
    const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
    if (!res.ok || !data.ok || !data.url) {
      throw new Error(data.error ?? shopLaCailleCopy.uploadFailed);
    }
    return data.url;
  }, []);

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const next: string[] = [...imageUrls];
    for (let i = 0; i < files.length && next.length < MAX_LISTING_IMAGES; i += 1) {
      try {
        const url = await uploadFile(files[i]);
        next.push(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : shopLaCailleCopy.uploadFailed);
        break;
      }
    }
    setImageUrls(next.slice(0, MAX_LISTING_IMAGES));
  }

  async function submit() {
    setError(null);
    const priceCents = dollarsToCents(price);
    const shippingCents = dollarsToCents(shipping) ?? 0;
    if (priceCents === null || priceCents < 100) {
      setError("Antre yon pri valab (min $1.00)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/shop/listings/posting-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerName,
          sellerEmail,
          sellerPhone: sellerPhone || undefined,
          title,
          description,
          priceCents,
          shippingCents,
          imageUrls,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; checkoutUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Echèk");
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Echèk");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-50">
        {shopLaCailleCopy.postingFeeBanner}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-neutral-400">{shopLaCailleCopy.sellerName}</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-neutral-400">{shopLaCailleCopy.sellerEmail}</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            value={sellerEmail}
            onChange={(e) => setSellerEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-neutral-400">{shopLaCailleCopy.sellerPhone}</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            value={sellerPhone}
            onChange={(e) => setSellerPhone(e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-neutral-400">{shopLaCailleCopy.productTitle}</span>
        <input
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="text-neutral-400">{shopLaCailleCopy.description}</span>
        <textarea
          rows={5}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-neutral-400">{shopLaCailleCopy.priceUsd}</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="29.99"
          />
        </label>
        <label className="block text-sm">
          <span className="text-neutral-400">{shopLaCailleCopy.shippingUsd}</span>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white"
            value={shipping}
            onChange={(e) => setShipping(e.target.value)}
            placeholder="5.00"
          />
        </label>
      </div>

      <div>
        <p className="text-sm text-neutral-400">{shopLaCailleCopy.imagesLabel}</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="mt-2 text-sm text-neutral-300"
          onChange={(e) => void onFilesSelected(e.target.files)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {imageUrls.map((url) => (
            <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || imageUrls.length < 1}
        className="w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-black disabled:opacity-40"
      >
        {busy ? shopLaCailleCopy.checkoutLoading : shopLaCailleCopy.submit}
      </button>
    </div>
  );
}
