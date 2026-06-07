export type AdProvider = "none" | "google" | "direct";

export type AdsConfig = {
  enabled: boolean;
  provider: AdProvider;
  googleClientId: string;
  slotIds: {
    feedTop: string;
    feedMid: string;
    sidebar: string;
  };
  directAd: {
    title: string;
    imageUrl: string;
    targetUrl: string;
    description: string;
  };
};

export type AdsConfigOverrides = Partial<{
  enabled: boolean;
  provider: AdProvider;
  googleClientId: string;
  slotIds: Partial<AdsConfig["slotIds"]>;
  directAd: Partial<AdsConfig["directAd"]>;
}>;

export function getAdsConfigFromEnv(): AdsConfig {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const provider = (process.env.NEXT_PUBLIC_AD_PROVIDER ?? "none") as AdProvider;

  return {
    enabled,
    provider,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ?? "",
    slotIds: {
      feedTop: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_TOP ?? "1000001",
      feedMid: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_MID ?? "1000002",
      sidebar: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_SIDEBAR ?? "1000003",
    },
    directAd: {
      title: process.env.NEXT_PUBLIC_DIRECT_AD_TITLE ?? "Piblisite",
      imageUrl: process.env.NEXT_PUBLIC_DIRECT_AD_IMAGE_URL ?? "",
      targetUrl: process.env.NEXT_PUBLIC_DIRECT_AD_TARGET_URL ?? "#",
      description:
        process.env.NEXT_PUBLIC_DIRECT_AD_DESCRIPTION ??
        "Mete anons ou isit pou rive sou kominote ayisyen an.",
    },
  };
}

const PLACEHOLDER_AD_SLOTS = new Set(["1000001", "1000002", "1000003"]);

/** True when this slot can show real content (avoids empty gray AdSense placeholders). */
export function isRenderableAdSlot(
  ads: AdsConfig,
  slotKey: keyof AdsConfig["slotIds"],
): boolean {
  if (!ads.enabled) {
    return false;
  }
  if (ads.provider === "direct") {
    const { imageUrl, targetUrl } = ads.directAd;
    return Boolean(imageUrl?.trim() && targetUrl?.trim() && targetUrl !== "#");
  }
  if (ads.provider === "google") {
    const client = ads.googleClientId.trim();
    const slot = (ads.slotIds[slotKey] ?? "").trim();
    if (!client.includes("pub-") || !slot) {
      return false;
    }
    if (PLACEHOLDER_AD_SLOTS.has(slot)) {
      return false;
    }
    return true;
  }
  return false;
}

export function mergeAdsConfig(base: AdsConfig, overrides?: AdsConfigOverrides | null): AdsConfig {
  if (!overrides) {
    return base;
  }
  return {
    ...base,
    ...overrides,
    slotIds: {
      ...base.slotIds,
      ...(overrides.slotIds ?? {}),
    },
    directAd: {
      ...base.directAd,
      ...(overrides.directAd ?? {}),
    },
  };
}

