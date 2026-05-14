-- Grupos de estudo — Trilha curada pelo dono + Pacto da semana.
--
-- 1. study_group_picks: lista ordenada de subtopics que o dono "pinou"
--    como trilha do grupo. Membros enxergam, dono edita.
-- 2. study_group_pacts: meta coletiva semanal definida pelo dono
--    (ex.: "estudar 25 lições nesta semana"). Progresso é computado
--    on-the-fly via RPC, sem coluna mutável.
-- 3. RPCs SECURITY DEFINER pra ler/escrever cruzando RLS de membership.

-- ──────────────────────────────────────────────────────────────────────
-- Tabela: study_group_picks
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.study_group_picks (
  group_id     uuid not null references public.study_groups(id) on delete cascade,
  subtopic_id  uuid not null references public.content_subtopics(id) on delete cascade,
  added_by     uuid not null references auth.users(id) on delete set null,
  note         text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  primary key (group_id, subtopic_id)
);

create index if not exists idx_study_group_picks_group_order
  on public.study_group_picks (group_id, sort_order);

alter table public.study_group_picks enable row level security;

revoke all on public.study_group_picks from anon, authenticated;
grant select, insert, update, delete on public.study_group_picks to authenticated;

drop policy if exists study_group_picks_select_member on public.study_group_picks;
create policy study_group_picks_select_member
  on public.study_group_picks for select
  using (public.is_study_group_member(group_id));

drop policy if exists study_group_picks_modify_owner on public.study_group_picks;
create policy study_group_picks_modify_owner
  on public.study_group_picks for all
  using (public.is_study_group_owner(group_id))
  with check (public.is_study_group_owner(group_id));

-- ──────────────────────────────────────────────────────────────────────
-- Tabela: study_group_pacts
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.study_group_pacts (
  group_id        uuid primary key references public.study_groups(id) on delete cascade,
  goal_subtopics  integer not null default 25 check (goal_subtopics between 1 and 999),
  motto           text,
  scripture       text,
  updated_by      uuid references auth.users(id) on delete set null,
  updated_at      timestamptz not null default now()
);

alter table public.study_group_pacts enable row level security;

revoke all on public.study_group_pacts from anon, authenticated;
grant select, insert, update, delete on public.study_group_pacts to authenticated;

drop policy if exists study_group_pacts_select_member on public.study_group_pacts;
create policy study_group_pacts_select_member
  on public.study_group_pacts for select
  using (public.is_study_group_member(group_id));

