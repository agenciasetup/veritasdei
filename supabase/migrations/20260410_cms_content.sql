-- ═══════════════════════════════════════════════════════════════════
-- CMS: Content Management System
-- Hierarquia: Grupo > Tópico > Sub-tópico > Conteúdo
-- ═══════════════════════════════════════════════════════════════════

-- ─── GRUPOS (ex: Dogmas, Sacramentos, Mandamentos...) ──────────
create table if not exists content_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  icon text,                              -- nome do ícone lucide
  cover_url text,                         -- imagem cover (900x400)
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── TÓPICOS (ex: Dogmas sobre Deus, Dogmas sobre Cristo...) ───
create table if not exists content_topics (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references content_groups(id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  description text,
  icon text,
  cover_url text,                         -- imagem cover (900x400)
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(group_id, slug)
);

-- ─── SUB-TÓPICOS (ex: "A Existência de Deus") ──────────────────
create table if not exists content_subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references content_topics(id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  description text,
  cover_url text,                         -- imagem cover (900x400)
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(topic_id, slug)
);

-- ─── CONTEÚDO (cards dentro do sub-tópico) ──────────────────────
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references content_subtopics(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'verse', 'prayer', 'definition', 'quote', 'image')),
  title text,
  body text not null,                     -- conteúdo principal (max ~2000 chars)
  reference text,                         -- ex: "Jo 3,16" ou "CIC §1030"
  image_url text,                         -- imagem opcional
  metadata jsonb default '{}',            -- dados extras flexíveis
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── PROGRESSO DO USUÁRIO NAS TRILHAS ───────────────────────────
create table if not exists user_trail_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trail_id text not null,
  step_index integer not null,
  completed_at timestamptz default now(),
  unique(user_id, trail_id, step_index)
);

-- ─── CALENDÁRIO LITÚRGICO (santos do dia) ───────────────────────
create table if not exists liturgical_calendar (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month between 1 and 12),
  day integer not null check (day between 1 and 31),
  saint_name text not null,
  saint_title text,                       -- ex: "Doutor da Igreja"
  feast_type text not null default 'memorial' check (feast_type in ('solenidade', 'festa', 'memorial', 'memorial_facultativo', 'feria')),
  liturgical_color text not null default 'verde' check (liturgical_color in ('branco', 'vermelho', 'verde', 'roxo', 'rosa', 'dourado')),
  biography text,                         -- resumo da vida
  prayer text,                            -- oração do dia
  readings text,                          -- leituras do dia
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(month, day, saint_name)
);

-- ─── INDEXES ────────────────────────────────────────────────────
create index if not exists idx_content_topics_group on content_topics(group_id);
create index if not exists idx_content_subtopics_topic on content_subtopics(topic_id);
create index if not exists idx_content_items_subtopic on content_items(subtopic_id);
create index if not exists idx_user_trail_progress_user on user_trail_progress(user_id);
create index if not exists idx_liturgical_calendar_date on liturgical_calendar(month, day);

-- ─── RLS ────────────────────────────────────────────────────────
alter table content_groups enable row level security;
alter table content_topics enable row level security;
alter table content_subtopics enable row level security;
alter table content_items enable row level security;
alter table user_trail_progress enable row level security;
alter table liturgical_calendar enable row level security;

-- Conteúdo público para leitura
create policy "Public read content_groups" on content_groups for select using (true);
create policy "Public read content_topics" on content_topics for select using (true);
create policy "Public read content_subtopics" on content_subtopics for select using (true);
create policy "Public read content_items" on content_items for select using (true);
create policy "Public read liturgical_calendar" on liturgical_calendar for select using (true);

-- Admin pode tudo em conteúdo
create policy "Admin manage content_groups" on content_groups for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin manage content_topics" on content_topics for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin manage content_subtopics" on content_subtopics for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin manage content_items" on content_items for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin manage liturgical_calendar" on liturgical_calendar for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Progresso: cada usuário gerencia o próprio
create policy "Users manage own trail progress" on user_trail_progress for all
  using (auth.uid() = user_id);
