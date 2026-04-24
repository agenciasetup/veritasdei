import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hashing padrão SHA-256 em lowercase hex. Usado para comparar e-mails e
 * IPs contra a blocklist de bans sem armazenar valor em claro.
 */
export function hashIdentifier(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export type GuardResult =
  | { allowed: true }
  | { allowed: false; reason: 'banned_email' | 'banned_ip'; expiresAt: string | null }

export async function checkIdentifierBan(
  admin: SupabaseClient,
  params: { email?: string | null; ip?: string | null },
): Promise<GuardResult> {
  const now = new Date().toISOString()
  const hashes: Array<{ kind: 'email' | 'ip'; hash: string }> = []
  if (params.email) hashes.push({ kind: 'email', hash: hashIdentifier(params.email) })
  if (params.ip) hashes.push({ kind: 'ip', hash: hashIdentifier(params.ip) })
  if (hashes.length === 0) return { allowed: true }

  for (const entry of hashes) {
    const { data } = await admin
      .from('banned_identifiers')
      .select('expires_at')
      .eq('kind', entry.kind)
      .eq('value_hash', entry.hash)
      .maybeSingle()
    if (data) {
      if (!data.expires_at || data.expires_at > now) {
        return {
          allowed: false,
          reason: entry.kind === 'email' ? 'banned_email' : 'banned_ip',
          expiresAt: data.expires_at,
        }
      }
    }
  }

  return { allowed: true }
}

type BanEntry = { kind: 'email' | 'ip'; value: string; reason?: string; expiresAt?: Date | null }

/**
 * Admin util — banir um identificador. Salva apenas o hash.
 */
export async function banIdentifier(admin: SupabaseClient, entry: BanEntry): Promise<void> {
  await admin.from('banned_identifiers').upsert(
    {
      kind: entry.kind,
      value_hash: hashIdentifier(entry.value),
      reason: entry.reason ?? null,
      expires_at: entry.expiresAt ? entry.expiresAt.toISOString() : null,
    },
    { onConflict: 'kind,value_hash' },
  )
}
