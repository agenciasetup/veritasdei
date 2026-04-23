-- Adiciona colunas de preferências granulares por categoria em
-- user_notificacoes_prefs (a tabela já existia com schema antigo —
-- `rezar_terco_hora`, `lembrete_confissao_dias`, `lembrete_missa` —
-- então o CREATE TABLE IF NOT EXISTS da migration anterior foi pulado
-- e as colunas novas nunca chegaram no banco).
--
-- Idempotente: `add column if not exists` não falha se rodar duas vezes.

alter table public.user_notificacoes_prefs
  add column if not exists pref_liturgia boolean not null default true,
  add column if not exists pref_liturgia_hora smallint not null default 7
    check (pref_liturgia_hora between 0 and 23),
  add column if not exists pref_angelus boolean not null default true,
  add column if not exists pref_novenas boolean not null default true,
  add column if not exists pref_exame boolean not null default true,
  add column if not exists pref_exame_hora smallint not null default 21
    check (pref_exame_hora between 0 and 23),
  add column if not exists pref_comunidade boolean not null default true,
  add column if not exists criado_em timestamptz not null default now();

create index if not exists idx_user_notificacoes_prefs_push_enabled
  on public.user_notificacoes_prefs (push_enabled)
  where push_enabled = true;
