# Zen Rezo A

Zen Rezo A is a Haitian news/trends aggregator built with Next.js + Supabase.

It ingests data from RSS/web/social providers, clusters related stories, scores trends, and renders searchable story landing pages (`/cluster/[id]`) plus archive browsing (`/news`).

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill real values in `.env.local` (at minimum Supabase + ingestion secret).

4. Run database migrations in Supabase SQL editor:
   - `supabase/migrations/0001_core_schema.sql`
   - `supabase/migrations/0002_subscribers.sql`
   - `supabase/migrations/0003_self_serve_ads.sql`
   - `supabase/migrations/0004_cluster_views.sql`
   - `supabase/migrations/0005_cluster_reactions.sql`
   - `supabase/migrations/0006_cluster_play_metrics.sql`
   - `supabase/migrations/0007_billing_subscriptions.sql`

5. Start dev server:

```bash
pnpm dev
```

## Monetization & ads

1. Copy `.env.example` → `.env.local` and fill **Stripe** keys plus display ad vars (see comments in `.env.example`).
2. **Google AdSense:** apply in [Google AdSense](https://www.google.com/adsense/), add your **production** site, ensure **`/privacy`** is live (footer link), create **ad units** for the three placements, then set `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` and the three `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_*` values. Turn on `NEXT_PUBLIC_ADS_ENABLED="true"`.
3. **ads.txt:** deploy, then verify `https://zenlakay.com/ads.txt` (auto-built from your client id, or set `ADS_TXT_CONTENT` for custom rows).
4. **Self-serve checkout:** apply migration `0003_self_serve_ads.sql`, add Stripe webhook `POST /api/ads/self-serve/webhook` for `checkout.session.completed`.
5. **Subscriptions (optional):** see `docs/monetization-phase2-subscriptions.md`; webhook `POST /api/billing/webhook`, `STRIPE_SUBSCRIPTION_PRICE_ID`, etc.
6. **Verify:** `GET /api/monetization/health` (expect `200` when at least one revenue path is configured). Full detail: `docs/ads-guide.md`.

## SEO (Google & social)

- **Metadata:** Root layout sets `metadataBase`, Open Graph, Twitter cards, `robots` / `googleBot`, theme color, and optional `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (Search Console). Per-page titles and canonicals are set on `/`, `/news`, `/search`, clusters, and shop pages.
- **Structured data:** Sitewide `WebSite` + `Organization` JSON-LD with `SearchAction` pointing at `/search`; cluster pages emit `NewsArticle` schema.
- **Discovery:** `sitemap.xml` includes static routes plus recent clusters; `robots.txt` lists sitemap, `host`, and disallows `/admin/` and seller token URLs.
- **Share images:** `/opengraph-image` and `/twitter-image` provide a default 1200×630 card (edge-generated).

### AdSense + Stripe self-serve together

Set **all** of the following on your host (e.g. Vercel → Project → Settings → Environment Variables):

- **Site URL:** `NEXT_PUBLIC_APP_URL` = `https://zenlakay.com` (no trailing slash).
- **AdSense:** `NEXT_PUBLIC_ADS_ENABLED` = `true`, `NEXT_PUBLIC_AD_PROVIDER` = `google`, `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` = `ca-pub-…`, and the three `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_*` values from the AdSense ad units.
- **ads.txt:** usually automatic from the client id once deployed; use `ADS_TXT_CONTENT` only if you need extra lines (MCM, multiple sellers).
- **Stripe (shared by checkout + this webhook):** `STRIPE_SECRET_KEY` (live in production), `STRIPE_WEBHOOK_SECRET` = signing secret for the endpoint below.
- **Optional:** `ADMIN_DASHBOARD_TOKEN` for `/admin/ads` overrides.

**Stripe → Developers → Webhooks** — add **one** endpoint for paid ads (and marketplace checkouts that share this handler):

- **URL:** `https://zenlakay.com/api/ads/self-serve/webhook`
- **Events (minimal):** `checkout.session.completed`
- Paste the endpoint’s **signing secret** into `STRIPE_WEBHOOK_SECRET`.

Use **live** keys and a **live** webhook in production. After deploy, confirm `GET /api/monetization/health`: you want `summary.adsenseReady` and `summary.selfServeReady` both true when both paths are wired. Subscriptions use a **separate** route and secret (`/api/billing/webhook`, `STRIPE_BILLING_WEBHOOK_SECRET`); see **Subscriptions (phase 2)** below if you add that later.

## Production Readiness Checklist

### Required (must-have)

- Set real values for:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `INGESTION_SHARED_SECRET`
  - `CRON_SECRET` (so Vercel’s daily `GET /api/jobs/pipeline` cron is authorized)
  - `NEXT_PUBLIC_APP_URL` (production: `https://zenlakay.com`)
- Apply all Supabase migrations.
- Deploy app and confirm `/api/health` returns `ok: true`.

### Live data providers

- RSS + web scraping work without API keys.
- Optional providers (enable by adding credentials):
  - YouTube: `YOUTUBE_API_KEY`
  - X via Apify: `APIFY_TOKEN`, `APIFY_ACTOR_ID`
  - Facebook via Apify: `APIFY_TOKEN`, `APIFY_FACEBOOK_ACTOR_ID`
  - Instagram via Apify: `APIFY_TOKEN`, `APIFY_INSTAGRAM_ACTOR_ID`
  - TikTok via Apify: `APIFY_TOKEN`, `APIFY_TIKTOK_ACTOR_ID`
  - Summaries: `ANTHROPIC_API_KEY`

If optional credentials are missing, ingestion still runs, but those sources are skipped.

### Background jobs / schedules

**Automatic site updates:** Trend content on `/`, `/news`, `/search`, and cluster pages comes from Supabase after the ingestion pipeline runs. In production, wire that up in one of these ways:

1. **Vercel Cron (one run per day on Hobby):** `vercel.json` schedules `GET /api/jobs/pipeline` at **10:00 UTC**, which matches [Vercel Hobby’s once-per-day cron limit](https://vercel.com/docs/cron-jobs/usage-and-pricing). Set **`CRON_SECRET`**; Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron requests. For **at least two full refreshes per day** on Hobby, add **Upstash QStash** below (evening run). On **Vercel Pro**, you can instead set `vercel.json` to `0 10,22 * * *` for morning + evening without QStash.

2. **Upstash QStash (second daily run on Hobby, or replace Vercel cron):** `src/lib/jobs/scheduler.ts` registers an extra `POST /api/jobs/pipeline` at **22:00 UTC** plus the newsletter schedule. After setting `UPSTASH_QSTASH_TOKEN`, run:

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/jobs/schedule" \
  -H "Authorization: Bearer $INGESTION_SHARED_SECRET"
```

To run the pipeline yourself (manual or from another scheduler):

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/jobs/pipeline" \
  -H "Authorization: Bearer $INGESTION_SHARED_SECRET"
```

Or from the repo (reads `.env.local` for `NEXT_PUBLIC_APP_URL`, `INGESTION_SHARED_SECRET` or `CRON_SECRET`):

```bash
pnpm pipeline:run
```

This can take several minutes (ingest + cluster + score + summarize). When it finishes with `ok: true`, the route revalidates `/`, `/news`, and `/search` so a normal browser refresh shows new clusters—including Apify social sources once `APIFY_TOKEN` and the actor IDs are set in Vercel.

### Subscriber notifications (optional)

- Email: set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- SMS: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- Daily digest job:
  - `POST /api/jobs/newsletter` (protected with `INGESTION_SHARED_SECRET`)
  - Sends all active subscribers a daily recap and invites them back to the landing page.

### Self-serve ads ($5 checkout)

- Set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Create a Stripe webhook endpoint to:
  - `POST /api/ads/self-serve/webhook`
  - listen for `checkout.session.completed`
- Users can then submit and pay directly from the homepage footer button.
- Supported plans:
  - `$5` for 1 day
  - `$20` for 5 days
  - `$50` for 30 days

### Subscriptions (phase 2)

- Set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_SUBSCRIPTION_PRICE_ID`
  - `STRIPE_BILLING_WEBHOOK_SECRET` (or fallback to `STRIPE_WEBHOOK_SECRET`)
- Add Stripe webhook endpoint:
  - `POST /api/billing/webhook`
  - listen for:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
- Checkout endpoint:
  - `POST /api/billing/checkout`
- Customer portal endpoint:
  - `POST /api/billing/portal`
- Billing status endpoint:
  - `GET /api/billing/status?userId=<id>`
- Protected example route:
  - `GET /api/member/content` with `x-user-id` header

## Useful Endpoints

- `GET /api/health` - deployment/runtime readiness checks
- `GET /api/monetization/health` - monetization readiness checks (Stripe + ads)
- `GET /api/trends` - trend feed API
- `GET /api/search?q=...` - deep archive search
- `GET /news` - archive index page
- `GET /search` - user search page

## Commands

- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Adding New Content Categories (No Code Change)

To add/rename categories, edit:

- `src/config/trend-categories.json`

Each category supports:

- `id`: canonical category key used in APIs/feed
- `labelHt`: Haitian Creole UI label
- `aliases`: alternative words mapped to this category (for URL/query normalization)

After editing, restart dev server.
