-- Fix: vd_media_assets SELECT estava restrito a owner_user_id = auth.uid().
-- Consequência: ao visualizar o feed como OUTRO usuário (não o autor),
-- a junção com vd_post_media retornava as linhas de ligação, mas as
-- linhas de vd_media_assets eram filtradas pelo RLS — a mídia sumia
-- silenciosamente (post aparecia sem foto).
--
-- Correção: alinha com a política de vd_posts e vd_post_media — qualquer
-- usuário autenticado com premium ativo pode ler qualquer media asset.
-- INSERT/UPDATE/DELETE continuam restritos ao owner.

DROP POLICY IF EXISTS vd_media_assets_select_own ON public.vd_media_assets;

CREATE POLICY vd_media_assets_select_premium
  ON public.vd_media_assets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND public.has_active_premium(auth.uid())
  );
