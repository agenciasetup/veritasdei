-- ============================================================================
-- Códex Veritas — Backfill (Sprint 1)
-- ============================================================================
-- Quando o sistema de cartas entra no ar, usuários que já cumpriram as regras
-- (estudaram os subtópicos, atingiram nível/streak…) antes do sistema existir
-- precisam receber suas cartas. Os triggers só disparam em eventos NOVOS, então
-- este backfill avalia todo mundo uma vez. Idempotente — fn_avaliar_cartas
-- ignora o que já está desbloqueado.
-- ============================================================================

do $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select distinct user_id from public.user_content_progress
    union
    select user_id from public.user_gamification
  loop
    perform public.fn_avaliar_cartas(v_user_id);
  end loop;
end $$;
