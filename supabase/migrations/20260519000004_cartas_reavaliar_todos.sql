-- ============================================================================
-- Códex Veritas — Reavaliação em massa (Sprint 2)
-- ============================================================================
-- Quando o admin publica uma carta nova (ou edita a regra de uma carta já
-- publicada), os triggers não disparam para eventos passados. Esta função
-- reavalia todos os usuários de uma vez — chamada pela rota admin após
-- publicar/editar. Service_role apenas.
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
    select distinct user_id from public.user_content_progress
    union
    select user_id from public.user_gamification
  loop
    perform public.fn_avaliar_cartas(v_user_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end; $$;

revoke all on function public.fn_avaliar_cartas_todos() from public, anon, authenticated;
grant execute on function public.fn_avaliar_cartas_todos() to service_role;
