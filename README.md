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

## Production Readiness Checklist

### Required (must-have)

- Set real values for:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `INGESTION_SHARED_SECRET`
  - `NEXT_PUBLIC_APP_URL` (your production domain)
- Apply both Supabase migrations.
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

To run jobs manually (use your shared secret):

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/jobs/pipeline" \
  -H "Authorization: Bearer $INGESTION_SHARED_SECRET"
```

To configure QStash schedules:

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/jobs/schedule" \
  -H "Authorization: Bearer $INGESTION_SHARED_SECRET"
```

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
