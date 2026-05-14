-- ============================================================================
-- Códex Veritas — Correção da reavaliação em massa (Sprint 4 / review)
-- ============================================================================
-- A versão anterior de fn_avaliar_cartas_todos só varria usuários presentes em
-- user_content_progress / user_gamification. Mas as condições do motor leem de
-- mais tabelas — então um `reevaluate-all` após publicar/editar uma carta
-- pulava quem qualifica via:
--   contador              → user_carta_progresso
--   quiz_gabaritado       → user_quiz_attempts
--   nota_contem_frase     → user_study_notes
--   grupo_estudo_tamanho  → study_group_members
--
-- Agora o conjunto de usuários é a união exata de todas as fontes que o motor
-- consulta — nada de desbloqueio retroativo perdido.
-- ============================================================================

create or replace function public.fn_avaliar_cartas_todos()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_count int := 0;
begin
  for v_user_id in
    select user_id from public.user_content_progress
    union
    select user_id from public.user_gamification
    union
    select user_id from public.user_quiz_attempts
    union
    select user_id from public.user_carta_progresso
    union
    select user_id from public.user_study_notes
    union
    select user_id from public.study_group_members
  loop
    perform public.fn_avaliar_cartas(v_user_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end; $$;

revoke all on function public.fn_avaliar_cartas_todos() from public, anon, authenticated;
grant execute on function public.fn_avaliar_cartas_todos() to service_role;
