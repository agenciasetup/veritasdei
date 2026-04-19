/**
 * Verifica token do Cloudflare Turnstile.
 *
 * Env: TURNSTILE_SECRET_KEY (server-only).
 * Sem secret configurada, verifyTurnstile retorna `true` no NODE_ENV=development
 * pra não travar o dev local; em production, recusa.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileResult {
  success: boolean
  /** Código de erro da Cloudflare quando falha. */
  errorCodes?: string[]
  /** Hostname que recebeu o challenge. */
  hostname?: string
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    // Sem secret: permissivo em dev, recusa em prod.
    if (process.env.NODE_ENV !== 'production') {
      return { success: true }
    }
    return { success: false, errorCodes: ['missing-secret'] }
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] }
  }

  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)
  if (ip) form.set('remoteip', ip)

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: form,
      // Evita cache acidental; cada check é único.
      cache: 'no-store',
    })
    if (!res.ok) {
      return { success: false, errorCodes: [`http-${res.status}`] }
    }
    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
      hostname?: string
    }
    return {
      success: data.success === true,
      errorCodes: data['error-codes'],
      hostname: data.hostname,
    }
  } catch (err) {
    console.warn('[turnstile] verify error:', err)
    return { success: false, errorCodes: ['network-error'] }
  }
}
