-- Histórico de eventos de login para detecção de acesso suspeito e para que
-- o usuário possa revisar de onde sua conta foi acessada. Retenção prática:
-- 12 meses (política aplicada em job posterior — aqui só o schema).

begin;

create table if not exists public.auth_login_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  ip          text,
  user_agent  text,
  country     text,
  suspicious  boolean not null default false
);

create index if not exists auth_login_events_user_idx
  on public.auth_login_events (user_id, created_at desc);

alter table public.auth_login_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'auth_login_events' and policyname = 'auth_login_events_select_own'
  ) then
    create policy auth_login_events_select_own on public.auth_login_events
      for select using (auth.uid() = user_id);
  end if;
end $$;

comment on table public.auth_login_events is
  'Histórico de eventos de login. Populado pelo middleware no primeiro request autenticado de uma sessão.';

commit;
