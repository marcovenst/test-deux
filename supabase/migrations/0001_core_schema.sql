create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.platform_type as enum ('news', 'reddit', 'youtube', 'twitter', 'web');
create type public.sentiment_type as enum ('positive', 'neutral', 'negative');

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  platform public.platform_type not null,
  base_url text,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raw_posts (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  title text not null,
  content text not null default '',
  snippet text,
  source_name text not null,
  source_url text not null,
  canonical_url text,
  canonical_url_hash text,
  content_fingerprint text not null,
  platform public.platform_type not null,
  published_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  language text not null default 'en',
  engagement jsonb not null default '{"likes":0,"shares":0,"comments":0,"views":0}'::jsonb,
  raw_metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  is_deleted boolean not null default false
);

create table if not exists public.clusters (
  id uuid primary key default gen_random_uuid(),
  title text,
  trend_category text,
  status text not null default 'active',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  representative_post_id uuid references public.raw_posts(id) on delete set null,
  centroid_embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cluster_items (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.clusters(id) on delete cascade,
  raw_post_id uuid not null references public.raw_posts(id) on delete cascade,
  similarity_score double precision not null default 0,
  created_at timestamptz not null default now(),
  unique(cluster_id, raw_post_id)
);

create table if not exists public.trend_scores (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.clusters(id) on delete cascade,
  timeframe text not null check (timeframe in ('daily', 'weekly')),
  trend_score double precision not null,
  frequency_score double precision not null default 0,
  engagement_score double precision not null default 0,
  recency_score double precision not null default 0,
  overlap_bonus double precision not null default 0,
  computed_at timestamptz not null default now(),
  unique(cluster_id, timeframe, computed_at)
);

create table if not exists public.cluster_summaries (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.clusters(id) on delete cascade,
  cluster_title text not null,
  summary text not null,
  key_points jsonb not null default '[]'::jsonb,
  trend_reason text not null,
  sentiment public.sentiment_type not null default 'neutral',
  tags jsonb not null default '[]'::jsonb,
  llm_model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  unique(cluster_id)
);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_platform public.platform_type not null,
  status text not null check (status in ('started', 'succeeded', 'failed')),
  items_seen int not null default 0,
  items_written int not null default 0,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.source_health (
  id uuid primary key default gen_random_uuid(),
  source_name text not null unique,
  source_platform public.platform_type not null,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  consecutive_failures int not null default 0,
  avg_latency_ms int,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_raw_posts_published_at on public.raw_posts (published_at desc);
create index if not exists idx_raw_posts_ingested_at on public.raw_posts (ingested_at desc);
create index if not exists idx_raw_posts_platform on public.raw_posts (platform);
create index if not exists idx_raw_posts_source_url on public.raw_posts (source_url);
create index if not exists idx_raw_posts_canonical_hash on public.raw_posts (canonical_url_hash);
create index if not exists idx_raw_posts_fingerprint on public.raw_posts (content_fingerprint);
create unique index if not exists idx_raw_posts_external_per_platform on public.raw_posts (platform, external_id) where external_id is not null;

create index if not exists idx_cluster_items_cluster_id on public.cluster_items (cluster_id);
create index if not exists idx_cluster_items_raw_post_id on public.cluster_items (raw_post_id);
create index if not exists idx_clusters_last_seen on public.clusters (last_seen_at desc);
create index if not exists idx_trend_scores_timeframe_score on public.trend_scores (timeframe, trend_score desc, computed_at desc);

