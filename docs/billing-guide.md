# Billing / Subscriptions Guide

This guide documents recurring subscription billing (Phase 2) and how it connects to entitlements.

## Environment variables

- `STRIPE_SECRET_KEY`
- `STRIPE_SUBSCRIPTION_PRICE_ID`
- `STRIPE_BILLING_WEBHOOK_SECRET` (falls back to `STRIPE_WEBHOOK_SECRET` if unset)
- `NEXT_PUBLIC_APP_URL`

## API endpoints

- `POST /api/billing/checkout`
  - Input: `userId`, optional `email`, optional `priceId`, optional redirect URLs.
  - Creates Stripe Checkout Session in `subscription` mode.
  - Stores `userId` in Checkout + Subscription metadata.

- `POST /api/billing/portal`
  - Input: `userId`, optional `returnUrl`.
  - Opens Stripe customer portal for an existing billing profile.

- `POST /api/billing/webhook`
  - Handles:
    - `checkout.session.completed` (subscription mode)
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
  - Synchronizes subscription state into `billing_subscriptions`.

- `GET /api/billing/status?userId=<id>`
  - Returns normalized subscription state + active entitlement flag.

- `GET /api/member/content` (protected example route)
  - Requires `x-user-id` header.
  - Returns `402` when no active/trialing subscription exists.

## Data model

`billing_subscriptions` keeps one row per app user and Stripe subscription mapping:

- `user_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `status`
- `current_period_end`
- `cancel_at_period_end`
- `stripe_price_id`
- event tracking fields

## Status to entitlement mapping

Entitlement is granted for:

- `active`
- `trialing`

Entitlement is denied for:

- `incomplete`
- `incomplete_expired`
- `past_due`
- `canceled`
- `unpaid`

## Notes

- Billing and self-serve ad payments are intentionally separate flows.
- Webhook processing is idempotent by persisted subscription identifiers and state upserts.
