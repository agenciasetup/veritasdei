import type { SupabaseClient } from '@supabase/supabase-js'

type RecordParams = {
  supabase: SupabaseClient
  userId: string
  ip: string | null
  userAgent: string | null
}

/**
 * Grava um evento de login em auth_login_events. Marca como "suspicious"
 * quando o par (IP, user-agent) nunca apareceu nos últimos 10 eventos desse
 * usuário — heurística simples para alertar mudança de dispositivo/rede.
 */
export async function recordLoginEvent({ supabase, userId, ip, userAgent }: RecordParams) {
  const { data: recent } = await supabase
    .from('auth_login_events')
    .select('ip, user_agent')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const hasHistory = Array.isArray(recent) && recent.length > 0
  const seen =
    hasHistory &&
    recent.some(
      (e: { ip: string | null; user_agent: string | null }) =>
        (e.ip ?? null) === (ip ?? null) && (e.user_agent ?? null) === (userAgent ?? null),
    )
  const suspicious = hasHistory && !seen

  await supabase.from('auth_login_events').insert({
    user_id: userId,
    ip,
    user_agent: userAgent?.slice(0, 400) ?? null,
    suspicious,
  })
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip')
}
