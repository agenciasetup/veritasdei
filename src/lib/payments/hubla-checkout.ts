/**
 * Helper para montar a URL do checkout externo da Hubla.
 *
 * Diferente de Stripe/RevenueCat, a Hubla não tem API server-side de
 * criação de session: o checkout é uma página estática em
 * pay.hubla.com.br/<offer-id>. Pré-preenchemos email/nome via query
 * params pra reduzir atrito.
 *
 * A URL base do checkout é configurada via `HUBLA_CHECKOUT_URL_VERITAS_EDUCA`
 * (env). Cole no painel da Hubla → Oferta → Link de Checkout.
 */

export type HublaCheckoutPrefill = {
  email?: string | null
  name?: string | null
}

/**
 * Monta a URL final do checkout Hubla para o produto Veritas Educa.
 *
 * Lança erro se `HUBLA_CHECKOUT_URL_VERITAS_EDUCA` não estiver
 * configurado — preferimos falhar visível na página de assinatura
 * em vez de mandar o usuário pra uma URL vazia.
 */
export function buildHublaCheckoutUrl(prefill: HublaCheckoutPrefill): string {
  const base = process.env.HUBLA_CHECKOUT_URL_VERITAS_EDUCA
  if (!base) {
    throw new Error('HUBLA_CHECKOUT_URL_VERITAS_EDUCA ausente no env')
  }

  let url: URL
  try {
    url = new URL(base)
  } catch {
    throw new Error(
      `HUBLA_CHECKOUT_URL_VERITAS_EDUCA inválido (não é uma URL): ${base}`,
    )
  }

  if (prefill.email) url.searchParams.set('email', prefill.email.trim())
  if (prefill.name) url.searchParams.set('name', prefill.name.trim())

  return url.toString()
}
