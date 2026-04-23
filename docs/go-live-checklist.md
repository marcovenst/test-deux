# Go-Live Checklist

This checklist is ordered so you can launch safely with minimal surprises.

## 1) Preflight (local)

- [ ] `pnpm install`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Confirm local health: `curl http://localhost:3000/api/health`

## 2) Production environment variables

Set these in your hosting provider (Vercel/Netlify/Render/etc.):

### Required

- [ ] `NEXT_PUBLIC_APP_URL` (your production domain, e.g. `https://yourdomain.com`)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `INGESTION_SHARED_SECRET` (random long secret)

### Ads + monetization

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `ADMIN_DASHBOARD_TOKEN` (for `/admin/ads`)
- [ ] `NEXT_PUBLIC_ADS_ENABLED` (`true` or `false`)
- [ ] `NEXT_PUBLIC_AD_PROVIDER` (`direct`, `google`, or `none`)

If using Google AdSense:

- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID`
- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_TOP`
- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_FEED_MID`
- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_SIDEBAR`

If using direct sponsored mode:

- [ ] `NEXT_PUBLIC_DIRECT_AD_TITLE` (optional)
- [ ] `NEXT_PUBLIC_DIRECT_AD_DESCRIPTION` (optional)
- [ ] `NEXT_PUBLIC_DIRECT_AD_IMAGE_URL`
- [ ] `NEXT_PUBLIC_DIRECT_AD_TARGET_URL`

### Optional live-data providers

- [ ] `YOUTUBE_API_KEY`
- [ ] `REDDIT_CLIENT_ID`
- [ ] `REDDIT_CLIENT_SECRET`
- [ ] `REDDIT_USER_AGENT` (optional, defaults in code)
- [ ] `APIFY_TOKEN`
- [ ] `APIFY_ACTOR_ID`
- [ ] `ANTHROPIC_API_KEY` (AI summaries)

### Optional notifications

- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_FROM_NUMBER`

## 3) Database rollout (Supabase)

- [ ] Run migrations in this order:
  - [ ] `supabase/migrations/0001_core_schema.sql`
  - [ ] `supabase/migrations/0002_subscribers.sql`
  - [ ] `supabase/migrations/0003_self_serve_ads.sql`
  - [ ] `supabase/migrations/0004_cluster_views.sql`
  - [ ] `supabase/migrations/0005_cluster_reactions.sql`
  - [ ] `supabase/migrations/0006_cluster_play_metrics.sql`
- [ ] Verify key tables exist and are writable by server routes.

## 4) Stripe (self-serve ads)

- [ ] Create products/prices for:
  - [ ] `$5` / 1 day
  - [ ] `$20` / 5 days
  - [ ] `$50` / 30 days
- [ ] Add webhook endpoint:
  - [ ] `POST https://<your-domain>/api/ads/self-serve/webhook`
- [ ] Subscribe webhook to `checkout.session.completed`
- [ ] Copy endpoint signing secret into `STRIPE_WEBHOOK_SECRET`
- [ ] Run one live checkout test and confirm ad activation.

## 5) Jobs + scheduling

- [ ] Trigger one pipeline run manually:

```bash
curl -X POST "https://<your-domain>/api/jobs/pipeline" \
  -H "Authorization: Bearer <INGESTION_SHARED_SECRET>"
```

- [ ] Register schedules:

```bash
curl -X POST "https://<your-domain>/api/jobs/schedule" \
  -H "Authorization: Bearer <INGESTION_SHARED_SECRET>"
```

- [ ] Confirm ingestion -> clustering -> scoring -> summarize all complete without errors.

## 6) Smoke test in production

- [ ] `GET /api/health` returns healthy payload.
- [ ] Homepage loads without `500`.
- [ ] `GET /api/trends` returns data.
- [ ] Search flow works (`/search`, `/api/search?q=...`).
- [ ] Archive works (`/news`, `/cluster/[id]`).
- [ ] Subscribe flow creates records.
- [ ] Self-serve ad checkout + webhook updates ad state.

## 7) SEO + discovery

- [ ] Verify `GET /robots.txt`
- [ ] Verify `GET /sitemap.xml`
- [ ] Submit sitemap in Google Search Console + Bing Webmaster Tools.

## 8) Monitoring and operations

- [ ] Add uptime checks for `/api/health` and homepage.
- [ ] Add error alerting for `/api/jobs/*` and `/api/ads/self-serve/webhook`.
- [ ] Define incident channel + owner.
- [ ] Set weekly review for ingestion quality and source failures.

## 9) Launch-day runbook

- [ ] Freeze non-critical code changes.
- [ ] Deploy from clean commit.
- [ ] Run smoke test checklist above.
- [ ] Trigger pipeline manually once after deploy.
- [ ] Announce launch.
- [ ] Monitor logs/errors for 60 minutes.

## What you must do personally

These are account/domain/payment ownership tasks that cannot be completed by code changes alone:

- [ ] Buy/connect domain and set DNS records.
- [ ] Configure SSL/custom domain in hosting.
- [ ] Create and verify Stripe live account settings.
- [ ] Set up provider accounts/keys (Supabase, Apify, Reddit, YouTube, Anthropic, Resend, Twilio).
- [ ] Configure mailbox/contact channel for support.

Once these are set, the rest (code wiring, validation, and troubleshooting) can be handled inside the repo workflow.
