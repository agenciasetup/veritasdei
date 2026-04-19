-- ============================================================================
-- Gamificação — Triggers e funções de recálculo
-- ============================================================================
-- Sempre que user_content_progress muda (insert/delete):
--   1. Recalcula total_xp, current_level
--   2. Recalcula streak (dias consecutivos em America/Sao_Paulo)
--   3. Desbloqueia relíquias cujos thresholds foram atingidos
--   4. Avança missão diária 'study_subtopic' se houver
-- ============================================================================

-- ----------------------------------------------------------------------------
-- fn_recalc_streak: recalcula current_streak e longest_streak a partir
-- dos dias únicos estudados (em horário local de Brasília).
-- ----------------------------------------------------------------------------
create or replace function public.fn_recalc_streak(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_current int := 0;
  v_longest int := 0;
  v_temp int := 0;
  v_last_day date;
  v_rec record;
  v_expected date;
begin
  -- Streak atual: começa de hoje (ou de ontem se não estudou hoje) e vai recuando
  -- enquanto encontrar dias consecutivos.
  v_expected := v_today;

  -- Verifica se estudou hoje
  perform 1 from public.user_content_progress
    where user_id = p_user_id
      and (studied_at at time zone 'America/Sao_Paulo')::date = v_today
    limit 1;
  if not found then
    v_expected := v_today - 1;
  end if;

  for v_rec in
    select distinct (studied_at at time zone 'America/Sao_Paulo')::date as d
    from public.user_content_progress
    where user_id = p_user_id
      and (studied_at at time zone 'America/Sao_Paulo')::date <= v_expected
    order by d desc
  loop
    if v_rec.d = v_expected then
      v_current := v_current + 1;
      v_expected := v_expected - 1;
    else
      exit;
    end if;
  end loop;

  -- Longest streak: varre todos os dias únicos e calcula maior sequência
  for v_rec in
    select distinct (studied_at at time zone 'America/Sao_Paulo')::date as d
    from public.user_content_progress
    where user_id = p_user_id
    order by d asc
  loop
    if v_last_day is null or v_rec.d = v_last_day + 1 then
      v_temp := v_temp + 1;
    else
      v_temp := 1;
    end if;
    if v_temp > v_longest then
      v_longest := v_temp;
    end if;
    v_last_day := v_rec.d;
  end loop;

  update public.user_gamification
    set current_streak = v_current,
        longest_streak = greatest(longest_streak, v_longest),
        updated_at = now()
    where user_id = p_user_id;
end; $$;

-- ----------------------------------------------------------------------------
-- fn_unlock_reliquias: insere em user_reliquias as relíquias cujos
-- thresholds foram atingidos mas ainda não estão desbloqueadas.
-- ----------------------------------------------------------------------------
create or replace function public.fn_unlock_reliquias(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gami record;
  v_rec record;
  v_achievements_unlocked int;
  v_pillars_complete int;
begin
  select total_xp, current_level, current_streak, longest_streak
    into v_gami
    from public.user_gamification
    where user_id = p_user_id;

  if not found then return; end if;

  -- Conta conquistas desbloqueadas (tiers iniciante/metade/mestre por pilar)
  -- Uma conquista "iniciante" requer >= 1 subtópico estudado no grupo,
  -- "metade" requer >= ceil(total/2), "mestre" requer == total.
  with per_group as (
    select
      g.id as group_id,
      g.slug as group_slug,
      count(distinct s.id) as total_subs,
      count(distinct p.subtopic_id) filter (where p.user_id = p_user_id) as studied_subs
    from public.content_groups g
    join public.content_topics t on t.group_id = g.id
    join public.content_subtopics s on s.topic_id = t.id
    left join public.user_content_progress p on p.subtopic_id = s.id
    where g.visible = true
    group by g.id, g.slug
  ),
  counts as (
    select
      count(*) filter (where studied_subs >= 1) as inic,
      count(*) filter (where studied_subs >= ceil(total_subs::numeric / 2)) as meio,
      count(*) filter (where studied_subs = total_subs and total_subs > 0) as mestre
    from per_group
    where total_subs > 0
  )
  select (inic + meio + mestre) into v_achievements_unlocked from counts;

  select count(*) into v_pillars_complete
    from (
      select
        g.id,
        count(distinct s.id) as total_subs,
        count(distinct p.subtopic_id) filter (where p.user_id = p_user_id) as studied_subs
      from public.content_groups g
      join public.content_topics t on t.group_id = g.id
      join public.content_subtopics s on s.topic_id = t.id
      left join public.user_content_progress p on p.subtopic_id = s.id
      where g.visible = true
      group by g.id
    ) x
    where total_subs > 0 and studied_subs = total_subs;

  -- Avalia cada relíquia visível
  for v_rec in
    select id, slug, unlock_type, unlock_value, unlock_ref
    from public.reliquias
    where visible = true
  loop
    -- Pula se já desbloqueada
    if exists (
      select 1 from public.user_reliquias
      where user_id = p_user_id and reliquia_id = v_rec.id
    ) then
      continue;
    end if;

    case v_rec.unlock_type
      when 'level' then
        if v_gami.current_level >= coalesce(v_rec.unlock_value, 999) then
          insert into public.user_reliquias (user_id, reliquia_id)
          values (p_user_id, v_rec.id)
          on conflict do nothing;
        end if;

      when 'streak' then
        if v_gami.longest_streak >= coalesce(v_rec.unlock_value, 999)
           or v_gami.current_streak >= coalesce(v_rec.unlock_value, 999) then
          insert into public.user_reliquias (user_id, reliquia_id)
          values (p_user_id, v_rec.id)
          on conflict do nothing;
        end if;

      when 'achievement_count' then
        if v_achievements_unlocked >= coalesce(v_rec.unlock_value, 999) then
          insert into public.user_reliquias (user_id, reliquia_id)
          values (p_user_id, v_rec.id)
          on conflict do nothing;
        end if;

      when 'pillar_complete' then
        if v_rec.unlock_ref is not null and exists (
          select 1
          from public.content_groups g
          join public.content_topics t on t.group_id = g.id
          join public.content_subtopics s on s.topic_id = t.id
          left join public.user_content_progress p
            on p.subtopic_id = s.id and p.user_id = p_user_id
          where g.slug = v_rec.unlock_ref and g.visible = true
          group by g.id
          having count(distinct s.id) > 0
             and count(distinct s.id) = count(distinct p.subtopic_id)
        ) then
          insert into public.user_reliquias (user_id, reliquia_id)
          values (p_user_id, v_rec.id)
          on conflict do nothing;
        end if;

      when 'custom' then
        -- 'all_pillars_complete' — todos os pilares visíveis concluídos
        if v_rec.unlock_ref = 'all_pillars_complete'
           and v_pillars_complete >= (
             select count(*) from public.content_groups where visible = true
           )
           and v_pillars_complete > 0 then
          insert into public.user_reliquias (user_id, reliquia_id)
          values (p_user_id, v_rec.id)
          on conflict do nothing;
        end if;

      else null;
    end case;
  end loop;
end; $$;

-- ----------------------------------------------------------------------------
-- fn_recalc_gamification: orquestra todo o recálculo
-- ----------------------------------------------------------------------------
create or replace function public.fn_recalc_gamification(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total_studied int;
  v_total_xp int;
  v_level int;
begin
  select count(*) into v_total_studied
  from public.user_content_progress
  where user_id = p_user_id;

  v_total_xp := v_total_studied * 10;
  v_level := floor(v_total_xp / 100.0)::int + 1;

  insert into public.user_gamification (user_id, total_xp, current_level, last_study_at, updated_at)
  values (p_user_id, v_total_xp, v_level, now(), now())
  on conflict (user_id) do update
    set total_xp = excluded.total_xp,
        current_level = excluded.current_level,
        last_study_at = now(),
        updated_at = now();

  perform public.fn_recalc_streak(p_user_id);
  perform public.fn_unlock_reliquias(p_user_id);
end; $$;

-- ----------------------------------------------------------------------------
-- fn_advance_daily_mission: incrementa progresso da missão do dia
-- ----------------------------------------------------------------------------
create or replace function public.fn_advance_daily_mission(
  p_user_id uuid,
  p_mission_type text,
  p_increment int default 1
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  update public.daily_missions
    set progress = least(target, progress + p_increment),
        completed = (progress + p_increment) >= target
    where user_id = p_user_id
      and mission_date = v_today
      and mission_type = p_mission_type;
end; $$;

-- ----------------------------------------------------------------------------
-- Trigger: recalcula tudo após insert em user_content_progress
-- ----------------------------------------------------------------------------
create or replace function public.trg_gamification_after_progress()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_recalc_gamification(new.user_id);
  perform public.fn_advance_daily_mission(new.user_id, 'study_subtopic', 1);
  return new;
end; $$;

drop trigger if exists trg_gami_after_progress on public.user_content_progress;
create trigger trg_gami_after_progress
  after insert on public.user_content_progress
  for each row execute function public.trg_gamification_after_progress();

-- Trigger de delete: recalcula quando usuário "desmarca" (raro mas possível)
create or replace function public.trg_gamification_after_progress_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_recalc_gamification(old.user_id);
  return old;
end; $$;

drop trigger if exists trg_gami_after_progress_delete on public.user_content_progress;
create trigger trg_gami_after_progress_delete
  after delete on public.user_content_progress
  for each row execute function public.trg_gamification_after_progress_delete();

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------
grant execute on function public.fn_recalc_gamification(uuid) to authenticated, service_role;
grant execute on function public.fn_recalc_streak(uuid) to authenticated, service_role;
grant execute on function public.fn_unlock_reliquias(uuid) to authenticated, service_role;
grant execute on function public.fn_advance_daily_mission(uuid, text, int) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Backfill: recalcula gamificação pra todos os usuários que já têm progresso
-- (ou já têm linha em user_gamification). Executa em lote, não bloqueia.
-- ----------------------------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct user_id from public.user_content_progress
  loop
    perform public.fn_recalc_gamification(v_user_id);
  end loop;
end $$;
