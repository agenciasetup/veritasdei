-- ═══════════════════════════════════════════════════════════════════
-- ux-ui(1.13) — user_settings com preferência de tema
-- ═══════════════════════════════════════════════════════════════════
-- Motivação: sincronizar preferência de tema (light/dark/system) entre
-- dispositivos do mesmo usuário. Hoje só persiste em localStorage +
-- cookie no browser atual; com user_settings, a escolha viaja com o
-- usuário ao abrir o app em outro dispositivo.
--
-- Estrutura: 1 linha por usuário (PK = user_id), com theme_preference
-- validada por CHECK constraint para apenas 3 valores.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_preference text not null default 'system'
    check (theme_preference in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is
  'Preferências do usuário que persistem entre dispositivos (tema, etc).';
comment on column public.user_settings.theme_preference is
  'Tema visual: light | dark | system (segue preferência do SO).';

-- ─── Row Level Security ──────────────────────────────────────────
alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Trigger de updated_at ───────────────────────────────────────
create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_user_settings_updated_at();
