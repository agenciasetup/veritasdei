-- Bug encontrado em produção: posts NSFW eram bloqueados (rollback deletava
-- o asset), mas o scan ficava sem rastro porque vd_media_moderation_log
-- tinha asset_id com on delete cascade. Resultado: zero auditoria
-- justamente para os casos mais críticos.
--
-- Correção: relaxa a FK para set null + permite asset_id null. O scan
-- preserva provider/score/labels mesmo após rollback, e quem investigar
-- depois consegue cruzar com moderation_rejections via timestamp + user.

begin;

alter table public.vd_media_moderation_log
  drop constraint if exists vd_media_moderation_log_asset_id_fkey;

alter table public.vd_media_moderation_log
  alter column asset_id drop not null;

alter table public.vd_media_moderation_log
  add constraint vd_media_moderation_log_asset_id_fkey
  foreign key (asset_id)
  references public.vd_media_assets(id)
  on delete set null;

commit;
