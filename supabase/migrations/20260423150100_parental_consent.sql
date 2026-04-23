-- Consentimento parental para usuários de 14 a 17 anos (LGPD art. 14 §1º).
-- Fluxo: menor informa e-mail do responsável → token HMAC é gerado → link enviado por
-- e-mail → responsável confirma nome/relação → conta é liberada. Enquanto não
-- confirmado, account_status='pending_parental_consent' bloqueia funcionalidades
-- sensíveis no código da aplicação.

begin;

-- account_status controla estados de moderação/consentimento.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_account_status') then
    create type public.profile_account_status as enum (
      'active',
      'pending_parental_consent',
      'pending_deletion',
      'suspended',
      'banned'
    );
  end if;
end $$;

alter table public.profiles
  add column if not exists account_status public.profile_account_status not null default 'active',
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz;

create index if not exists profiles_account_status_idx
  on public.profiles (account_status)
  where account_status <> 'active';

-- Tabela de pedidos e confirmações de consentimento parental.
create table if not exists public.parental_consents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  parent_email      text not null,
  parent_name       text,
  parent_relation   text check (parent_relation in ('pai', 'mae', 'tutor_legal', 'responsavel_legal', null)),
  token_hash        text not null,
  requested_at      timestamptz not null default now(),
  requested_ip      text,
  expires_at        timestamptz not null default now() + interval '48 hours',
  confirmed_at      timestamptz,
  confirmed_ip      text,
  revoked_at        timestamptz,
  revoked_reason    text
);

create index if not exists parental_consents_user_idx
  on public.parental_consents (user_id, requested_at desc);

create index if not exists parental_consents_token_idx
  on public.parental_consents (token_hash)
  where confirmed_at is null and revoked_at is null;

alter table public.parental_consents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'parental_consents' and policyname = 'parental_consents_select_own'
  ) then
    create policy parental_consents_select_own on public.parental_consents
      for select using (auth.uid() = user_id);
  end if;
  -- Insert/update/delete ficam restritos a service_role (via API com chave privada).
end $$;

comment on table public.parental_consents is
  'Pedidos e confirmações de consentimento parental para usuários de 14 a 17 anos (LGPD art. 14).';
comment on column public.parental_consents.token_hash is
  'Hash SHA-256 do token enviado ao responsável. Token em texto puro nunca é armazenado.';

commit;
