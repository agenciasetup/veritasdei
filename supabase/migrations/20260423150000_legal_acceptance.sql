-- Captura auditável de aceites de documentos legais (Termos, Privacidade, Diretrizes,
-- Cookies, DMCA). Cada aceite vira uma linha imutável. Colunas correspondentes em
-- profiles guardam a versão corrente aceita para consulta rápida e para o <LegalGate />
-- decidir se precisa forçar re-aceite.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'legal_document_key') then
    create type public.legal_document_key as enum ('terms', 'privacy', 'guidelines', 'cookies', 'dmca');
  end if;
end $$;

create table if not exists public.user_legal_acceptances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  document_key  public.legal_document_key not null,
  version       text not null,
  accepted_at   timestamptz not null default now(),
  ip            text,
  user_agent    text,
  locale        text
);

create index if not exists user_legal_acceptances_user_idx
  on public.user_legal_acceptances (user_id, document_key, accepted_at desc);

alter table public.user_legal_acceptances enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'user_legal_acceptances' and policyname = 'legal_acceptances_select_own'
  ) then
    create policy legal_acceptances_select_own on public.user_legal_acceptances
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'user_legal_acceptances' and policyname = 'legal_acceptances_insert_own'
  ) then
    create policy legal_acceptances_insert_own on public.user_legal_acceptances
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- aceites são históricos: impedir update/delete por usuários comuns
create or replace function public.legal_acceptances_block_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return coalesce(new, old);
  end if;
  raise exception 'user_legal_acceptances are immutable';
end;
$$;

drop trigger if exists legal_acceptances_no_update on public.user_legal_acceptances;
create trigger legal_acceptances_no_update
  before update on public.user_legal_acceptances
  for each row execute function public.legal_acceptances_block_mutation();

drop trigger if exists legal_acceptances_no_delete on public.user_legal_acceptances;
create trigger legal_acceptances_no_delete
  before delete on public.user_legal_acceptances
  for each row execute function public.legal_acceptances_block_mutation();

alter table public.profiles
  add column if not exists accepted_terms_version      text,
  add column if not exists accepted_privacy_version    text,
  add column if not exists accepted_guidelines_version text,
  add column if not exists accepted_cookies_version    text,
  add column if not exists accepted_dmca_version       text,
  add column if not exists last_acceptance_at          timestamptz,
  add column if not exists last_acceptance_ip          text;

comment on table public.user_legal_acceptances is
  'Registro auditável e imutável dos aceites de documentos legais pelo usuário.';
comment on column public.profiles.accepted_terms_version is
  'Versão dos Termos de Uso aceita pelo usuário; usada pelo LegalGate para forçar re-aceite.';

commit;
