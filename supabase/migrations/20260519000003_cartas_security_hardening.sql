-- ============================================================================
-- Códex Veritas — Endurecimento de segurança (Sprint 1)
-- ============================================================================
-- O Postgres concede EXECUTE a PUBLIC por padrão em toda função nova. Como
-- estas são SECURITY DEFINER, isso as torna chamáveis por `anon`/`authenticated`
-- via /rest/v1/rpc — vetor de escalonamento de privilégio.
--
-- Risco crítico: fn_registrar_evento_carta — qualquer usuário poderia forjar
-- contadores ("debates_vencidos", "grupo_tamanho"…) e desbloquear cartas
-- especiais. O único caminho legítimo é o backend (service_role).
--
-- Política: nenhuma dessas funções é chamável pelo cliente. Os triggers
-- continuam funcionando (rodam como dono da tabela). As rotas de API do
-- Next.js usam o client service_role.
-- ============================================================================

begin;

-- Funções de gatilho — nunca chamadas diretamente
revoke all on function public.trg_cartas_after_progress()      from public, anon, authenticated;
revoke all on function public.trg_cartas_after_quiz()          from public, anon, authenticated;
revoke all on function public.trg_cartas_recalc_personagem()   from public, anon, authenticated;

-- Helpers internos e motor — só backend
revoke all on function public.fn_avaliar_condicao_carta(uuid, jsonb)               from public, anon, authenticated;
revoke all on function public.fn_avaliar_cartas(uuid)                              from public, anon, authenticated;
revoke all on function public.fn_recalc_personagem_total(uuid)                     from public, anon, authenticated;
revoke all on function public.fn_registrar_evento_carta(uuid, text, int, text)     from public, anon, authenticated;

-- Garante que service_role mantém acesso (backend / rotas de API)
grant execute on function public.fn_avaliar_cartas(uuid)                           to service_role;
grant execute on function public.fn_avaliar_condicao_carta(uuid, jsonb)            to service_role;
grant execute on function public.fn_recalc_personagem_total(uuid)                  to service_role;
grant execute on function public.fn_registrar_evento_carta(uuid, text, int, text)  to service_role;

commit;
