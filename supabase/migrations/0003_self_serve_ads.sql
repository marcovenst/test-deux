create table if not exists public.self_serve_ad_orders (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_email text not null,
  title text not null,
  image_url text not null,
  target_url text not null,
  description text not null default '',
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'usd',
  status text not null check (status in ('pending_payment', 'paid', 'active', 'cancelled', 'expired')),
  plan_id text not null check (plan_id in ('daily_1', 'bundle_5', 'monthly_30')),
  plan_label text not null,
  duration_days int not null check (duration_days > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_self_serve_ad_orders_checkout_session
  on public.self_serve_ad_orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists idx_self_serve_ad_orders_payment_intent
  on public.self_serve_ad_orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists idx_self_serve_ad_orders_status_ends_at
  on public.self_serve_ad_orders (status, ends_at);

create index if not exists idx_self_serve_ad_orders_created_at
  on public.self_serve_ad_orders (created_at desc);
