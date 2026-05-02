-- Shop La Caille: marketplace listings and buyer orders

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_name text not null,
  seller_email text not null,
  seller_phone text,
  title text not null,
  description text not null default '',
  price_cents int not null check (price_cents > 0),
  shipping_cents int not null check (shipping_cents >= 0),
  currency text not null default 'usd',
  image_urls text[] not null default '{}'::text[],
  status text not null check (status in ('draft', 'pending_posting_payment', 'active', 'paused', 'sold_out')),
  stripe_posting_checkout_session_id text,
  stripe_posting_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_listings_image_urls_nonempty_active check (
    status <> 'active' or cardinality(image_urls) >= 1
  )
);

create unique index if not exists idx_marketplace_listings_posting_session
  on public.marketplace_listings (stripe_posting_checkout_session_id)
  where stripe_posting_checkout_session_id is not null;

create index if not exists idx_marketplace_listings_status_created
  on public.marketplace_listings (status, created_at desc);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings (id) on delete restrict,
  buyer_email text not null,
  quantity int not null default 1 check (quantity = 1),
  item_subtotal_cents int not null check (item_subtotal_cents > 0),
  shipping_cents int not null check (shipping_cents >= 0),
  buyer_total_cents int not null check (buyer_total_cents > 0),
  platform_fee_cents int not null check (platform_fee_cents >= 0),
  currency text not null default 'usd',
  status text not null check (status in ('pending_payment', 'paid', 'cancelled')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_marketplace_orders_checkout_session
  on public.marketplace_orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists idx_marketplace_orders_listing_id
  on public.marketplace_orders (listing_id);

alter table public.marketplace_listings enable row level security;
alter table public.marketplace_orders enable row level security;

create policy "marketplace_listings_select_active"
  on public.marketplace_listings
  for select
  to anon, authenticated
  using (status = 'active');

create policy "marketplace_orders_no_public"
  on public.marketplace_orders
  for select
  to anon, authenticated
  using (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-listings',
  'shop-listings',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "shop_listings_storage_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'shop-listings');
