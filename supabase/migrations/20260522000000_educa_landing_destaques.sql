-- Veritas Educa — faixa de prova social ("stories") da landing page.
--
-- Tabela `educa_landing_destaques` armazena os rostos curados pelo admin
-- (padres, influenciadores católicos, alunos em destaque) que aparecem
-- na faixa "Quem já está estudando", acima dos planos. Não é feed de
-- usuários reais — é uma lista pequena (geralmente <20) e manualmente
-- mantida.
--
-- RLS: leitura pública só dos ativos (a landing roda sem auth);
-- escrita só admin (mesmo padrão de educa_banners).

CREATE TABLE IF NOT EXISTS public.educa_landing_destaques (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  subtitulo       text,
  photo_url       text NOT NULL,
  link_url        text,
  ordem           integer NOT NULL DEFAULT 0,
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_educa_landing_destaques_ativo_ordem
  ON public.educa_landing_destaques (ordem)
  WHERE ativo = true;

ALTER TABLE public.educa_landing_destaques ENABLE ROW LEVEL SECURITY;

-- SELECT: anon + authenticated, apenas ativos.
DROP POLICY IF EXISTS educa_landing_destaques_select_public ON public.educa_landing_destaques;
CREATE POLICY educa_landing_destaques_select_public
  ON public.educa_landing_destaques
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- INSERT/UPDATE/DELETE: somente admin.
DROP POLICY IF EXISTS educa_landing_destaques_admin_insert ON public.educa_landing_destaques;
CREATE POLICY educa_landing_destaques_admin_insert
  ON public.educa_landing_destaques
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS educa_landing_destaques_admin_update ON public.educa_landing_destaques;
CREATE POLICY educa_landing_destaques_admin_update
  ON public.educa_landing_destaques
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS educa_landing_destaques_admin_delete ON public.educa_landing_destaques;
CREATE POLICY educa_landing_destaques_admin_delete
  ON public.educa_landing_destaques
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

CREATE OR REPLACE FUNCTION public.educa_landing_destaques_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_educa_landing_destaques_touch ON public.educa_landing_destaques;
CREATE TRIGGER trg_educa_landing_destaques_touch
  BEFORE UPDATE ON public.educa_landing_destaques
  FOR EACH ROW EXECUTE FUNCTION public.educa_landing_destaques_touch_updated_at();
