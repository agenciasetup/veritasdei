-- ============================================================================
-- Marca-texto (highlights) de estudo: privado / grupo / público
-- ============================================================================
-- Cada marcador aponta para um intervalo `[char_start, char_end)` dentro do
-- `body` de um `content_items` específico. Por que ancorar em item_id e não
-- em offset absoluto da lição:
--   - O `body` é editável pelo admin e a lista de items é reordenável;
--     ancorar em item_id + offset local mantém o marcador estável quando
--     outros items são inseridos/removidos.
--   - A versão renderizada do leitor monta items dinamicamente; offsets em
--     HTML cru não fariam sentido.
--
-- Visibilidade espelha `user_study_notes` (private / group / public), com
-- RLS análoga. Opcionalmente um marcador pode estar vinculado a uma nota
-- (Fase 4 do plano), mas note_id é opcional aqui.
-- ============================================================================

create table if not exists public.user_lesson_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- content_type/content_ref: mesmo padrão das anotações.
  -- content_type ~ slug do pilar; content_ref ~ id do subtopic.
  content_type text not null,
  content_ref text not null,
  item_id uuid not null references public.content_items(id) on delete cascade,
  char_start integer not null check (char_start >= 0),
  char_end integer not null check (char_end > char_start),
  color text not null default 'gold'
    check (color in ('gold', 'wine', 'sage', 'sky', 'plain')),
  visibility text not null default 'private'
    check (visibility in ('private', 'group', 'public')),
  group_id uuid references public.study_groups(id) on delete set null,
  note_id uuid references public.user_study_notes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- group_id é obrigatório quando visibility='group', e null caso contrário.
  constraint user_lesson_highlights_group_requires_id
    check (
      (visibility = 'group' and group_id is not null)
      or (visibility <> 'group' and group_id is null)
    )
);

create index if not exists user_lesson_highlights_lookup_idx
  on public.user_lesson_highlights (content_type, content_ref, item_id);

create index if not exists user_lesson_highlights_owner_idx
  on public.user_lesson_highlights (user_id, created_at desc);

create index if not exists user_lesson_highlights_group_idx
  on public.user_lesson_highlights (group_id, content_type, content_ref)
  where group_id is not null;

create index if not exists user_lesson_highlights_public_idx
  on public.user_lesson_highlights (content_type, content_ref, created_at desc)
  where visibility = 'public';

-- updated_at automático
create or replace function public.user_lesson_highlights_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tg_user_lesson_highlights_touch on public.user_lesson_highlights;
create trigger tg_user_lesson_highlights_touch
  before update on public.user_lesson_highlights
  for each row execute function public.user_lesson_highlights_touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.user_lesson_highlights enable row level security;

-- SELECT: autor OR público OR membro do grupo.
drop policy if exists "user_lesson_highlights_select_visible" on public.user_lesson_highlights;
create policy "user_lesson_highlights_select_visible"
  on public.user_lesson_highlights for select
  using (
    user_id = auth.uid()
    or visibility = 'public'
    or (
      visibility = 'group'
      and group_id is not null
      and exists (
        select 1 from public.study_group_members m
         where m.group_id = user_lesson_highlights.group_id
           and m.user_id = auth.uid()
      )
    )
  );

-- INSERT: user_id = self. Se for grupo, tem que ser membro.
drop policy if exists "user_lesson_highlights_insert_self" on public.user_lesson_highlights;
create policy "user_lesson_highlights_insert_self"
  on public.user_lesson_highlights for insert
  with check (
    user_id = auth.uid()
    and (
      visibility <> 'group'
      or (
        group_id is not null
        and exists (
          select 1 from public.study_group_members m
           where m.group_id = user_lesson_highlights.group_id
             and m.user_id = auth.uid()
        )
      )
    )
  );

-- UPDATE: apenas autor; mesma regra de grupo no with check.
drop policy if exists "user_lesson_highlights_update_author" on public.user_lesson_highlights;
create policy "user_lesson_highlights_update_author"
  on public.user_lesson_highlights for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      visibility <> 'group'
      or (
        group_id is not null
        and exists (
          select 1 from public.study_group_members m
           where m.group_id = user_lesson_highlights.group_id
             and m.user_id = auth.uid()
        )
      )
    )
  );

-- DELETE: apenas autor.
drop policy if exists "user_lesson_highlights_delete_author" on public.user_lesson_highlights;
create policy "user_lesson_highlights_delete_author"
  on public.user_lesson_highlights for delete
  using (user_id = auth.uid());
