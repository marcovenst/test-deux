"use client";

import { useEffect, useState } from "react";

type ActiveSelfServeAd = {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  description: string;
  businessName: string;
  endsAt: string | null;
};

export function SelfServeAdStrip() {
  const [ad, setAd] = useState<ActiveSelfServeAd | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/ads/self-serve/active", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        const body = (await res.json()) as { data?: ActiveSelfServeAd[] };
        return body.data?.[0] ?? null;
      })
      .then((item) => {
        if (mounted) {
          setAd(item);
        }
      })
      .catch(() => null);

    return () => {
      mounted = false;
    };
  }, []);

  if (!ad) {
    return null;
  }

  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 transition hover:border-amber-300/60"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200">
        Sponsored
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.imageUrl} alt={ad.title} className="h-28 w-full rounded-lg object-cover" />
      <p className="mt-2 text-sm font-semibold text-white">{ad.title}</p>
      <p className="mt-1 text-xs text-neutral-300">{ad.description}</p>
      <p className="mt-1 text-[11px] text-amber-100/90">Pa {ad.businessName}</p>
    </a>
  );
}
