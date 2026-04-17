-- Comunidade Veritas — editar posts + preparo para quote embedado
--
-- Escopo:
--   - Coluna edited_at em vd_posts (só setada em edit real).
--   - Trigger mantém edited_at = now() quando body muda (sem recriar o
--     updated_at que já existe).
--   - Limite: posts podem ser editados até 30 dias após criação.
--   - Reflection/quote/reply também podem ser editados (exceto repost,
--     que não tem body próprio).

ALTER TABLE public.vd_posts
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE OR REPLACE FUNCTION public.vd_posts_track_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Só marca edit se o body realmente mudou E não é um INSERT.
  IF TG_OP = 'UPDATE'
     AND OLD.body IS DISTINCT FROM NEW.body
     AND NEW.kind <> 'repost' THEN
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_track_edit ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_track_edit
  BEFORE UPDATE OF body
  ON public.vd_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.vd_posts_track_edit();
