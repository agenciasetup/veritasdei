import type { SupabaseClient } from '@supabase/supabase-js'
import { hashIdentifier } from './identifier-guard'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_FAILURES = 10

export async function recordFailedLogin(
  admin: SupabaseClient,
  params: { email: string; ip: string | null },
): Promise<void> {
  await admin.from('auth_failed_logins').insert({
    email_hash: hashIdentifier(params.email),
    ip: params.ip,
  })
}

export async function isLoginThrottled(
  admin: SupabaseClient,
  email: string,
): Promise<{ throttled: boolean; failures: number; retryAfterMs: number | null }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count } = await admin
    .from('auth_failed_logins')
    .select('id', { count: 'exact', head: true })
    .eq('email_hash', hashIdentifier(email))
    .gte('created_at', since)

  const failures = count ?? 0
  if (failures < MAX_FAILURES) {
    return { throttled: false, failures, retryAfterMs: null }
  }

  const { data } = await admin
    .from('auth_failed_logins')
    .select('created_at')
    .eq('email_hash', hashIdentifier(email))
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(1)

  const oldest = data?.[0]?.created_at
  const retryAfterMs = oldest ? Math.max(0, new Date(oldest).getTime() + WINDOW_MS - Date.now()) : WINDOW_MS

  return { throttled: true, failures, retryAfterMs }
}

export const LOGIN_THROTTLE_CONFIG = {
  windowMs: WINDOW_MS,
  maxFailures: MAX_FAILURES,
} as const
