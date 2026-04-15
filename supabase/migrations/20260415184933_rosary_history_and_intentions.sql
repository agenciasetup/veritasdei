-- Rosary Marco 2 — Histórico de terços + Intenções pessoais.
--
-- Applied via Supabase Management API. Este arquivo registra o schema
-- para ambientes futuros.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. rosary_intentions
--    Intenções pessoais do usuário — "rezar por quem está doente", "pelas
--    famílias separadas", "pelo meu irmão". O usuário cria algumas e pode
--    ativá-las ao começar uma sessão de terço.
--
--    Por-usuário, RLS simples: auth.uid() = user_id em todos os comandos.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rosary_intentions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      text NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 120),
  descricao   text CHECK (descricao IS NULL OR char_length(descricao) <= 1000),
  arquivada   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rosary_intentions_user_active
  ON public.rosary_intentions (user_id, arquivada, updated_at DESC);

ALTER TABLE public.rosary_intentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rosary_intentions_select ON public.rosary_intentions;
CREATE POLICY rosary_intentions_select ON public.rosary_intentions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS rosary_intentions_insert ON public.rosary_intentions;
CREATE POLICY rosary_intentions_insert ON public.rosary_intentions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS rosary_intentions_update ON public.rosary_intentions;
CREATE POLICY rosary_intentions_update ON public.rosary_intentions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS rosary_intentions_delete ON public.rosary_intentions;
CREATE POLICY rosary_intentions_delete ON public.rosary_intentions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.rosary_intentions_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rosary_intentions_updated_at ON public.rosary_intentions;
CREATE TRIGGER trg_rosary_intentions_updated_at
  BEFORE UPDATE ON public.rosary_intentions
  FOR EACH ROW EXECUTE FUNCTION public.rosary_intentions_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. rosary_sessions
--    Histórico de terços completados. Cada linha representa uma sessão que
--    o usuário concluiu, com qual conjunto de mistérios e (opcionalmente)
--    por qual intenção rezou. `duration_seconds` permite montar estatísticas
--    futuras (tempo médio, consistência).
--
--    Só gravamos sessões COMPLETAS — sessões abandonadas não vão pra
--    tabela (seguem só no localStorage do sprint 1.6).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE rosary_mystery_set AS ENUM (
    'gozosos','luminosos','dolorosos','gloriosos'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.rosary_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mystery_set       rosary_mystery_set NOT NULL,
  intention_id      uuid REFERENCES public.rosary_intentions(id) ON DELETE SET NULL,
  started_at        timestamptz,
  completed_at      timestamptz NOT NULL DEFAULT now(),
  duration_seconds  integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rosary_sessions_user_completed
  ON public.rosary_sessions (user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rosary_sessions_intention
  ON public.rosary_sessions (intention_id)
  WHERE intention_id IS NOT NULL;

ALTER TABLE public.rosary_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rosary_sessions_select ON public.rosary_sessions;
CREATE POLICY rosary_sessions_select ON public.rosary_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT only: histórico é append-only. Não permitimos UPDATE nem DELETE
-- pelo usuário comum — se quiser apagar uma linha específica abrimos depois.
DROP POLICY IF EXISTS rosary_sessions_insert ON public.rosary_sessions;
CREATE POLICY rosary_sessions_insert ON public.rosary_sessions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND (
      intention_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.rosary_intentions i
        WHERE i.id = intention_id AND i.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS rosary_sessions_delete ON public.rosary_sessions;
CREATE POLICY rosary_sessions_delete ON public.rosary_sessions
  FOR DELETE USING (auth.uid() = user_id);
