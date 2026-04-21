-- ============================================================================
-- RPC para entrar em grupo via invite_code
-- ============================================================================
-- O SELECT em public.study_groups requer ser membro, então lookup por
-- invite_code falha pro usuário que ainda não entrou. Essa função roda
-- como SECURITY DEFINER para resolver invite_code → group_id, inserir a
-- membership e retornar o grupo. Idempotente: se já é membro, só retorna.
-- ============================================================================

create or replace function public.study_groups_join_by_code(p_code text)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  created_by uuid,
  member_count int,
  created_at timestamptz,
  my_role text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_group public.study_groups%rowtype;
  v_existing_role text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_code is null or length(v_code) < 4 then
    raise exception 'invalid invite code' using errcode = '22023';
  end if;

  select * into v_group from public.study_groups where invite_code = v_code;
  if not found then
    raise exception 'group not found' using errcode = 'P0002';
  end if;

  -- Já é membro? retorna sem inserir.
  select role into v_existing_role
    from public.study_group_members
   where group_id = v_group.id and user_id = v_uid;

  if v_existing_role is null then
    insert into public.study_group_members (group_id, user_id, role)
      values (v_group.id, v_uid, 'member');
    v_existing_role := 'member';
    -- member_count é atualizado via trigger
  end if;

  return query
    select v_group.id,
           v_group.name,
           v_group.description,
           v_group.invite_code,
           v_group.created_by,
           (select public.study_groups.member_count from public.study_groups where public.study_groups.id = v_group.id),
           v_group.created_at,
           v_existing_role;
end;
$$;

revoke all on function public.study_groups_join_by_code(text) from public;
grant execute on function public.study_groups_join_by_code(text) to authenticated;
