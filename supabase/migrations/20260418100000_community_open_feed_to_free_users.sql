-- Comunidade Veritas — abre feed para usuários free
--
-- Regra: qualquer usuário autenticado pode VER o feed, CURTIR, REPOSTAR e
-- COMPARTILHAR. Apenas POSTAR (original/reply/quote) exige Premium.
--
-- Ajuste das RLS policies criadas em 20260417100000_community_veritas_foundation.sql.

-- ==========================================================================
-- vd_posts: SELECT aberto a qualquer autenticado (respeitando blocks/mutes)
-- ==========================================================================
DROP POLICY IF EXISTS vd_posts_select_premium ON public.vd_posts;
DROP POLICY IF EXISTS vd_posts_select_all ON public.vd_posts;
CREATE POLICY vd_posts_select_all
  ON public.vd_posts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.vd_blocks b
      WHERE (b.blocker_user_id = auth.uid() AND b.blocked_user_id = author_user_id)
         OR (b.blocker_user_id = author_user_id AND b.blocked_user_id = auth.uid())
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.vd_mutes m
      WHERE m.muter_user_id = auth.uid()
        AND m.muted_user_id = author_user_id
    )
  );

-- ==========================================================================
-- vd_posts: INSERT — repost aberto; original/reply/quote exige Premium
-- ==========================================================================
DROP POLICY IF EXISTS vd_posts_insert_own ON public.vd_posts;
CREATE POLICY vd_posts_insert_own
  ON public.vd_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_user_id
    AND (
      kind = 'repost'
      OR public.has_active_premium(auth.uid())
    )
  );

-- ==========================================================================
-- vd_posts: UPDATE — dono pode editar; Premium só exigido se alterar body/kind
-- (mantido simples: apenas dono, sem gate Premium — edição de body já
--  dependeria de ter postado, o que já exige Premium via INSERT)
-- ==========================================================================
DROP POLICY IF EXISTS vd_posts_update_own ON public.vd_posts;
CREATE POLICY vd_posts_update_own
  ON public.vd_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_user_id)
  WITH CHECK (auth.uid() = author_user_id);

-- ==========================================================================
-- vd_posts: DELETE — dono pode apagar (incluindo reposts feitos por free)
-- ==========================================================================
DROP POLICY IF EXISTS vd_posts_delete_own ON public.vd_posts;
CREATE POLICY vd_posts_delete_own
  ON public.vd_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_user_id);

-- ==========================================================================
-- vd_post_media: SELECT aberto (mídia de qualquer post visível)
-- ==========================================================================
DROP POLICY IF EXISTS vd_post_media_select_premium ON public.vd_post_media;
DROP POLICY IF EXISTS vd_post_media_select_all ON public.vd_post_media;
CREATE POLICY vd_post_media_select_all
  ON public.vd_post_media
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.deleted_at IS NULL
    )
  );

-- ==========================================================================
-- vd_post_metrics: SELECT aberto (contadores de qualquer post visível)
-- ==========================================================================
DROP POLICY IF EXISTS vd_post_metrics_select_premium ON public.vd_post_metrics;
DROP POLICY IF EXISTS vd_post_metrics_select_all ON public.vd_post_metrics;
CREATE POLICY vd_post_metrics_select_all
  ON public.vd_post_metrics
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.deleted_at IS NULL
    )
  );

-- ==========================================================================
-- vd_media_assets: SELECT do próprio dono (sem gate Premium)
-- ==========================================================================
DROP POLICY IF EXISTS vd_media_assets_select_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_select_own
  ON public.vd_media_assets
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS vd_media_assets_update_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_update_own
  ON public.vd_media_assets
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS vd_media_assets_delete_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_delete_own
  ON public.vd_media_assets
  FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- ==========================================================================
-- vd_follows: SELECT do próprio (usado pelo feed-loader para ranking)
-- INSERT/DELETE continuam exigindo Premium (seguir é ação de engajamento)
-- ==========================================================================
DROP POLICY IF EXISTS vd_follows_select_own ON public.vd_follows;
CREATE POLICY vd_follows_select_own
  ON public.vd_follows
  FOR SELECT
  TO authenticated
  USING (follower_user_id = auth.uid());

-- ==========================================================================
-- vd_reactions: SELECT do próprio, INSERT/DELETE abertos (curtir/compartilhar)
-- ==========================================================================
DROP POLICY IF EXISTS vd_reactions_select_own ON public.vd_reactions;
CREATE POLICY vd_reactions_select_own
  ON public.vd_reactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS vd_reactions_insert_own ON public.vd_reactions;
CREATE POLICY vd_reactions_insert_own
  ON public.vd_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS vd_reactions_delete_own ON public.vd_reactions;
CREATE POLICY vd_reactions_delete_own
  ON public.vd_reactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================================================
-- vd_blocks: SELECT/INSERT/DELETE do próprio (safety — não gateia por Premium)
-- ==========================================================================
DROP POLICY IF EXISTS vd_blocks_select_own ON public.vd_blocks;
CREATE POLICY vd_blocks_select_own
  ON public.vd_blocks
  FOR SELECT
  TO authenticated
  USING (blocker_user_id = auth.uid());

DROP POLICY IF EXISTS vd_blocks_insert_own ON public.vd_blocks;
CREATE POLICY vd_blocks_insert_own
  ON public.vd_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (blocker_user_id = auth.uid());

DROP POLICY IF EXISTS vd_blocks_delete_own ON public.vd_blocks;
CREATE POLICY vd_blocks_delete_own
  ON public.vd_blocks
  FOR DELETE
  TO authenticated
  USING (blocker_user_id = auth.uid());

-- ==========================================================================
-- vd_mutes: SELECT/INSERT/DELETE do próprio (safety — sem gate Premium)
-- ==========================================================================
DROP POLICY IF EXISTS vd_mutes_select_own ON public.vd_mutes;
CREATE POLICY vd_mutes_select_own
  ON public.vd_mutes
  FOR SELECT
  TO authenticated
  USING (muter_user_id = auth.uid());

DROP POLICY IF EXISTS vd_mutes_insert_own ON public.vd_mutes;
CREATE POLICY vd_mutes_insert_own
  ON public.vd_mutes
  FOR INSERT
  TO authenticated
  WITH CHECK (muter_user_id = auth.uid());

DROP POLICY IF EXISTS vd_mutes_delete_own ON public.vd_mutes;
CREATE POLICY vd_mutes_delete_own
  ON public.vd_mutes
  FOR DELETE
  TO authenticated
  USING (muter_user_id = auth.uid());

-- ==========================================================================
-- vd_reports: SELECT/INSERT/UPDATE do próprio (reportar é safety — sem Premium)
-- ==========================================================================
DROP POLICY IF EXISTS vd_reports_select_own ON public.vd_reports;
CREATE POLICY vd_reports_select_own
  ON public.vd_reports
  FOR SELECT
  TO authenticated
  USING (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS vd_reports_insert_own ON public.vd_reports;
CREATE POLICY vd_reports_insert_own
  ON public.vd_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS vd_reports_update_own ON public.vd_reports;
CREATE POLICY vd_reports_update_own
  ON public.vd_reports
  FOR UPDATE
  TO authenticated
  USING (reporter_user_id = auth.uid())
  WITH CHECK (reporter_user_id = auth.uid());
