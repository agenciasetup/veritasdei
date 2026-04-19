-- ============================================================================
-- Sprint 1.5 — Publica tabelas de gamificação no realtime
-- ============================================================================
-- Permite que o GamificationEventsProvider escute updates em user_gamification
-- (XP/nível) e inserts em user_reliquias (relíquia desbloqueada) para disparar
-- toasts e modais de feedback.
-- ============================================================================

alter publication supabase_realtime add table public.user_gamification;
alter publication supabase_realtime add table public.user_reliquias;
