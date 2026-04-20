-- ═══════════════════════════════════════════════════════════════════
-- ux-ui(3.12+3.11) — user_settings: sound_enabled + coachmarks_seen
-- ═══════════════════════════════════════════════════════════════════
-- Expande a tabela user_settings (criada no sprint 1.13) com duas
-- preferências novas que fazem sentido persistir entre dispositivos:
--
--   • sound_enabled   — toque sacro em ações como completar dezena
--                       do Terço. Default FALSE (discrição).
--   • coachmarks_seen — se o usuário já viu os coachmarks pós-onboarding.
--                       Default FALSE — primeira sessão mostra, demais não.
-- ═══════════════════════════════════════════════════════════════════

alter table public.user_settings
  add column if not exists sound_enabled boolean not null default false,
  add column if not exists coachmarks_seen boolean not null default false;

comment on column public.user_settings.sound_enabled is
  'Se true, o app toca um sino sutil em ações sacramentais (dezena, missa).';
comment on column public.user_settings.coachmarks_seen is
  'Se true, o usuário já viu os coachmarks da nova navegação.';
