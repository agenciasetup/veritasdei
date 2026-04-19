-- ============================================================================
-- Gamificação — Fundação
-- ============================================================================
-- Cria tabelas para nível/XP desnormalizado, catálogo de relíquias (selos),
-- relíquias desbloqueadas por usuário, e missões diárias.
--
-- XP e nível continuam derivados de user_content_progress (10 XP/subtópico,
-- 100 XP/nível) — a tabela user_gamification armazena o resultado pra
-- performance em listas (perfis públicos, header, etc).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- reliquias: catálogo de selos sacros
-- ----------------------------------------------------------------------------
create table if not exists public.reliquias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  lore text,
  image_url text,
  category text not null check (category in ('estudo','oracao','streak','comunidade','liturgia')),
  rarity text not null check (rarity in ('comum','rara','epica','lendaria')),
  unlock_type text not null check (unlock_type in ('level','pillar_complete','streak','achievement_count','custom')),
  unlock_value int,
  unlock_ref text,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reliquias_visible_order_idx
  on public.reliquias (visible, sort_order);

-- ----------------------------------------------------------------------------
-- user_gamification: estado desnormalizado por usuário
-- ----------------------------------------------------------------------------
create table if not exists public.user_gamification (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp int not null default 0,
  current_level int not null default 1,
  equipped_reliquia_id uuid references public.reliquias(id) on delete set null,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_study_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_gamification_level_idx
  on public.user_gamification (current_level desc, total_xp desc);

-- ----------------------------------------------------------------------------
-- user_reliquias: quais selos cada usuário desbloqueou
-- ----------------------------------------------------------------------------
create table if not exists public.user_reliquias (
  user_id uuid not null references public.profiles(id) on delete cascade,
  reliquia_id uuid not null references public.reliquias(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  seen boolean not null default false,
  primary key (user_id, reliquia_id)
);

create index if not exists user_reliquias_user_idx
  on public.user_reliquias (user_id, unlocked_at desc);

-- ----------------------------------------------------------------------------
-- daily_missions: missão do dia (uma linha por tipo/dia/usuário)
-- ----------------------------------------------------------------------------
create table if not exists public.daily_missions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_date date not null,
  mission_type text not null check (mission_type in ('study_subtopic','pray_rosary','read_liturgy','review_pillar')),
  target int not null default 1,
  progress int not null default 0,
  xp_reward int not null default 20,
  completed boolean not null default false,
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, mission_date, mission_type)
);

create index if not exists daily_missions_user_date_idx
  on public.daily_missions (user_id, mission_date desc);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.reliquias enable row level security;
alter table public.user_gamification enable row level security;
alter table public.user_reliquias enable row level security;
alter table public.daily_missions enable row level security;

-- reliquias: catálogo público (leitura pra todos; escrita só via service_role)
drop policy if exists "reliquias_public_read" on public.reliquias;
create policy "reliquias_public_read"
  on public.reliquias for select
  to anon, authenticated
  using (visible = true);

-- user_gamification: leitura pública (perfis mostram nível); escrita só do dono
drop policy if exists "user_gamification_public_read" on public.user_gamification;
create policy "user_gamification_public_read"
  on public.user_gamification for select
  to anon, authenticated
  using (true);

drop policy if exists "user_gamification_self_upsert" on public.user_gamification;
create policy "user_gamification_self_upsert"
  on public.user_gamification for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_gamification_self_update" on public.user_gamification;
create policy "user_gamification_self_update"
  on public.user_gamification for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_reliquias: leitura pública (selos aparecem em perfil), escrita só dono
drop policy if exists "user_reliquias_public_read" on public.user_reliquias;
create policy "user_reliquias_public_read"
  on public.user_reliquias for select
  to anon, authenticated
  using (true);

drop policy if exists "user_reliquias_self_write" on public.user_reliquias;
create policy "user_reliquias_self_write"
  on public.user_reliquias for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_missions: tudo privado do dono
drop policy if exists "daily_missions_self" on public.daily_missions;
create policy "daily_missions_self"
  on public.daily_missions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill: garante linha em user_gamification pra cada profile existente
insert into public.user_gamification (user_id, total_xp, current_level)
select p.id, 0, 1
from public.profiles p
on conflict (user_id) do nothing;
