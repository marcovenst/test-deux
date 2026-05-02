import { NextResponse } from "next/server";

import { countStalePendingSelfServeAdOrders } from "@/lib/ads/selfServe";
import { isConfigured } from "@/lib/config/env";

type Check = {
  name: string;
  ok: boolean;
  message: string;
};

function parseBool(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeShopWebhook = process.env.STRIPE_SHOP_WEBHOOK_SECRET;
  const stripeBillingWebhook = process.env.STRIPE_BILLING_WEBHOOK_SECRET ?? stripeWebhook;
  const stripeSubscriptionPrice = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
  const adsEnabled = parseBool(process.env.NEXT_PUBLIC_ADS_ENABLED);
  const adProvider = (process.env.NEXT_PUBLIC_AD_PROVIDER ?? "none").trim().toLowerCase();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const googleSlotFeedTop = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_TOP;
  const googleSlotFeedMid = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_MID;
  const googleSlotSidebar = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_SIDEBAR;

  const directAdImage = process.env.NEXT_PUBLIC_DIRECT_AD_IMAGE_URL;
  const directAdTarget = process.env.NEXT_PUBLIC_DIRECT_AD_TARGET_URL;

  const checks: Check[] = [
    {
      name: "app-url",
      ok: isConfigured(appUrl),
      message: isConfigured(appUrl)
        ? "configured"
        : "NEXT_PUBLIC_APP_URL missing; checkout redirects will break",
    },
    {
      name: "stripe-secret-key",
      ok: isConfigured(stripeSecret),
      message: isConfigured(stripeSecret)
        ? "configured"
        : "STRIPE_SECRET_KEY missing; self-serve checkout disabled",
    },
    {
      name: "stripe-webhook-secret",
      ok: isConfigured(stripeWebhook),
      message: isConfigured(stripeWebhook)
        ? "configured"
        : "STRIPE_WEBHOOK_SECRET missing; paid orders will not auto-activate",
    },
    {
      name: "stripe-shop-webhook-secret",
      ok: isConfigured(stripeShopWebhook) || isConfigured(stripeWebhook),
      message: isConfigured(stripeShopWebhook)
        ? "STRIPE_SHOP_WEBHOOK_SECRET set (dedicated /api/shop/webhook)"
        : isConfigured(stripeWebhook)
          ? "using STRIPE_WEBHOOK_SECRET for shop (merged handler on /api/ads/self-serve/webhook)"
          : "no shop webhook secret; marketplace posting/sales need STRIPE_WEBHOOK_SECRET or STRIPE_SHOP_WEBHOOK_SECRET",
    },
    {
      name: "stripe-billing-webhook-secret",
      ok: isConfigured(stripeBillingWebhook),
      message: isConfigured(stripeBillingWebhook)
        ? "configured"
        : "STRIPE_BILLING_WEBHOOK_SECRET (or STRIPE_WEBHOOK_SECRET fallback) missing; subscription updates will fail",
    },
    {
      name: "stripe-subscription-price-id",
      ok: isConfigured(stripeSubscriptionPrice),
      message: isConfigured(stripeSubscriptionPrice)
        ? "configured"
        : "STRIPE_SUBSCRIPTION_PRICE_ID missing; subscription checkout requires explicit priceId in payload",
    },
    {
      name: "ads-enabled",
      ok: adsEnabled,
      message: adsEnabled
        ? "enabled"
        : "NEXT_PUBLIC_ADS_ENABLED is false; display ads are currently off",
    },
    {
      name: "ads-provider",
      ok: adProvider === "google" || adProvider === "direct",
      message:
        adProvider === "google" || adProvider === "direct"
          ? `${adProvider} selected`
          : "NEXT_PUBLIC_AD_PROVIDER is none/invalid",
    },
  ];

  if (adProvider === "google") {
    checks.push(
      {
        name: "adsense-client-id",
        ok: isConfigured(googleClientId),
        message: isConfigured(googleClientId)
          ? "configured"
          : "NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID missing",
      },
      {
        name: "adsense-slot-feed-top",
        ok: isConfigured(googleSlotFeedTop),
        message: isConfigured(googleSlotFeedTop)
          ? "configured"
          : "NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_TOP missing",
      },
      {
        name: "adsense-slot-feed-mid",
        ok: isConfigured(googleSlotFeedMid),
        message: isConfigured(googleSlotFeedMid)
          ? "configured"
          : "NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_MID missing",
      },
      {
        name: "adsense-slot-sidebar",
        ok: isConfigured(googleSlotSidebar),
        message: isConfigured(googleSlotSidebar)
          ? "configured"
          : "NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_SIDEBAR missing",
      },
    );
  }

  if (adProvider === "direct") {
    checks.push(
      {
        name: "direct-ad-image-url",
        ok: isConfigured(directAdImage),
        message: isConfigured(directAdImage)
          ? "configured"
          : "NEXT_PUBLIC_DIRECT_AD_IMAGE_URL missing",
      },
      {
        name: "direct-ad-target-url",
        ok: isConfigured(directAdTarget),
        message: isConfigured(directAdTarget)
          ? "configured"
          : "NEXT_PUBLIC_DIRECT_AD_TARGET_URL missing",
      },
    );
  }

  let stalePendingOrders = 0;
  try {
    stalePendingOrders = await countStalePendingSelfServeAdOrders(6);
    checks.push({
      name: "self-serve-pending-orders",
      ok: stalePendingOrders === 0,
      message:
        stalePendingOrders === 0
          ? "no stale pending self-serve orders"
          : `${stalePendingOrders} pending self-serve order(s) older than 6h`,
    });
  } catch (error) {
    checks.push({
      name: "self-serve-pending-orders",
      ok: false,
      message:
        error instanceof Error
          ? `failed to query pending self-serve orders: ${error.message}`
          : "failed to query pending self-serve orders",
    });
  }

  const selfServeReady =
    isConfigured(appUrl) && isConfigured(stripeSecret) && isConfigured(stripeWebhook);
  const subscriptionsReady =
    isConfigured(appUrl) &&
    isConfigured(stripeSecret) &&
    isConfigured(stripeBillingWebhook) &&
    isConfigured(stripeSubscriptionPrice);
  const adsenseReady =
    adsEnabled &&
    adProvider === "google" &&
    isConfigured(googleClientId) &&
    isConfigured(googleSlotFeedTop) &&
    isConfigured(googleSlotFeedMid) &&
    isConfigured(googleSlotSidebar);
  const directAdReady =
    adsEnabled && adProvider === "direct" && isConfigured(directAdImage) && isConfigured(directAdTarget);

  const monetizationReady =
    selfServeReady ||
    subscriptionsReady ||
    adsenseReady ||
    directAdReady ||
    shopMarketplaceReady;

  return NextResponse.json(
    {
      ok: monetizationReady,
      checks,
      summary: {
        selfServeReady,
        subscriptionsReady,
        adsenseReady,
        directAdReady,
        shopMarketplaceReady,
        stalePendingOrders,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: monetizationReady ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
