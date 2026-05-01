# Ads / Monetization Guide

You can run ads on Zen Rezo A with either Google AdSense or direct sponsored ads.
You can also sell sponsored placements with Stripe-powered self-serve checkout.

## 1) Enable ads

Edit `.env.local`:

- `NEXT_PUBLIC_ADS_ENABLED="true"`
- `NEXT_PUBLIC_AD_PROVIDER="google"` or `"direct"`

Restart dev server after changes:

```bash
pnpm dev
```

## Admin UI (no code edits needed)

You can manage ads from:

- `/admin/ads`

Use your token (`ADMIN_DASHBOARD_TOKEN`) to load/save ad overrides.
Saved overrides are stored in:

- `data/ads-settings.json`

## 2) Google AdSense mode

Set:

- `NEXT_PUBLIC_AD_PROVIDER="google"`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID="ca-pub-..."`

Ad slots are already placed in:

- Main feed top
- Mid feed
- Sidebar

Default slot IDs:

- `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_TOP`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_MID`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_SIDEBAR`

You can also override slot IDs from `/admin/ads`.

## 3) Direct sponsored ad mode

Set:

- `NEXT_PUBLIC_AD_PROVIDER="direct"`
- `NEXT_PUBLIC_DIRECT_AD_IMAGE_URL`
- `NEXT_PUBLIC_DIRECT_AD_TARGET_URL`
- Optional text fields:
  - `NEXT_PUBLIC_DIRECT_AD_TITLE`
  - `NEXT_PUBLIC_DIRECT_AD_DESCRIPTION`

This is useful for direct partnerships or internal campaigns.

## 4) Turn ads off

Set:

- `NEXT_PUBLIC_ADS_ENABLED="false"`

## 5) Self-serve paid ads (Stripe)

Self-serve checkout creates an order first, then redirects buyers to Stripe Checkout.
On successful payment, Stripe calls the webhook and the order is activated.

Required env vars:

- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Routes involved:

- `POST /api/ads/self-serve/checkout`
- `POST /api/ads/self-serve/webhook`
- `GET /api/ads/self-serve/active`

Webhook behavior:

- The webhook validates `stripe-signature` with `STRIPE_WEBHOOK_SECRET`.
- It handles `checkout.session.completed`.
- `metadata.adOrderId` is required; missing metadata returns `400`.
- Duplicate deliveries are idempotent and do not shift an already-active ad window.

Operational checks:

- `GET /api/monetization/health` validates required Stripe config.
- The same health endpoint reports stale self-serve orders that stay `pending_payment` for more than 6 hours.

## Files involved

- `src/components/ads/GoogleAdsScript.tsx`
- `src/components/ads/AdSlot.tsx`
- `src/lib/ads/config.ts`
- `src/lib/ads/settings.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/admin/ads/page.tsx`
- `src/app/api/ads/config/route.ts`
- `src/app/api/admin/ads/route.ts`
- `src/components/ads/SelfServeAdLauncher.tsx`
- `src/components/ads/SelfServeAdStrip.tsx`
- `src/app/api/ads/self-serve/checkout/route.ts`
- `src/app/api/ads/self-serve/webhook/route.ts`
- `src/app/api/ads/self-serve/active/route.ts`
- `src/lib/ads/selfServe.ts`

