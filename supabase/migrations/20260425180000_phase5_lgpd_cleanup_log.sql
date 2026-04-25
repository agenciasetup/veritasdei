-- Fase 5 / Item 1: tabela de auditoria do cron LGPD.
-- Cada execução do /api/cron/lgpd-cleanup grava 1 linha aqui — necessário
-- para justificativa LGPD perante DPO/ANPD se exigirem histórico.

begin;

create table if not exists public.lgpd_cleanup_log (
  id bigserial primary key,
  run_at timestamptz not null default now(),
  duration_ms int,
  processed_count int not null default 0,
  warned_count int not null default 0,
  failed_count int not null default 0,
  error_message text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists lgpd_cleanup_log_run_at_idx
  on public.lgpd_cleanup_log (run_at desc);

alter table public.lgpd_cleanup_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lgpd_cleanup_log'
      and policyname = 'lgpd_cleanup_log_admin_read'
  ) then
    create policy lgpd_cleanup_log_admin_read
      on public.lgpd_cleanup_log
      for select
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.community_role in ('admin','moderator')
        )
      );
  end if;
end $$;

commit;
