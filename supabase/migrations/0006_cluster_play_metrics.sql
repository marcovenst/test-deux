create table if not exists public.cluster_play_metrics (
  cluster_id uuid primary key references public.clusters(id) on delete cascade,
  total_plays bigint not null default 0,
  total_play_seconds double precision not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_cluster_play_metrics_total_plays
  on public.cluster_play_metrics (total_plays desc);

create or replace function public.increment_cluster_play_metrics(
  p_cluster_id uuid,
  p_plays int default 1,
  p_play_seconds double precision default 0
)
returns table (
  total_plays bigint,
  total_play_seconds double precision,
  average_play_seconds double precision
)
language plpgsql
as $$
begin
  insert into public.cluster_play_metrics (cluster_id, total_plays, total_play_seconds, updated_at)
  values (p_cluster_id, greatest(p_plays, 0), greatest(p_play_seconds, 0), now())
  on conflict (cluster_id)
  do update set
    total_plays = public.cluster_play_metrics.total_plays + greatest(p_plays, 0),
    total_play_seconds = public.cluster_play_metrics.total_play_seconds + greatest(p_play_seconds, 0),
    updated_at = now();

  return query
    select
      m.total_plays,
      m.total_play_seconds,
      case
        when m.total_plays > 0
          then m.total_play_seconds / m.total_plays
        else 0
      end as average_play_seconds
    from public.cluster_play_metrics m
    where m.cluster_id = p_cluster_id;
end;
$$;
