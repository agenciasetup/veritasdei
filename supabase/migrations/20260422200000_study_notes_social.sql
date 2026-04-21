-- ============================================================================
-- Anotações de estudo: compartilhamento, grupos e replies
-- ============================================================================
-- Converte `user_study_notes` (hoje privada-por-usuário) em sistema
-- social parcial: cada anotação tem `visibility` (private|group|public)
-- e pode ser compartilhada com um `study_group` ou com a comunidade
-- daquele conteúdo. Replies via `parent_note_id`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. study_groups — grupos de estudo nomeados
-- ----------------------------------------------------------------------------
-- Entram por `invite_code` (6 chars alfanuméricos, visível apenas para quem
-- já tem o código — grupos não aparecem em listagens públicas). Limite
-- simples: qualquer autenticado pode criar grupos.
create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  description text check (description is null or char_length(description) <= 500),
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  member_count int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists study_groups_created_by_idx
  on public.study_groups (created_by, created_at desc);

-- ----------------------------------------------------------------------------
-- 2. study_group_members — membership
-- ----------------------------------------------------------------------------
create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists study_group_members_user_idx
  on public.study_group_members (user_id, joined_at desc);

-- Mantém `member_count` em sync (usado em listagens sem contar linhas).
create or replace function public.study_groups_recount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.study_groups
       set member_count = member_count + 1
     where id = new.group_id;
  elsif tg_op = 'DELETE' then
    update public.study_groups
       set member_count = greatest(0, member_count - 1)
     where id = old.group_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tg_study_groups_recount on public.study_group_members;
create trigger tg_study_groups_recount
  after insert or delete on public.study_group_members
  for each row execute function public.study_groups_recount();

-- Gerador de invite_code — 6 chars upper+digits sem ambiguidades (0/O/I/1).
create or replace function public.study_groups_gen_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. user_study_notes — novas colunas de visibilidade + thread
-- ----------------------------------------------------------------------------
alter table public.user_study_notes
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private','group','public')),
  add column if not exists group_id uuid references public.study_groups(id) on delete set null,
  add column if not exists parent_note_id uuid references public.user_study_notes(id) on delete cascade;

-- Coerência: quando visibility='group' deve ter group_id; quando 'group' não é, group_id é null.
-- Replies herdam visibility do parent em app-layer (evitamos CHECK cross-row).
alter table public.user_study_notes
  drop constraint if exists user_study_notes_group_requires_id;
alter table public.user_study_notes
  add constraint user_study_notes_group_requires_id
  check (
    (visibility = 'group' and group_id is not null)
    or (visibility <> 'group' and group_id is null)
  );

-- Índices para os novos paths de leitura.
create index if not exists user_study_notes_public_feed_idx
  on public.user_study_notes (content_type, content_ref, created_at desc)
  where visibility = 'public' and parent_note_id is null;

create index if not exists user_study_notes_group_feed_idx
  on public.user_study_notes (group_id, content_type, content_ref, created_at desc)
  where visibility = 'group' and parent_note_id is null;

create index if not exists user_study_notes_replies_idx
  on public.user_study_notes (parent_note_id, created_at asc)
  where parent_note_id is not null;

-- ----------------------------------------------------------------------------
-- 4. RLS — grupos e membership
-- ----------------------------------------------------------------------------
alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;

-- study_groups: qualquer autenticado pode criar.
drop policy if exists "study_groups_insert_self" on public.study_groups;
create policy "study_groups_insert_self"
  on public.study_groups for insert
  with check (auth.uid() = created_by);

-- SELECT: membro OR conhece o invite_code (deixamos o cliente passar o code no filtro).
-- Sem API pública de listagem; joins sempre por id ou invite_code.
drop policy if exists "study_groups_select_member_or_with_code" on public.study_groups;
create policy "study_groups_select_member_or_with_code"
  on public.study_groups for select
  using (
    exists (
      select 1 from public.study_group_members m
       where m.group_id = study_groups.id and m.user_id = auth.uid()
    )
  );

-- UPDATE/DELETE: apenas o owner.
drop policy if exists "study_groups_update_owner" on public.study_groups;
create policy "study_groups_update_owner"
  on public.study_groups for update
  using (
    exists (
      select 1 from public.study_group_members m
       where m.group_id = study_groups.id
         and m.user_id = auth.uid()
         and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.study_group_members m
       where m.group_id = study_groups.id
         and m.user_id = auth.uid()
         and m.role = 'owner'
    )
  );

drop policy if exists "study_groups_delete_owner" on public.study_groups;
create policy "study_groups_delete_owner"
  on public.study_groups for delete
  using (
    exists (
      select 1 from public.study_group_members m
       where m.group_id = study_groups.id
         and m.user_id = auth.uid()
         and m.role = 'owner'
    )
  );

-- study_group_members: self pode sair; owner pode remover; todos membros se veem.
drop policy if exists "study_group_members_select_visible" on public.study_group_members;
create policy "study_group_members_select_visible"
  on public.study_group_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.study_group_members m2
       where m2.group_id = study_group_members.group_id
         and m2.user_id = auth.uid()
    )
  );

drop policy if exists "study_group_members_insert_self" on public.study_group_members;
create policy "study_group_members_insert_self"
  on public.study_group_members for insert
  with check (user_id = auth.uid());

drop policy if exists "study_group_members_delete_self_or_owner" on public.study_group_members;
create policy "study_group_members_delete_self_or_owner"
  on public.study_group_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.study_group_members m2
       where m2.group_id = study_group_members.group_id
         and m2.user_id = auth.uid()
         and m2.role = 'owner'
    )
  );

-- ----------------------------------------------------------------------------
-- 5. RLS — user_study_notes (expande policies existentes)
-- ----------------------------------------------------------------------------
-- As policies antigas (..._self_select/insert/update/delete) só protegiam
-- o caso privado. Precisamos substituir por regras que aceitem visibility.

drop policy if exists "user_study_notes_self_select" on public.user_study_notes;
drop policy if exists "user_study_notes_self_insert" on public.user_study_notes;
drop policy if exists "user_study_notes_self_update" on public.user_study_notes;
drop policy if exists "user_study_notes_self_delete" on public.user_study_notes;

-- SELECT: autor (independente de visibility) OR qualquer um se public OR membro do group.
create policy "user_study_notes_select_visible"
  on public.user_study_notes for select
  using (
    user_id = auth.uid()
    or visibility = 'public'
    or (
      visibility = 'group'
      and group_id is not null
      and exists (
        select 1 from public.study_group_members m
         where m.group_id = user_study_notes.group_id
           and m.user_id = auth.uid()
      )
    )
  );

-- INSERT: user_id = auth.uid(). Se for group, tem que ser membro.
create policy "user_study_notes_insert_self"
  on public.user_study_notes for insert
  with check (
    user_id = auth.uid()
    and (
      visibility <> 'group'
      or (
        group_id is not null
        and exists (
          select 1 from public.study_group_members m
           where m.group_id = user_study_notes.group_id
             and m.user_id = auth.uid()
        )
      )
    )
  );

-- UPDATE/DELETE: apenas autor.
create policy "user_study_notes_update_author"
  on public.user_study_notes for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      visibility <> 'group'
      or (
        group_id is not null
        and exists (
          select 1 from public.study_group_members m
           where m.group_id = user_study_notes.group_id
             and m.user_id = auth.uid()
        )
      )
    )
  );

create policy "user_study_notes_delete_author"
  on public.user_study_notes for delete
  using (user_id = auth.uid());
