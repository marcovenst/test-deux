create type public.contact_channel as enum ('email', 'phone');
create type public.notification_status as enum ('queued', 'sent', 'failed');

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  contact_channel public.contact_channel not null,
  notify_realtime boolean not null default true,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscribers_contact_required check (
    (contact_channel = 'email' and email is not null)
    or (contact_channel = 'phone' and phone is not null)
  )
);

create unique index if not exists idx_subscribers_unique_email
  on public.subscribers (lower(email))
  where email is not null;

create unique index if not exists idx_subscribers_unique_phone
  on public.subscribers (phone)
  where phone is not null;

create table if not exists public.subscriber_interests (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  category text not null,
  keyword text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_subscriber_interests_unique
  on public.subscriber_interests (subscriber_id, category, coalesce(keyword, ''));

create index if not exists idx_subscriber_interests_subscriber
  on public.subscriber_interests (subscriber_id);
create index if not exists idx_subscriber_interests_category
  on public.subscriber_interests (category);

create table if not exists public.subscriber_notifications (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  cluster_id uuid references public.clusters(id) on delete set null,
  channel public.contact_channel not null,
  message text not null,
  status public.notification_status not null default 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscriber_notifications_subscriber
  on public.subscriber_notifications (subscriber_id, created_at desc);

