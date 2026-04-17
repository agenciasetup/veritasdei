-- Comunidade Veritas — Sprint 1.5: Reliability & threads aninhados
--
-- Escopo:
--   - Libera reply-de-reply (até limite razoável) — Twitter/Threads fazem.
--   - Função de reconciliação de vd_post_metrics (se trigger falhar, pode
--     rodar manualmente ou via cron para consertar contadores).
--   - Índice de suporte para cursor pagination de replies.

-- ==========================================================================
-- 1. Relaxa guard de parent: threads podem aninhar (até 50 níveis).
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.vd_posts_guard_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent_kind public.vd_post_kind;
  v_depth int;
BEGIN
  IF NEW.kind = 'original' THEN
    RETURN NEW;
  END IF;

  -- Parent precisa existir e não estar apagado.
  SELECT kind
    INTO v_parent_kind
  FROM public.vd_posts
  WHERE id = NEW.parent_post_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post pai inválido ou removido';
  END IF;

  -- repost/quote não podem apontar para reply (só para posts "raiz" — quote
  -- de reply poluiria muito o feed).
  IF NEW.kind IN ('repost', 'quote') AND v_parent_kind = 'reply' THEN
    RAISE EXCEPTION 'Não é permitido repost/quote de reply';
  END IF;

  -- Para reply: permite aninhamento mas cap em 50 para bloquear abuso.
  -- Calcula profundidade subindo a cadeia de parents.
  IF NEW.kind = 'reply' THEN
    WITH RECURSIVE chain(id, parent_post_id, level) AS (
      SELECT vp.id, vp.parent_post_id, 1
      FROM public.vd_posts vp
      WHERE vp.id = NEW.parent_post_id
      UNION ALL
      SELECT vp.id, vp.parent_post_id, c.level + 1
      FROM public.vd_posts vp
      JOIN chain c ON c.parent_post_id = vp.id
      WHERE c.level < 60
    )
    SELECT MAX(level) INTO v_depth FROM chain;

    IF v_depth IS NULL THEN v_depth := 0; END IF;
    IF v_depth >= 50 THEN
      RAISE EXCEPTION 'Thread muito profunda (>50 níveis)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ==========================================================================
-- 2. Função de reconciliação de metrics
-- ==========================================================================
-- Recalcula todos os contadores de vd_post_metrics a partir das tabelas
-- de verdade (vd_reactions, vd_posts, vd_reports). Usar em:
--   - Cron semanal (preventivo).
--   - Ad-hoc quando suspeitar de trigger falho.
-- Retorna número de posts reconciliados.
CREATE OR REPLACE FUNCTION public.vd_reconcile_post_metrics(p_post_id uuid DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  -- Se p_post_id foi passado, reconcilia só ele. Caso contrário, todos.
  WITH target AS (
    SELECT id FROM public.vd_posts
    WHERE deleted_at IS NULL
      AND (p_post_id IS NULL OR id = p_post_id)
  ),
  fresh AS (
    SELECT
      t.id AS post_id,
      (SELECT COUNT(*) FROM public.vd_reactions r
         WHERE r.post_id = t.id AND r.type = 'like') AS like_count,
      (SELECT COUNT(*) FROM public.vd_reactions r
         WHERE r.post_id = t.id AND r.type = 'share_cross') AS share_cross_count,
      (SELECT COUNT(*) FROM public.vd_posts c
         WHERE c.parent_post_id = t.id AND c.kind = 'reply' AND c.deleted_at IS NULL) AS reply_count,
      (SELECT COUNT(*) FROM public.vd_posts c
         WHERE c.parent_post_id = t.id AND c.kind = 'repost' AND c.deleted_at IS NULL) AS repost_count,
      (SELECT COUNT(*) FROM public.vd_posts c
         WHERE c.parent_post_id = t.id AND c.kind = 'quote' AND c.deleted_at IS NULL) AS quote_count,
      (SELECT COUNT(*) FROM public.vd_reports rr
         WHERE rr.post_id = t.id AND rr.status IN ('open', 'reviewing')) AS report_count
    FROM target t
  ),
  upserted AS (
    INSERT INTO public.vd_post_metrics AS m (
      post_id, like_count, share_cross_count, reply_count,
      repost_count, quote_count, report_count, score, score_updated_at, updated_at
    )
    SELECT
      f.post_id,
      f.like_count,
      f.share_cross_count,
      f.reply_count,
      f.repost_count,
      f.quote_count,
      f.report_count,
      (f.like_count * 1 + f.reply_count * 3 + f.repost_count * 4
       + f.quote_count * 4 + f.share_cross_count * 2 - f.report_count * 3)::double precision,
      now(),
      now()
    FROM fresh f
    ON CONFLICT (post_id) DO UPDATE
      SET like_count = EXCLUDED.like_count,
          share_cross_count = EXCLUDED.share_cross_count,
          reply_count = EXCLUDED.reply_count,
          repost_count = EXCLUDED.repost_count,
          quote_count = EXCLUDED.quote_count,
          report_count = EXCLUDED.report_count,
          score = EXCLUDED.score,
          score_updated_at = EXCLUDED.score_updated_at,
          updated_at = EXCLUDED.updated_at
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM upserted;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vd_reconcile_post_metrics(uuid) TO service_role;

-- ==========================================================================
-- 3. Índice de suporte para paginação de replies por cursor
-- ==========================================================================
-- Já existe idx_vd_posts_parent_created (parent_post_id, created_at ASC) da
-- foundation. O id desempata em caso de timestamps idênticos — adicionamos
-- o id como segundo critério.
CREATE INDEX IF NOT EXISTS idx_vd_posts_parent_created_id
  ON public.vd_posts (parent_post_id, created_at ASC, id ASC)
  WHERE deleted_at IS NULL;