drop policy if exists study_group_pacts_modify_owner on public.study_group_pacts;
create policy study_group_pacts_modify_owner
  on public.study_group_pacts for all
  using (public.is_study_group_owner(group_id))
  with check (public.is_study_group_owner(group_id));

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_picks_list — devolve picks com metadata do conteúdo
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_picks_list(p_group_id uuid)
returns table (
  subtopic_id uuid,
  subtopic_slug text,
  title text,
  subtitle text,
  cover_url text,
  topic_id uuid,
  topic_title text,
  topic_slug text,
  pillar_slug text,
  pillar_title text,
  note text,
  sort_order integer,
  added_at timestamptz,
  studied_by_me boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_study_group_member(p_group_id) then
    raise exception 'Not a member of the group';
  end if;

  return query
  select
    p.subtopic_id,
    cs.slug   as subtopic_slug,
    cs.title,
    cs.subtitle,
    cs.cover_url,
    cs.topic_id,
    ct.title  as topic_title,
    ct.slug   as topic_slug,
    cg.slug   as pillar_slug,
    cg.title  as pillar_title,
    p.note,
    p.sort_order,
    p.created_at as added_at,
    exists (
      select 1 from public.user_content_progress ucp
       where ucp.subtopic_id = p.subtopic_id
         and ucp.user_id = auth.uid()
    ) as studied_by_me
  from public.study_group_picks p
  join public.content_subtopics cs on cs.id = p.subtopic_id
  join public.content_topics ct    on ct.id = cs.topic_id
  join public.content_groups cg    on cg.id = ct.group_id
  where p.group_id = p_group_id
  order by p.sort_order asc, p.created_at asc;
end;
$$;

grant execute on function public.study_group_picks_list(uuid)
  to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_picks_add — owner adiciona subtopic na trilha
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_picks_add(
  p_group_id uuid,
  p_subtopic_id uuid,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_next_order integer;
begin
  if not public.is_study_group_owner(p_group_id) then
    raise exception 'Only the group owner can curate the trail';
  end if;

  select coalesce(max(sort_order), -1) + 1 into v_next_order
    from public.study_group_picks
   where group_id = p_group_id;

  insert into public.study_group_picks
    (group_id, subtopic_id, added_by, note, sort_order)
  values
    (p_group_id, p_subtopic_id, auth.uid(), nullif(trim(p_note), ''), v_next_order)
  on conflict (group_id, subtopic_id) do update
    set note = excluded.note;
end;
$$;

grant execute on function public.study_group_picks_add(uuid, uuid, text)
  to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_picks_remove
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_picks_remove(
  p_group_id uuid,
  p_subtopic_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_study_group_owner(p_group_id) then
    raise exception 'Only the group owner can curate the trail';
  end if;

  delete from public.study_group_picks
    where group_id = p_group_id
      and subtopic_id = p_subtopic_id;
end;
$$;

grant execute on function public.study_group_picks_remove(uuid, uuid)
  to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_picks_reorder — reordena trilha
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_picks_reorder(
  p_group_id uuid,
  p_order uuid[]
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  i integer := 0;
  sid uuid;
begin
  if not public.is_study_group_owner(p_group_id) then
    raise exception 'Only the group owner can curate the trail';
  end if;

  foreach sid in array p_order loop
    update public.study_group_picks
      set sort_order = i
      where group_id = p_group_id and subtopic_id = sid;
    i := i + 1;
  end loop;
end;
$$;

grant execute on function public.study_group_picks_reorder(uuid, uuid[])
  to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_pact_get — pacto + progresso semanal coletivo
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_pact_get(p_group_id uuid)
returns table (
  goal_subtopics integer,
  motto text,
  scripture text,
  weekly_subtopics_done bigint,
  active_members bigint,
  week_start timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_week_start timestamptz := date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
begin
  if not public.is_study_group_member(p_group_id) then
    raise exception 'Not a member of the group';
  end if;

  return query
  select
    coalesce(pa.goal_subtopics, 25) as goal_subtopics,
    pa.motto,
    pa.scripture,
    (
      select count(*)::bigint
        from public.study_group_members m
        join public.user_content_progress ucp on ucp.user_id = m.user_id
       where m.group_id = p_group_id
         and ucp.studied_at >= v_week_start
    ) as weekly_subtopics_done,
    (
      select count(distinct m.user_id)::bigint
        from public.study_group_members m
        join public.user_content_progress ucp on ucp.user_id = m.user_id
       where m.group_id = p_group_id
         and ucp.studied_at >= v_week_start
    ) as active_members,
    v_week_start as week_start
  from (select 1) one
  left join public.study_group_pacts pa on pa.group_id = p_group_id;
end;
$$;

grant execute on function public.study_group_pact_get(uuid)
  to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_pact_upsert — dono define meta/lema/escritura
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_pact_upsert(
  p_group_id uuid,
  p_goal_subtopics integer,
  p_motto text default null,
  p_scripture text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_study_group_owner(p_group_id) then
    raise exception 'Only the group owner can set the pact';
  end if;

  if p_goal_subtopics is null or p_goal_subtopics < 1 or p_goal_subtopics > 999 then
    raise exception 'Goal must be between 1 and 999';
  end if;

  insert into public.study_group_pacts
    (group_id, goal_subtopics, motto, scripture, updated_by, updated_at)
  values
    (p_group_id, p_goal_subtopics, nullif(trim(p_motto), ''), nullif(trim(p_scripture), ''), auth.uid(), now())
  on conflict (group_id) do update
    set goal_subtopics = excluded.goal_subtopics,
        motto          = excluded.motto,
        scripture      = excluded.scripture,
        updated_by     = excluded.updated_by,
        updated_at     = now();
end;
$$;

grant execute on function public.study_group_pact_upsert(uuid, integer, text, text)
  to authenticated, service_role;
