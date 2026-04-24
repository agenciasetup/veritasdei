-- Apelação de moderação: usuário pode contestar uma sanção (post oculto,
-- conta suspensa, denúncia resolvida contra ele) em até 7 dias. A revisão é
-- feita por admin diferente do que decidiu (idealmente via coluna resolved_by
-- comparada à `resolved_by` em vd_reports).

begin;

create table if not exists public.vd_report_appeals (
  id               uuid primary key default gen_random_uuid(),
  report_id        uuid references public.vd_reports(id) on delete set null,
  post_id          uuid references public.vd_posts(id) on delete set null,
  user_id          uuid not null references auth.users(id) on delete cascade,
  reason           text not null,
  status           text not null default 'pending' check (status in ('pending','upheld','denied','dismissed')),
  resolved_by      uuid references auth.users(id),
  resolved_at      timestamptz,
  resolution_note  text,
  created_at       timestamptz not null default now()
);

create index if not exists vd_report_appeals_user_idx
  on public.vd_report_appeals (user_id, created_at desc);

create index if not exists vd_report_appeals_status_idx
  on public.vd_report_appeals (status)
  where status = 'pending';

alter table public.vd_report_appeals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'vd_report_appeals' and policyname = 'vd_report_appeals_select_own'
  ) then
    create policy vd_report_appeals_select_own on public.vd_report_appeals
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'vd_report_appeals' and policyname = 'vd_report_appeals_insert_own'
  ) then
    create policy vd_report_appeals_insert_own on public.vd_report_appeals
      for insert with check (auth.uid() = user_id);
  end if;
  -- update/delete apenas via service_role (admin panel).
end $$;

comment on table public.vd_report_appeals is
  'Apelações de usuários contra sanções de moderação. Revisão humana obrigatória.';

commit;
