-- ============================================================================
-- Sprint 1.4 — Integração Quiz ↔ Gamificação
-- ============================================================================
-- Atualiza fn_recalc_gamification para somar xp_bonus dos quizzes em que o
-- usuário passou. Adiciona trigger em user_quiz_attempts que:
--   - chama o recálculo (XP/level/streak/relíquias)
--   - desbloqueia a relíquia "Mestre" do quiz quando score = 100
-- ============================================================================


create or replace function public.fn_recalc_gamification(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_progress_xp int;
  v_quiz_xp int;
  v_total_xp int;
  v_level int;
begin
  select count(*) * 10 into v_progress_xp
  from public.user_content_progress
  where user_id = p_user_id;

  -- Soma xp_bonus de cada quiz distinto em que o usuário tenha ao menos uma
  -- tentativa com passed = true. Bonus é creditado uma única vez por quiz.
  select coalesce(sum(q.xp_bonus), 0) into v_quiz_xp
  from public.study_quizzes q
  where exists (
    select 1
    from public.user_quiz_attempts a
    where a.quiz_id = q.id
      and a.user_id = p_user_id
      and a.passed = true
  );

  v_total_xp := coalesce(v_progress_xp, 0) + coalesce(v_quiz_xp, 0);
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
-- Trigger: ao inserir um attempt, recalcula gamificação e (se score=100)
-- desbloqueia a relíquia "Mestre" do quiz, se definida.
-- ----------------------------------------------------------------------------
create or replace function public.trg_gamification_after_quiz_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_recalc_gamification(new.user_id);

  if new.score = 100 then
    insert into public.user_reliquias (user_id, reliquia_id)
    select new.user_id, r.id
    from public.study_quizzes q
    join public.reliquias r on r.slug = q.reliquia_slug_on_master
    where q.id = new.quiz_id
      and q.reliquia_slug_on_master is not null
    on conflict do nothing;
  end if;

  return new;
end; $$;

drop trigger if exists trg_gami_after_quiz_attempt on public.user_quiz_attempts;
create trigger trg_gami_after_quiz_attempt
  after insert on public.user_quiz_attempts
  for each row execute function public.trg_gamification_after_quiz_attempt();
