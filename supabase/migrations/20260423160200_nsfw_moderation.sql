-- Moderação automática de conteúdo enviado pela comunidade.
-- * vd_media_assets ganha colunas de resultado do classificador NSFW.
-- * vd_media_moderation_log persiste todos os scans (auditoria + re-exame).
-- * moderation_blocklist permite que admins adicionem domínios bloqueados
--   (pornografia, fraude, etc.) em runtime, sem precisar de deploy.
-- * moderation_rejections registra tentativas de criação de posts que
--   foram rejeitadas sincronamente por text-filter ou blocklist.

begin;

alter table public.vd_media_assets
  add column if not exists nsfw_flagged boolean not null default false,
  add column if not exists nsfw_score double precision,
  add column if not exists nsfw_labels text[],
  add column if not exists moderation_provider text,
  add column if not exists moderation_scanned_at timestamptz;

create index if not exists vd_media_assets_nsfw_idx
  on public.vd_media_assets (nsfw_flagged)
  where nsfw_flagged = true;

create table if not exists public.vd_media_moderation_log (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid not null references public.vd_media_assets(id) on delete cascade,
  provider    text not null,
  score       double precision,
  labels      text[],
  raw_response jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists vd_media_moderation_log_asset_idx
  on public.vd_media_moderation_log (asset_id, created_at desc);

alter table public.vd_media_moderation_log enable row level security;
-- Sem policy de select para usuários comuns: apenas service_role acessa.

create table if not exists public.moderation_blocklist (
  domain     text primary key,
  reason     text,
  added_by   uuid references auth.users(id),
  added_at   timestamptz not null default now(),
  active     boolean not null default true
);

alter table public.moderation_blocklist enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'moderation_blocklist' and policyname = 'moderation_blocklist_select_all'
  ) then
    create policy moderation_blocklist_select_all on public.moderation_blocklist
      for select using (true);
  end if;
end $$;

create table if not exists public.moderation_rejections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  reason        text not null,
  sample        text,
  created_at    timestamptz not null default now(),
  user_agent    text,
  ip            text
);

create index if not exists moderation_rejections_user_idx
  on public.moderation_rejections (user_id, created_at desc);

alter table public.moderation_rejections enable row level security;
-- Apenas service_role lê/grava. O usuário nunca deve ver isso.

comment on table public.vd_media_moderation_log is
  'Histórico de scans NSFW (Cloudflare Workers AI / SafeSearch) para auditoria.';
comment on table public.moderation_blocklist is
  'Domínios bloqueados em posts (pornografia, fraude). Editável por admin.';
comment on table public.moderation_rejections is
  'Tentativas de criação rejeitadas por filtro de texto ou blocklist.';

commit;
