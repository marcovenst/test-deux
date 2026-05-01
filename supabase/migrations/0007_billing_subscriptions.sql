create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  status text not null check (
    status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
  ),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_price_id text,
  stripe_latest_event_id text,
  stripe_latest_event_created timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_billing_subscriptions_user_id
  on public.billing_subscriptions (user_id);

create unique index if not exists idx_billing_subscriptions_customer_id
  on public.billing_subscriptions (stripe_customer_id);

create unique index if not exists idx_billing_subscriptions_subscription_id
  on public.billing_subscriptions (stripe_subscription_id);

create index if not exists idx_billing_subscriptions_status
  on public.billing_subscriptions (status);
