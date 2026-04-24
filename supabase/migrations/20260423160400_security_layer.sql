-- Camada de segurança adicional: anti-recadastro após banimento, throttling
-- progressivo por e-mail e visibilidade granular de perfil.

begin;

-- 1. Identificadores banidos: hash SHA-256 de e-mail ou IP. Sem armazenar
--    valor em claro — serve apenas para comparação no signup. Admin pode
--    adicionar manualmente via service_role.
create table if not exists public.banned_identifiers (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('email', 'ip')),
  value_hash   text not null,
  reason       text,
  banned_at    timestamptz not null default now(),
  banned_by    uuid references auth.users(id),
  expires_at   timestamptz
);

create unique index if not exists banned_identifiers_kind_hash_idx
  on public.banned_identifiers (kind, value_hash);

create index if not exists banned_identifiers_expires_idx
  on public.banned_identifiers (expires_at)
  where expires_at is not null;

alter table public.banned_identifiers enable row level security;
-- Sem policy de select para usuários comuns. Apenas service_role manipula.

-- 2. Tentativas de login por identificador (e-mail) para bloqueio progressivo
--    independente do rate-limit por IP. Retenção: limpar em cron futuramente.
create table if not exists public.auth_failed_logins (
  id           uuid primary key default gen_random_uuid(),
  email_hash   text not null,
  ip           text,
  created_at   timestamptz not null default now()
);

create index if not exists auth_failed_logins_recent_idx
  on public.auth_failed_logins (email_hash, created_at desc);

alter table public.auth_failed_logins enable row level security;
-- service_role only.

-- 3. Visibilidade granular de perfil.
alter table public.profiles
  add column if not exists profile_visibility text
    not null default 'public'
    check (profile_visibility in ('public', 'followers', 'private'));

create index if not exists profiles_visibility_idx
  on public.profiles (profile_visibility)
  where profile_visibility <> 'public';

-- 4. Denúncias urgentes (SOS): marca a denúncia com SLA 24h e envolve
--    menor / violência. Guardadas em separado porque têm fluxo prioritário
--    e exigem preservação de provas.
create table if not exists public.vd_sos_reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  target_user_id   uuid references auth.users(id) on delete set null,
  target_post_id   uuid references public.vd_posts(id) on delete set null,
  category         text not null check (category in (
    'menor_em_risco',
    'nudez_nao_consensual',
    'violencia_grave',
    'ameaca_vida',
    'outro'
  )),
  details          text,
  ip               text,
  user_agent       text,
  status           text not null default 'open' check (status in ('open','triaged','escalated','closed')),
  created_at       timestamptz not null default now(),
  triaged_at       timestamptz,
  triaged_by       uuid references auth.users(id),
  closed_at        timestamptz,
  closed_by        uuid references auth.users(id)
);

create index if not exists vd_sos_reports_status_idx
  on public.vd_sos_reports (status, created_at desc)
  where status in ('open','triaged');

alter table public.vd_sos_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'vd_sos_reports' and policyname = 'vd_sos_reports_insert_self'
  ) then
    create policy vd_sos_reports_insert_self on public.vd_sos_reports
      for insert with check (auth.uid() is not null and auth.uid() = reporter_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'vd_sos_reports' and policyname = 'vd_sos_reports_select_own'
  ) then
    create policy vd_sos_reports_select_own on public.vd_sos_reports
      for select using (auth.uid() = reporter_user_id);
  end if;
end $$;

comment on table public.banned_identifiers is
  'Hashes SHA-256 de e-mail/IP banidos. Check no signup previne recadastro após ban.';
comment on table public.auth_failed_logins is
  'Tentativas falhas de login para bloqueio progressivo por e-mail.';
comment on column public.profiles.profile_visibility is
  'public = qualquer um vê; followers = apenas seguidores; private = somente o dono.';
comment on table public.vd_sos_reports is
  'Denúncias urgentes (SOS): envolve menor, nudez não consensual, violência. SLA 24h.';

commit;
