-- Equipar skin de terço — RPC SECURITY DEFINER pra contornar
-- recursão na policy `profiles_admin_update_all`, que faz EXISTS na
-- própria tabela `profiles` e quebra qualquer UPDATE feito pelo
-- usuário autenticado via PostgREST.

create or replace function public.fn_set_active_rosary_skin(p_skin_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $func$
declare
  v_user_id uuid := auth.uid();
  v_owns    boolean;
  v_skin    record;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select id, status, visivel into v_skin
  from public.rosary_skins
  where id = p_skin_id;

  if not found or v_skin.status <> 'published' or v_skin.visivel = false then
    raise exception 'skin_unavailable' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.user_rosary_skins
    where user_id = v_user_id and skin_id = p_skin_id
  ) into v_owns;

  if not v_owns then
    raise exception 'skin_not_owned' using errcode = 'P0003';
  end if;

  update public.profiles
  set active_rosary_skin_id = p_skin_id
  where id = v_user_id;

  return p_skin_id;
end; $func$;

revoke all on function public.fn_set_active_rosary_skin(uuid) from public, anon;
grant execute on function public.fn_set_active_rosary_skin(uuid) to authenticated;
