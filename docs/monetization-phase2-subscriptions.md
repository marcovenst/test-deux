# Phase 2: Subscription Monetization Scope

This document defines a separate implementation slice for paid subscriptions.
It is intentionally decoupled from the self-serve ad checkout flow.

## Goal

Add recurring billing for member features with Stripe Billing, while keeping the current self-serve ad payments unchanged.

## Deliverables

1. Subscription checkout endpoint
   - Add `POST /api/billing/checkout` with Stripe Checkout `mode: "subscription"`.
   - Persist app user identifier in Stripe metadata.

2. Billing portal endpoint
   - Add `POST /api/billing/portal` that returns a Stripe customer portal session URL.

3. Subscription persistence model
   - New table for billing state (example columns: `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`).
   - Unique constraints on Stripe IDs.

4. Subscription webhook handling
   - Add `POST /api/billing/webhook`.
   - Handle at least:
     - `checkout.session.completed` (subscription mode)
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Make handlers idempotent by event semantics and persisted state transitions.

5. Entitlement gating
   - Add a single app-level billing status resolver.
   - Gate member features/routes off persisted subscription status (not client-only flags).

6. Tests + operations
   - Route tests for checkout/portal/webhook.
   - Domain tests for subscription state transitions.
   - Runbook section for live verification and failure recovery.

## Non-goals

- Replacing or migrating the self-serve ad checkout flow.
- Multi-provider billing support.
- One-off migration of historical non-subscription subscriber records.

## Suggested rollout

1. Ship schema + read-only billing status endpoint.
2. Ship checkout and webhook writes behind a feature flag.
3. Enable entitlement gating for a small beta cohort.
4. Roll out portal access and full user migration.
