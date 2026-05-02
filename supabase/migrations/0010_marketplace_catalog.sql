-- Curated catalog (platform / affiliate / dropship-style offers) for Achte browse

create table if not exists public.marketplace_catalog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price_cents int not null check (price_cents > 0),
  shipping_cents int not null check (shipping_cents >= 0),
  currency text not null default 'usd',
  image_urls text[] not null default '{}'::text[],
  purchase_mode text not null check (purchase_mode in ('on_platform', 'external_affiliate')),
  external_url text,
  affiliate_note text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_catalog_external_url_when_affiliate check (
    purchase_mode <> 'external_affiliate' or (external_url is not null and trim(external_url) <> '')
  )
);

create index if not exists idx_marketplace_catalog_active_sort
  on public.marketplace_catalog_items (active, sort_order desc, created_at desc);

alter table public.marketplace_catalog_items enable row level security;

create policy "marketplace_catalog_select_active"
  on public.marketplace_catalog_items
  for select
  to anon, authenticated
  using (active = true);

-- Orders: either a peer listing OR a catalog item (platform-curated checkout / fulfillment)
alter table public.marketplace_orders alter column listing_id drop not null;

alter table public.marketplace_orders
  add column if not exists catalog_item_id uuid references public.marketplace_catalog_items (id) on delete restrict;

create index if not exists idx_marketplace_orders_catalog_item
  on public.marketplace_orders (catalog_item_id)
  where catalog_item_id is not null;

alter table public.marketplace_orders
  drop constraint if exists marketplace_orders_source_listing_or_catalog;

alter table public.marketplace_orders
  add constraint marketplace_orders_source_listing_or_catalog check (
    (
      listing_id is not null
      and catalog_item_id is null
    )
    or (
      listing_id is null
      and catalog_item_id is not null
    )
  );

-- On-platform: checkout via existing Stripe flow; revenue in your Stripe balance (you fulfill / dropship ops).
-- external_affiliate: shopper leaves the site; commissions are paid by affiliate networks, not through Stripe.
