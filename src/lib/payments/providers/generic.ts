/**
 * Provider genérico — Kirvano, Hotmart, Eduzz etc.
 *
 * Por enquanto é só um stub: o endpoint /api/payments/webhooks/[provider]
 * recebe qualquer payload, valida um header `x-webhook-secret` configurado
 * por provider no env, e passa pro dispatcher como `ignore` (loga mas não
 * aplica).
 *
 * Quando o usuário quiser ligar um desses, implementamos o mapping
 * específico aqui — cada um tem seu próprio formato.
 */

import type { NormalizedEvent, ProviderId } from '../types'

const SECRET_ENV_MAP: Record<string, string> = {
  kirvano: 'KIRVANO_WEBHOOK_SECRET',
  hotmart: 'HOTMART_WEBHOOK_SECRET',
  eduzz: 'EDUZZ_WEBHOOK_SECRET',
}

export async function verifyGenericWebhook(
  provider: string,
  req: Request,
): Promise<NormalizedEvent> {
  if (!(provider in SECRET_ENV_MAP)) {
    throw new Error(`Provider genérico desconhecido: ${provider}`)
  }

  const envKey = SECRET_ENV_MAP[provider]
  const expected = process.env[envKey]
  if (!expected) {
    throw new Error(`${envKey} ausente no env`)
  }

  const got = req.headers.get('x-webhook-secret') || ''
  if (got !== expected) {
    throw new Error('x-webhook-secret inválido')
  }

  const body = await req.text()
  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    payload = { raw: body }
  }

  // Sem mapeamento ainda — só loga e ignora.
  return {
    type: 'ignore',
    provider: provider as ProviderId,
    providerEventId: `${provider}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    reason: `generic provider ${provider}: mapping not implemented`,
    raw: payload,
  }
}
