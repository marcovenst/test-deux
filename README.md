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
  - Reddit: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
  - X via Apify: `APIFY_TOKEN`, `APIFY_ACTOR_ID`
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

## Useful Endpoints

- `GET /api/health` - deployment/runtime readiness checks
- `GET /api/trends` - trend feed API
- `GET /api/search?q=...` - deep archive search
- `GET /news` - archive index page
- `GET /search` - user search page

## Commands

- `pnpm lint`
- `pnpm test`
- `pnpm build`
