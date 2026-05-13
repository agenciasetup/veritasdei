-- Fase B do Veritas Educa — capas e banner slider.
--
-- 1. Tabela `educa_banners` — banners full-width admin-editáveis exibidos
--    no topo do /educa/estudo (e opcionalmente /educa). Ordem controla
--    a sequência no slider; `ativo=false` esconde sem deletar.
-- 2. Coluna `cover_url` em `trails` — mesmo nome usado em `content_groups`
--    pra dar consistência. Trilhas ganham capa real no card poster do
--    /educa/estudo (fallback continua sendo o gradient por cor).

-- ==========================================================================
-- 1. educa_banners
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.educa_banners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url       text NOT NULL,
  link_url        text,
  title           text,
  subtitle        text,
  ordem           integer NOT NULL DEFAULT 0,
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_educa_banners_ativo_ordem
  ON public.educa_banners (ordem)
  WHERE ativo = true;

ALTER TABLE public.educa_banners ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer autenticado lê banners ATIVOS (anon pode ver também,
-- pra futuras landing pages sem login que queiram destacar os banners).
DROP POLICY IF EXISTS educa_banners_select_public ON public.educa_banners;
CREATE POLICY educa_banners_select_public
  ON public.educa_banners
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- INSERT/UPDATE/DELETE: apenas admin. Checagem por SECURITY DEFINER pra
-- evitar recursão em policies que olhem profiles. Aqui o profiles RLS
-- não bloqueia o admin lendo a si mesmo, então uma subquery simples basta.
DROP POLICY IF EXISTS educa_banners_admin_insert ON public.educa_banners;
CREATE POLICY educa_banners_admin_insert
  ON public.educa_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS educa_banners_admin_update ON public.educa_banners;
CREATE POLICY educa_banners_admin_update
  ON public.educa_banners
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

DROP POLICY IF EXISTS educa_banners_admin_delete ON public.educa_banners;
CREATE POLICY educa_banners_admin_delete
  ON public.educa_banners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

-- Trigger pra manter atualizado_em em sync
CREATE OR REPLACE FUNCTION public.educa_banners_touch_updated_at()
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

DROP TRIGGER IF EXISTS trg_educa_banners_touch ON public.educa_banners;
CREATE TRIGGER trg_educa_banners_touch
  BEFORE UPDATE ON public.educa_banners
  FOR EACH ROW EXECUTE FUNCTION public.educa_banners_touch_updated_at();

-- ==========================================================================
-- 2. cover_url em trails
-- ==========================================================================
-- content_groups já tem cover_url. Aqui só padronizamos trails pro mesmo
-- nome — TrilhasView e PosterCards passam a renderizar imagem real
-- quando definida, com fallback no gradient por cor.
ALTER TABLE public.trails
  ADD COLUMN IF NOT EXISTS cover_url text;
