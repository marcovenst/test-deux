create table if not exists public.cluster_views (
  cluster_id uuid primary key references public.clusters(id) on delete cascade,
  total_views bigint not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_cluster_views_total_views on public.cluster_views (total_views desc);

create or replace function public.increment_cluster_view(p_cluster_id uuid)
returns bigint
language plpgsql
as $$
declare
  next_total bigint;
begin
  insert into public.cluster_views (cluster_id, total_views, updated_at)
  values (p_cluster_id, 1, now())
  on conflict (cluster_id)
  do update
    set total_views = public.cluster_views.total_views + 1,
        updated_at = now()
  returning total_views into next_total;

  return next_total;
end;
$$;
