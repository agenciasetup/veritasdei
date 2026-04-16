-- Marco 4 — Novenas: Fundação do schema.
--
-- 3 tabelas:
--   1. novenas_custom        — novenas criadas pelo usuário
--   2. novenas_progress      — progresso do usuário em cada novena (builtin ou custom)
--   3. novenas_daily_log     — log diário de oração por dia da novena
--
-- Intenções reutilizam rosary_intentions (Marco 2).
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. novenas_custom
--    Novenas criadas pelo próprio usuário com 9 dias de oração.
--    O campo `dias` é JSONB com exatamente 9 objetos {titulo, texto}.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novenas_custom (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      text NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 200),
  descricao   text CHECK (descricao IS NULL OR char_length(descricao) <= 2000),
  dias        jsonb NOT NULL CHECK (jsonb_array_length(dias) = 9),
  arquivada   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_novenas_custom_user
  ON public.novenas_custom (user_id, arquivada, updated_at DESC);

ALTER TABLE public.novenas_custom ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS novenas_custom_select ON public.novenas_custom;
CREATE POLICY novenas_custom_select ON public.novenas_custom
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_custom_insert ON public.novenas_custom;
CREATE POLICY novenas_custom_insert ON public.novenas_custom
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_custom_update ON public.novenas_custom;
CREATE POLICY novenas_custom_update ON public.novenas_custom
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_custom_delete ON public.novenas_custom;
CREATE POLICY novenas_custom_delete ON public.novenas_custom
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.novenas_custom_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_novenas_custom_updated_at ON public.novenas_custom;
CREATE TRIGGER trg_novenas_custom_updated_at
  BEFORE UPDATE ON public.novenas_custom
  FOR EACH ROW EXECUTE FUNCTION public.novenas_custom_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. novenas_progress
--    Progresso do usuário em uma novena (builtin ou custom).
--    XOR: builtin_slug preenchido OU custom_novena_id preenchido, nunca ambos.
--    current_day: 1–9 (dia atual na novena).
--    completed_at: preenchido quando o dia 9 é concluído.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novenas_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  builtin_slug      text,
  custom_novena_id  uuid REFERENCES public.novenas_custom(id) ON DELETE CASCADE,
  intention_id      uuid REFERENCES public.rosary_intentions(id) ON DELETE SET NULL,
  current_day       integer NOT NULL DEFAULT 1 CHECK (current_day BETWEEN 1 AND 9),
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_prayed_at    timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- XOR: exatamente um dos dois deve estar preenchido
  CONSTRAINT novenas_progress_source_xor CHECK (
    (builtin_slug IS NOT NULL AND custom_novena_id IS NULL)
    OR
    (builtin_slug IS NULL AND custom_novena_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_novenas_progress_user_active
  ON public.novenas_progress (user_id, completed_at)
  WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_novenas_progress_user_completed
  ON public.novenas_progress (user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

ALTER TABLE public.novenas_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS novenas_progress_select ON public.novenas_progress;
CREATE POLICY novenas_progress_select ON public.novenas_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_progress_insert ON public.novenas_progress;
CREATE POLICY novenas_progress_insert ON public.novenas_progress
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_progress_update ON public.novenas_progress;
CREATE POLICY novenas_progress_update ON public.novenas_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_progress_delete ON public.novenas_progress;
CREATE POLICY novenas_progress_delete ON public.novenas_progress
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.novenas_progress_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_novenas_progress_updated_at ON public.novenas_progress;
CREATE TRIGGER trg_novenas_progress_updated_at
  BEFORE UPDATE ON public.novenas_progress
  FOR EACH ROW EXECUTE FUNCTION public.novenas_progress_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. novenas_daily_log
--    Log de oração diária: cada vez que o usuário marca "rezei hoje",
--    uma linha é criada. UNIQUE garante que não rezar o mesmo dia 2x
--    na mesma novena.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novenas_daily_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id  uuid NOT NULL REFERENCES public.novenas_progress(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number   integer NOT NULL CHECK (day_number BETWEEN 1 AND 9),
  prayed_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT novenas_daily_log_unique_day UNIQUE (progress_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_novenas_daily_log_progress
  ON public.novenas_daily_log (progress_id, day_number);

ALTER TABLE public.novenas_daily_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS novenas_daily_log_select ON public.novenas_daily_log;
CREATE POLICY novenas_daily_log_select ON public.novenas_daily_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_daily_log_insert ON public.novenas_daily_log;
CREATE POLICY novenas_daily_log_insert ON public.novenas_daily_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_daily_log_delete ON public.novenas_daily_log;
CREATE POLICY novenas_daily_log_delete ON public.novenas_daily_log
  FOR DELETE USING (auth.uid() = user_id);
