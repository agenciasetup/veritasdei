import type { SupabaseClient } from '@supabase/supabase-js'

export type EmailOtpType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email'

const VALID_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

export function parseOtpType(raw: string | null | undefined): EmailOtpType | null {
  if (!raw) return null
  return VALID_OTP_TYPES.has(raw as EmailOtpType) ? (raw as EmailOtpType) : null
}

export interface FinalizeResult {
  ok: boolean
  /** Motivo não-genérico para aparecer só nos logs, nunca no response. */
  reason: string | null
}

/**
 * Consome um `code` (PKCE / OAuth) OU `token_hash` + `type` (magic link,
 * recovery, invite, etc.) — o que o email template / provider tiver
 * mandado — e finaliza a sessão no cookie jar do Supabase SSR client.
 *
 * Rotas `/auth/callback` e `/auth/confirm` usam a mesma lógica para não
 * depender do template Supabase enviar exatamente o formato esperado.
 * Se o dashboard reconfigurar o template para mandar `{{ .TokenHash }}`
 * para `/auth/callback`, o callback ainda funciona. E vice-versa.
 */
export async function finalizeAuthSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  params: URLSearchParams,
): Promise<FinalizeResult> {
  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const type = parseOtpType(params.get('type'))

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return { ok: false, reason: `exchangeCodeForSession: ${error.message}` }
    }
    return { ok: true, reason: null }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      return { ok: false, reason: `verifyOtp (${type}): ${error.message}` }
    }
    return { ok: true, reason: null }
  }

  return {
    ok: false,
    reason: `no usable params — code=${!!code} token_hash=${!!tokenHash} type=${params.get('type') ?? 'null'}`,
  }
}
