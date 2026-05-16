-- Os helpers `_rosary_resolve_display_name` e `_rosary_resolve_avatar_url`
-- são auxiliares internos chamados apenas por trigger/RPC já SECURITY
-- DEFINER (rosary_rooms_host_as_participant, join_rosary_room).
--
-- Por padrão PostgreSQL concede EXECUTE pra PUBLIC em funções novas, o que
-- expôs essas funções via `/rest/v1/rpc/_rosary_resolve_*` — qualquer
-- usuário anon/authenticated podia consultar display_name + avatar_url
-- de qualquer user_id arbitrário, leak de privacidade.
--
-- Revogamos EXECUTE de todas as roles públicas. Os callers internos (que
-- também são SECURITY DEFINER) seguem funcionando porque rodam com o
-- privilégio do owner (postgres).

REVOKE EXECUTE ON FUNCTION public._rosary_resolve_display_name(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._rosary_resolve_avatar_url(uuid)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rosary_rooms_host_as_participant() FROM PUBLIC, anon, authenticated;
