-- Curated community events (Pwogram semèn nan): concerts, heritage, tickets from Eventbrite, etc.

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location_label text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  external_url text not null,
  source text not null
    check (source in ('eventbrite', 'ticketmaster', 'konpa_events', 'randevou_a', 'other')),
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_events_external_url_check check (external_url ~ '^https?://')
);

create index if not exists idx_community_events_public_list
  on public.community_events (active, starts_at)
  where active = true;

alter table public.community_events enable row level security;

create policy "community_events_select_active"
  on public.community_events
  for select
  to anon, authenticated
  using (active = true);
