-- Cadastra os preços do plano `veritas-educa` (faltavam — /educa/assine
-- quebrava com "Nenhum preço mensal disponível").
--
-- Mensal R$19,90  |  Semestral R$99,00  |  Anual R$179,00
--
-- Default provider do plano = asaas, então usamos amount_cents e deixamos
-- asaas_value_cents NULL (o provider Asaas usa fallback em asaas.ts).

WITH plano AS (
  SELECT id FROM public.billing_plans WHERE codigo = 'veritas-educa'
)
INSERT INTO public.billing_prices (plan_id, intervalo, amount_cents, moeda, ativo)
SELECT plano.id, v.intervalo::text, v.amount_cents, 'BRL', true
FROM plano, (VALUES
  ('mensal',     1990),
  ('semestral',  9900),
  ('anual',     17900)
) AS v(intervalo, amount_cents)
ON CONFLICT DO NOTHING;
