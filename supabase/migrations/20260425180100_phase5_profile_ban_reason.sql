-- Fase 5 / Item 2: coluna ban_reason em profiles.
-- A trigger sync_banned_identifier_on_ban lê esta coluna pra anotar o motivo
-- em banned_identifiers.reason quando admin marca account_status='banned'.

begin;

alter table public.profiles
  add column if not exists ban_reason text;

commit;
