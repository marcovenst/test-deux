create table if not exists public.cluster_reaction_votes (
  cluster_id uuid not null references public.clusters(id) on delete cascade,
  voter_id text not null,
  reaction text not null check (reaction in ('sa_raz', 'sa_komik', 'sa_enteresan')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cluster_id, voter_id)
);

create index if not exists idx_cluster_reaction_votes_cluster_id
  on public.cluster_reaction_votes (cluster_id);

create or replace function public.upsert_cluster_reaction(
  p_cluster_id uuid,
  p_voter_id text,
  p_reaction text
)
returns table (
  sa_raz_count bigint,
  sa_komik_count bigint,
  sa_enteresan_count bigint,
  total_votes bigint,
  selected_reaction text
)
language plpgsql
as $$
begin
  if p_reaction not in ('sa_raz', 'sa_komik', 'sa_enteresan') then
    raise exception 'invalid reaction';
  end if;

  insert into public.cluster_reaction_votes (cluster_id, voter_id, reaction, updated_at)
  values (p_cluster_id, p_voter_id, p_reaction, now())
  on conflict (cluster_id, voter_id)
  do update set
    reaction = excluded.reaction,
    updated_at = now();

  return query
    select
      count(*) filter (where reaction = 'sa_raz') as sa_raz_count,
      count(*) filter (where reaction = 'sa_komik') as sa_komik_count,
      count(*) filter (where reaction = 'sa_enteresan') as sa_enteresan_count,
      count(*) as total_votes,
      p_reaction as selected_reaction
    from public.cluster_reaction_votes
    where cluster_id = p_cluster_id;
end;
$$;
