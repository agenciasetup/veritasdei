-- Order bumps: add-ons que o cliente pode marcar no checkout antes de
-- pagar. Cada bump tem código, título, descrição, valor e (opcional)
-- restrição por plan_codigos — se a lista for vazia, aparece em todos
-- os checkouts.
--
-- Comportamento: o valor do bump é somado à subscription Asaas. Ou
-- seja, vira add-on RECORRENTE — o usuário paga o bump junto com a
-- renovação. Pra ofertas one-shot use a tabela separada `billing_payments`
-- com um payment Asaas único (não implementado neste sprint).

CREATE TABLE IF NOT EXISTS public.billing_order_bumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  valor_cents int NOT NULL CHECK (valor_cents >= 0),
  badge text,
  plan_codigos text[] NOT NULL DEFAULT '{}',
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_order_bumps_ativo_ordem
  ON public.billing_order_bumps (ativo, ordem);

ALTER TABLE public.billing_order_bumps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_bumps_select_ativos" ON public.billing_order_bumps;
CREATE POLICY "order_bumps_select_ativos"
  ON public.billing_order_bumps FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "order_bumps_admin_write" ON public.billing_order_bumps;
CREATE POLICY "order_bumps_admin_write"
  ON public.billing_order_bumps FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public._billing_order_bumps_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_order_bumps_touch ON public.billing_order_bumps;
CREATE TRIGGER billing_order_bumps_touch
  BEFORE UPDATE ON public.billing_order_bumps
  FOR EACH ROW EXECUTE FUNCTION public._billing_order_bumps_touch();
