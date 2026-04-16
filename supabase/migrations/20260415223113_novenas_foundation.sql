-- Novenas Marco 4 — Sprint 4.1 — Fundação de dados.
--
-- Novena = devoção católica tradicional de 9 dias seguidos de oração.
-- O usuário escolhe uma novena do catálogo builtin (hardcoded em TS,
-- em src/features/novenas/data/catalog.ts) OU cria uma personalizada
-- e reza um dia por vez, marcando cada dia como concluído.
--
-- Decisões de produto deste marco:
--   - consecutividade FLEXÍVEL: se o usuário pular dias, o progresso
--     continua — não zera nem bloqueia. `last_prayed_at` permite
--     mostrar rótulos ("há 3 dias sem rezar") na UI mas nada é
--     enforcado no DB.
--   - MÚLTIPLAS novenas simultâneas: nenhuma unique constraint em
--     (user_id, builtin_slug) — o usuário pode ter várias em curso.
--   - PERSONALIZADAS: tabela `novenas_custom` armazena novenas
--     criadas pelo próprio usuário. O conteúdo dos 9 dias é um
--     JSONB com schema validado client/server-side.
--   - Intenções reutilizam `rosary_intentions` como genéricas — não
--     criamos uma tabela de intenções duplicada.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. novenas_custom
--    Novenas criadas pelo usuário. O campo `dias` é um JSONB array
--    de 9 elementos: [{ titulo: string, texto: string }, ... x9].
--    Validação profunda do shape acontece nos route handlers — aqui
--    só garantimos que é jsonb e que tem exatamente 9 elementos.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novenas_custom (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      text NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 120),
  descricao   text CHECK (descricao IS NULL OR char_length(descricao) <= 2000),
  dias        jsonb NOT NULL CHECK (
    jsonb_typeof(dias) = 'array'
    AND jsonb_array_length(dias) = 9
  ),
  arquivada   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_novenas_custom_user_active
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
--    Uma linha por "novena iniciada". Armazena qual novena foi iniciada
--    (builtin_slug XOR custom_novena_id), a intenção opcional, o dia
--    corrente (1–9) e os timestamps de início/último dia/conclusão.
--
--    Quando o usuário reza o dia 9 e marca, setamos `completed_at` e
--    `current_day` fica em 9. Uma novena concluída permanece na tabela
--    para compor o histórico; usuário pode iniciá-la de novo, criando
--    uma nova linha.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novenas_progress (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  builtin_slug     text CHECK (
    builtin_slug IS NULL
    OR char_length(builtin_slug) BETWEEN 1 AND 80
  ),
  custom_novena_id uuid REFERENCES public.novenas_custom(id) ON DELETE CASCADE,
  intention_id     uuid REFERENCES public.rosary_intentions(id) ON DELETE SET NULL,
  current_day      integer NOT NULL DEFAULT 1 CHECK (current_day BETWEEN 1 AND 9),
  started_at       timestamptz NOT NULL DEFAULT now(),
  last_prayed_at   timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  -- XOR: exatamente uma das duas referências pode ser não-nula.
  CONSTRAINT novenas_progress_source_xor CHECK (
    (builtin_slug IS NOT NULL)::int + (custom_novena_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_novenas_progress_user_active
  ON public.novenas_progress (user_id, completed_at NULLS FIRST, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_novenas_progress_intention
  ON public.novenas_progress (intention_id)
  WHERE intention_id IS NOT NULL;

ALTER TABLE public.novenas_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS novenas_progress_select ON public.novenas_progress;
CREATE POLICY novenas_progress_select ON public.novenas_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_progress_insert ON public.novenas_progress;
CREATE POLICY novenas_progress_insert ON public.novenas_progress
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
    AND (
      custom_novena_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.novenas_custom c
        WHERE c.id = custom_novena_id AND c.user_id = auth.uid()
      )
    )
  );

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
--    Registro append-only de cada dia que o usuário marcou como rezado.
--    Usado para histórico e estatísticas ("você rezou 42 dias em fevereiro").
--    Unique (progress_id, day_number) evita contagem dupla caso o usuário
--    clique "rezei" duas vezes no mesmo dia.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novenas_daily_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id  uuid NOT NULL REFERENCES public.novenas_progress(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number   integer NOT NULL CHECK (day_number BETWEEN 1 AND 9),
  prayed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (progress_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_novenas_daily_log_user_prayed
  ON public.novenas_daily_log (user_id, prayed_at DESC);

ALTER TABLE public.novenas_daily_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS novenas_daily_log_select ON public.novenas_daily_log;
CREATE POLICY novenas_daily_log_select ON public.novenas_daily_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS novenas_daily_log_insert ON public.novenas_daily_log;
CREATE POLICY novenas_daily_log_insert ON public.novenas_daily_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.novenas_progress p
      WHERE p.id = progress_id AND p.user_id = auth.uid()
    )
  );

-- Sem UPDATE/DELETE: log é append-only.
