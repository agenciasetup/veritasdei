-- ============================================================================
-- Sprint 1.1 — Study Foundation
-- ============================================================================
-- Tabelas base do refactor de Estudos (feat/estudos-v2):
--   * user_study_notes        — anotações privadas do usuário por conteúdo
--   * content_deepdive        — conteúdo aprofundado (IA gera, admin revisa)
--   * study_quizzes           — quiz (bônus opcional) por conteúdo
--   * study_quiz_questions    — questões do quiz
--   * user_quiz_attempts      — tentativas do usuário (score, respostas)
--
-- Convenção `content_ref`:
--   Slug hierárquico identificando o conteúdo alvo. Funciona tanto para dados
--   dinâmicos (UUID do content_subtopic) quanto para dados estáticos
--   ('dogmas/trindade', 'catecismo-pio-x/secao-1/pergunta-4').
--   Não é FK porque o catálogo de estudos é híbrido (Supabase + estático).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. user_study_notes — anotações privadas (texto livre por conteúdo)
-- ----------------------------------------------------------------------------
create table if not exists public.user_study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null,
  content_ref text not null,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_study_notes_user_updated_idx
  on public.user_study_notes (user_id, updated_at desc);

create index if not exists user_study_notes_lookup_idx
  on public.user_study_notes (user_id, content_type, content_ref);


-- ----------------------------------------------------------------------------
-- 2. content_deepdive — conteúdo aprofundado (draft → review → published)
-- ----------------------------------------------------------------------------
-- `sections` jsonb: [{ slug, title, body, order }]
--   Seções sugeridas: contexto_historico, padres_da_igreja, magisterio,
--   aplicacao, referencias. O shape é validado na aplicação.
-- `sources` jsonb: [{ kind, label, url, page }]
--   kind: 'scripture' | 'catechism' | 'council' | 'papal' | 'father' | 'other'
-- ----------------------------------------------------------------------------
create table if not exists public.content_deepdive (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_ref text not null,
  sections jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_ref)
);

create index if not exists content_deepdive_status_idx
  on public.content_deepdive (status, content_type);

create index if not exists content_deepdive_lookup_idx
  on public.content_deepdive (content_type, content_ref);


-- ----------------------------------------------------------------------------
-- 3. study_quizzes — 1 quiz por conteúdo, opcional, bônus de XP/relíquia
-- ----------------------------------------------------------------------------
create table if not exists public.study_quizzes (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_ref text not null,
  title text not null,
  description text,
  passing_score int not null default 70 check (passing_score between 0 and 100),
  xp_bonus int not null default 20 check (xp_bonus >= 0),
  reliquia_slug_on_master text, -- slug de public.reliquias a desbloquear ao gabaritar (100%)
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_ref)
);

create index if not exists study_quizzes_status_idx
  on public.study_quizzes (status, content_type);


-- ----------------------------------------------------------------------------
-- 4. study_quiz_questions — questões (múltipla única / múltipla / V-F)
-- ----------------------------------------------------------------------------
-- `options` jsonb: [{ id, label }] — ids curtos ('a','b','c','d' ou 'v','f')
-- `correct` jsonb: ids corretos. Array pra suportar multi-select.
-- ----------------------------------------------------------------------------
create table if not exists public.study_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.study_quizzes(id) on delete cascade,
  kind text not null check (kind in ('single','multi','truefalse')),
  prompt text not null,
  options jsonb not null,
  correct jsonb not null,
  explanation text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists study_quiz_questions_quiz_order_idx
  on public.study_quiz_questions (quiz_id, sort_order);


-- ----------------------------------------------------------------------------
-- 5. user_quiz_attempts — tentativas (histórico, melhor score, resposta)
-- ----------------------------------------------------------------------------
-- `answers` jsonb: { [question_id]: selected_ids[] }
-- Usuário pode tentar várias vezes; a aplicação decide se usa "melhor score"
-- ou "último score" pra gamificação.
-- ----------------------------------------------------------------------------
create table if not exists public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.study_quizzes(id) on delete cascade,
  score int not null check (score between 0 and 100),
  answers jsonb not null default '{}'::jsonb,
  passed boolean not null default false,
  completed_at timestamptz not null default now()
);

