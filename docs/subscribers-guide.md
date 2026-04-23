# Subscribers Guide

This app now supports subscriber capture (email or phone), category interests, and realtime preference.

## Frontend

- The subscribe form is on the homepage in `src/components/subscribers/SubscribeForm.tsx`.
- Users can choose:
  - contact channel (`email` or `phone`)
  - interests/categories
  - optional keywords
  - realtime notifications toggle

## API Endpoints

- `POST /api/subscribe`
  - Public endpoint for new subscriptions.
  - Payload:
    - `fullName`
    - `contactChannel` (`email` | `phone`)
    - `email` or `phone`
    - `interests` (array)
    - `keywords` (array)
    - `notifyRealtime` (boolean)

- `GET /api/subscribers`
  - Protected endpoint.
  - Requires header: `Authorization: Bearer <INGESTION_SHARED_SECRET>`
  - Returns JSON list from file store.

- `GET /api/subscribers?format=csv`
  - Protected endpoint.
  - Returns CSV export for direct outreach/import workflows.

- `POST /api/jobs/notify-subscribers`
  - Protected endpoint.
  - Tries to notify matching subscribers for top new trends.

## Storage

Subscribers are saved in two places:

1. Database tables (migration `supabase/migrations/0002_subscribers.sql`)
   - `subscribers`
   - `subscriber_interests`
   - `subscriber_notifications`

2. Files in workspace (portable backup/export)
   - `data/subscribers.jsonl`
   - `data/subscribers.csv`

## Optional delivery providers

Notification delivery uses optional environment variables:

- Email (Resend):
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

- SMS (Twilio):
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`

If those vars are missing, subscriber capture still works and records are still stored.

