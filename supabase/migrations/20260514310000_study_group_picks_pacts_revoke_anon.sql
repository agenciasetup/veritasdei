-- Fecha execução por anon/public nas RPCs SECURITY DEFINER de grupo.
-- O CREATE FUNCTION concede EXECUTE a PUBLIC por padrão; revogamos pra
-- que só `authenticated`/`service_role` possam chamar (advisor 0028).

revoke execute on function public.study_group_picks_list(uuid) from anon, public;
revoke execute on function public.study_group_picks_add(uuid, uuid, text) from anon, public;
revoke execute on function public.study_group_picks_remove(uuid, uuid) from anon, public;
revoke execute on function public.study_group_picks_reorder(uuid, uuid[]) from anon, public;
revoke execute on function public.study_group_pact_get(uuid) from anon, public;
revoke execute on function public.study_group_pact_upsert(uuid, integer, text, text) from anon, public;

grant execute on function public.study_group_picks_list(uuid) to authenticated, service_role;
grant execute on function public.study_group_picks_add(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.study_group_picks_remove(uuid, uuid) to authenticated, service_role;
grant execute on function public.study_group_picks_reorder(uuid, uuid[]) to authenticated, service_role;
grant execute on function public.study_group_pact_get(uuid) to authenticated, service_role;
grant execute on function public.study_group_pact_upsert(uuid, integer, text, text) to authenticated, service_role;
