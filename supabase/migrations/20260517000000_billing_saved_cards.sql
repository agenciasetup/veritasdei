-- Cartões salvos pra reuso (sem precisar redigitar PAN). Usa o
-- creditCardToken que a Asaas devolve após a primeira cobrança bem-
-- sucedida. Não armazenamos PAN/CCV — só os 4 últimos dígitos pra
-- exibição.

CREATE TABLE IF NOT EXISTS public.billing_saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'asaas',
  asaas_credit_card_token text NOT NULL,
  brand text,
  bank text,
  last4 text NOT NULL,
  holder_name text,
  expiry_month text,
  expiry_year text,
  is_default boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_saved_cards_user
  ON public.billing_saved_cards (user_id, criado_em DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_saved_cards_user_token
  ON public.billing_saved_cards (user_id, asaas_credit_card_token);

ALTER TABLE public.billing_saved_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_cards_select_own" ON public.billing_saved_cards;
CREATE POLICY "saved_cards_select_own"
  ON public.billing_saved_cards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_delete_own" ON public.billing_saved_cards;
CREATE POLICY "saved_cards_delete_own"
  ON public.billing_saved_cards FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_admin_write" ON public.billing_saved_cards;
CREATE POLICY "saved_cards_admin_write"
  ON public.billing_saved_cards FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public._billing_saved_cards_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_saved_cards_touch ON public.billing_saved_cards;
CREATE TRIGGER billing_saved_cards_touch
  BEFORE UPDATE ON public.billing_saved_cards
  FOR EACH ROW EXECUTE FUNCTION public._billing_saved_cards_touch();
