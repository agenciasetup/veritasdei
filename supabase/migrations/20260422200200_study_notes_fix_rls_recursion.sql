-- ============================================================================
-- Fix RLS recursion em study_group_members / study_groups / user_study_notes
-- ============================================================================
-- A policy "SELECT só pra membros" na própria tabela study_group_members
-- entra em loop: ao verificar se o usuário pode ver uma linha, a policy
-- roda EXISTS (SELECT from study_group_members) — que reaplica a policy.
-- Mesmo padrão afeta study_groups (EXISTS em members) e user_study_notes.
-- Solução: funções SECURITY DEFINER que ignoram RLS para checar membership
-- (padrão já usado no projeto — vide rosary_rooms_rls_recursion).
-- ============================================================================

create or replace function public.is_study_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.study_group_members
     where group_id = p_group_id
       and user_id = auth.uid()
  );
$$;

revoke all on function public.is_study_group_member(uuid) from public;
grant execute on function public.is_study_group_member(uuid) to authenticated;

create or replace function public.is_study_group_owner(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.study_group_members
     where group_id = p_group_id
       and user_id = auth.uid()
       and role = 'owner'
  );
$$;

revoke all on function public.is_study_group_owner(uuid) from public;
grant execute on function public.is_study_group_owner(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Recria policies usando as funções helper
-- ----------------------------------------------------------------------------

-- study_group_members: self OR membro do mesmo grupo.
drop policy if exists "study_group_members_select_visible" on public.study_group_members;
create policy "study_group_members_select_visible"
  on public.study_group_members for select
  using (
    user_id = auth.uid()
    or public.is_study_group_member(group_id)
  );

-- study_groups: SELECT para membros; UPDATE/DELETE para owner.
drop policy if exists "study_groups_select_member_or_with_code" on public.study_groups;
drop policy if exists "study_groups_select_member" on public.study_groups;
create policy "study_groups_select_member"
  on public.study_groups for select
  using (public.is_study_group_member(id));

drop policy if exists "study_groups_update_owner" on public.study_groups;
create policy "study_groups_update_owner"
  on public.study_groups for update
  using (public.is_study_group_owner(id))
  with check (public.is_study_group_owner(id));

drop policy if exists "study_groups_delete_owner" on public.study_groups;
create policy "study_groups_delete_owner"
  on public.study_groups for delete
  using (public.is_study_group_owner(id));

-- ----------------------------------------------------------------------------
-- user_study_notes: substitui EXISTS por função helper
-- ----------------------------------------------------------------------------
drop policy if exists "user_study_notes_select_visible" on public.user_study_notes;
create policy "user_study_notes_select_visible"
  on public.user_study_notes for select
  using (
    user_id = auth.uid()
    or visibility = 'public'
    or (
      visibility = 'group'
      and group_id is not null
      and public.is_study_group_member(group_id)
    )
  );

drop policy if exists "user_study_notes_insert_self" on public.user_study_notes;
create policy "user_study_notes_insert_self"
  on public.user_study_notes for insert
  with check (
    user_id = auth.uid()
    and (
      visibility <> 'group'
      or (group_id is not null and public.is_study_group_member(group_id))
    )
  );

drop policy if exists "user_study_notes_update_author" on public.user_study_notes;
create policy "user_study_notes_update_author"
  on public.user_study_notes for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      visibility <> 'group'
      or (group_id is not null and public.is_study_group_member(group_id))
    )
  );

drop policy if exists "user_study_notes_delete_author" on public.user_study_notes;
create policy "user_study_notes_delete_author"
  on public.user_study_notes for delete
  using (user_id = auth.uid());