create index if not exists user_quiz_attempts_user_quiz_idx
  on public.user_quiz_attempts (user_id, quiz_id, completed_at desc);

create index if not exists user_quiz_attempts_user_score_idx
  on public.user_quiz_attempts (user_id, score desc);


-- ============================================================================
-- Triggers: atualizar updated_at
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tg_user_study_notes_touch on public.user_study_notes;
create trigger tg_user_study_notes_touch
  before update on public.user_study_notes
  for each row execute function public.touch_updated_at();

drop trigger if exists tg_content_deepdive_touch on public.content_deepdive;
create trigger tg_content_deepdive_touch
  before update on public.content_deepdive
  for each row execute function public.touch_updated_at();

drop trigger if exists tg_study_quizzes_touch on public.study_quizzes;
create trigger tg_study_quizzes_touch
  before update on public.study_quizzes
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- RLS
-- ============================================================================
alter table public.user_study_notes enable row level security;
alter table public.content_deepdive enable row level security;
alter table public.study_quizzes enable row level security;
alter table public.study_quiz_questions enable row level security;
alter table public.user_quiz_attempts enable row level security;


-- user_study_notes: privado do dono
drop policy if exists "user_study_notes_self_select" on public.user_study_notes;
create policy "user_study_notes_self_select"
  on public.user_study_notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_study_notes_self_insert" on public.user_study_notes;
create policy "user_study_notes_self_insert"
  on public.user_study_notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_study_notes_self_update" on public.user_study_notes;
create policy "user_study_notes_self_update"
  on public.user_study_notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_study_notes_self_delete" on public.user_study_notes;
create policy "user_study_notes_self_delete"
  on public.user_study_notes for delete
  to authenticated
  using (auth.uid() = user_id);


-- content_deepdive: leitura pública quando publicado; admin faz tudo
drop policy if exists "content_deepdive_public_read_published" on public.content_deepdive;
create policy "content_deepdive_public_read_published"
  on public.content_deepdive for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "content_deepdive_admin_all" on public.content_deepdive;
create policy "content_deepdive_admin_all"
  on public.content_deepdive for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());


-- study_quizzes: leitura pública quando publicado; admin faz tudo
drop policy if exists "study_quizzes_public_read_published" on public.study_quizzes;
create policy "study_quizzes_public_read_published"
  on public.study_quizzes for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "study_quizzes_admin_all" on public.study_quizzes;
create policy "study_quizzes_admin_all"
  on public.study_quizzes for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());


-- study_quiz_questions: leitura autenticada quando o quiz pai está publicado;
-- admin faz tudo. (Não expor pra anon pra evitar scraping direto das respostas)
drop policy if exists "study_quiz_questions_auth_read" on public.study_quiz_questions;
create policy "study_quiz_questions_auth_read"
  on public.study_quiz_questions for select
  to authenticated
  using (
    exists (
      select 1 from public.study_quizzes q
      where q.id = study_quiz_questions.quiz_id
        and q.status = 'published'
    )
  );

drop policy if exists "study_quiz_questions_admin_all" on public.study_quiz_questions;
create policy "study_quiz_questions_admin_all"
  on public.study_quiz_questions for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());


-- user_quiz_attempts: privado do dono (admin não lê tentativas alheias)
drop policy if exists "user_quiz_attempts_self_select" on public.user_quiz_attempts;
create policy "user_quiz_attempts_self_select"
  on public.user_quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_quiz_attempts_self_insert" on public.user_quiz_attempts;
create policy "user_quiz_attempts_self_insert"
  on public.user_quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Sem UPDATE/DELETE: tentativas são imutáveis (histórico íntegro).
