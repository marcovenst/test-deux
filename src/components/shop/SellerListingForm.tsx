"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { shopLaCailleCopy } from "@/lib/i18n/ht";
import { MAX_LISTING_IMAGES } from "@/lib/shop/marketplace";

function dollarsToCents(s: string): number | null {
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function SellerListingForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sellerName, setSellerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [shipping, setShipping] = useState("0");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const imageUrlsRef = useRef(imageUrls);
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.size > 0);
      if (!list.length) return;
      setError(null);
      const next: string[] = [...imageUrlsRef.current];
      for (const file of list) {
        if (next.length >= MAX_LISTING_IMAGES) break;
        try {
          const url = await uploadFile(file);
          next.push(url);
        } catch (e) {
          setError(e instanceof Error ? e.message : shopLaCailleCopy.uploadFailed);
          break;
        }
      }
      const capped = next.slice(0, MAX_LISTING_IMAGES);
      setImageUrls(capped);
      imageUrlsRef.current = capped;
    },
    [uploadFile],
  );

  async function onFilesSelected(files: FileList | null) {
    await addFiles(files ?? []);
  }

  function removeImage(url: string) {
    setImageUrls((prev) => {
      const u = prev.filter((x) => x !== url);
      imageUrlsRef.current = u;
      return u;
    });
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
      const res = await fetch("/api/shop/listings/publish", {
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
      const data = (await res.json()) as {
        ok?: boolean;
        dashboardUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.dashboardUrl) {
        throw new Error(data.error ?? "Echèk");
      }
      router.push(`${data.dashboardUrl}?published=1`);
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
        <p className="text-sm font-medium text-neutral-200">{shopLaCailleCopy.imagesLabel}</p>
        <p className="mt-1 text-xs text-neutral-500">{shopLaCailleCopy.vannPhotosDragHint}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*"
          multiple
          className="sr-only"
          aria-label={shopLaCailleCopy.imagesLabel}
          onChange={(e) => {
            void onFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const files = e.dataTransfer.files;
            if (files?.length) void addFiles(files);
          }}
          className={`mt-3 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center text-sm transition sm:min-h-[160px] ${
            dragOver
              ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
              : "border-white/20 bg-white/[0.02] text-neutral-400 hover:border-amber-400/40 hover:bg-amber-500/5"
          }`}
        >
          <span className="text-base font-semibold text-neutral-200">+ Ajoute foto atik la</span>
          <span className="mt-2 max-w-sm text-xs text-neutral-500">
            Glise-lage oswa klike • {imageUrls.length}/{MAX_LISTING_IMAGES} foto
          </span>
        </button>

        <div className="mt-4 flex flex-wrap gap-3">
          {imageUrls.map((url) => (
            <div
              key={url}
              className="relative h-28 w-28 overflow-hidden rounded-lg border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white hover:bg-black/90"
                aria-label="Retire foto a"
              >
                ×
              </button>
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
