"use client";

import { useEffect } from "react";

type AdsConfigPayload = {
  enabled: boolean;
  provider: "none" | "google" | "direct";
  googleClientId: string;
};

let cachedConfig: AdsConfigPayload | null = null;
let configPromise: Promise<AdsConfigPayload | null> | null = null;

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
          config?: AdsConfigPayload;
        };
        cachedConfig = payload.config ?? null;
        return cachedConfig;
      })
      .catch(() => null);
  }
  return configPromise;
}

export function GoogleAdsScript() {
  useEffect(() => {
    let mounted = true;

    void (async () => {
      const ads = await fetchAdsConfig();
      if (!mounted || !ads || !ads.enabled || ads.provider !== "google" || !ads.googleClientId) {
        return;
      }

      const scriptId = "google-adsense-script";
      if (document.getElementById(scriptId)) {
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.googleClientId}`;
      document.head.appendChild(script);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}

