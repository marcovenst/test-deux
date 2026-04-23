"use client";

import { useEffect, useState } from "react";

import type { AdsConfig } from "@/lib/ads/config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slotId: "feedTop" | "feedMid" | "sidebar";
  className?: string;
  format?: "auto" | "horizontal" | "rectangle";
};

let cachedConfig: AdsConfig | null = null;
let configPromise: Promise<AdsConfig | null> | null = null;

async function fetchAdsConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  if (!configPromise) {
    configPromise = fetch("/api/ads/config", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = (await response.json()) as {
          config?: AdsConfig;
        };
        cachedConfig = payload.config ?? null;
        return cachedConfig;
      })
      .catch(() => null);
  }
  return configPromise;
}

function adFormatClass(format: NonNullable<AdSlotProps["format"]>) {
  if (format === "horizontal") {
    return "min-h-[90px]";
  }
  if (format === "rectangle") {
    return "min-h-[250px]";
  }
  return "min-h-[120px]";
}

export function AdSlot({ slotId, className, format = "auto" }: AdSlotProps) {
  const [ads, setAds] = useState<AdsConfig | null>(cachedConfig);

  useEffect(() => {
    let mounted = true;
    void fetchAdsConfig().then((config) => {
      if (mounted) {
        setAds(config);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ads?.enabled || ads.provider !== "google" || !ads.googleClientId) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore ad render failures.
    }
  }, [ads, slotId]);

  if (!ads?.enabled || ads.provider === "none") {
    return null;
  }

  const resolvedSlotId = ads.slotIds[slotId] ?? slotId;

  if (ads.provider === "google" && ads.googleClientId) {
    return (
      <div className={`rounded-xl border border-white/10 bg-black/20 p-2 ${className ?? ""}`}>
        <ins
          className={`adsbygoogle block w-full overflow-hidden rounded-md ${adFormatClass(format)}`}
          style={{ display: "block" }}
          data-ad-client={ads.googleClientId}
          data-ad-slot={resolvedSlotId}
          data-ad-format={format === "auto" ? "auto" : undefined}
          data-full-width-responsive={format === "auto" ? "true" : undefined}
        />
      </div>
    );
  }

  if (ads.provider === "direct" && ads.directAd.imageUrl && ads.directAd.targetUrl) {
    return (
      <a
        href={ads.directAd.targetUrl}
        target="_blank"
        rel="noreferrer"
        className={`block rounded-xl border border-amber-300/30 bg-amber-300/10 p-2 transition hover:border-amber-300/50 ${className ?? ""}`}
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200">
          {ads.directAd.title}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ads.directAd.imageUrl}
          alt={ads.directAd.title}
          className={`w-full rounded-md object-cover ${adFormatClass(format)}`}
        />
        <p className="mt-1 text-xs text-amber-100">{ads.directAd.description}</p>
      </a>
    );
  }

  return null;
}

