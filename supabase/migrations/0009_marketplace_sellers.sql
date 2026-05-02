-- Seller accounts, earnings ledger, payout requests (Shop Lakay)

create table if not exists public.marketplace_sellers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  phone text,
  access_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketplace_sellers_access_token
  on public.marketplace_sellers (access_token);

alter table public.marketplace_listings
  add column if not exists seller_id uuid references public.marketplace_sellers (id) on delete set null;

create index if not exists idx_marketplace_listings_seller_id
  on public.marketplace_listings (seller_id);

create table if not exists public.marketplace_payout_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.marketplace_sellers (id) on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  method text not null check (method in ('ach', 'zelle', 'debit_card')),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'paid', 'rejected', 'cancelled')
  ),
  recipient jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketplace_payouts_seller_status
  on public.marketplace_payout_requests (seller_id, status);

create table if not exists public.marketplace_seller_ledger (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.marketplace_sellers (id) on delete restrict,
  entry_type text not null check (entry_type in ('sale_credit', 'payout_debit', 'adjustment')),
  amount_cents int not null check (amount_cents <> 0),
  order_id uuid references public.marketplace_orders (id) on delete set null,
  payout_request_id uuid references public.marketplace_payout_requests (id) on delete set null,
  memo text,
  created_at timestamptz not null default now(),
  constraint marketplace_ledger_sale_amount_positive check (
    entry_type <> 'sale_credit' or amount_cents > 0
  ),
  constraint marketplace_ledger_payout_amount_negative check (
    entry_type <> 'payout_debit' or amount_cents < 0
  )
);

create unique index if not exists marketplace_ledger_one_sale_per_order
  on public.marketplace_seller_ledger (order_id)
  where order_id is not null and entry_type = 'sale_credit';

create index if not exists idx_marketplace_ledger_seller_created
  on public.marketplace_seller_ledger (seller_id, created_at desc);

alter table public.marketplace_sellers enable row level security;
alter table public.marketplace_seller_ledger enable row level security;
alter table public.marketplace_payout_requests enable row level security;
