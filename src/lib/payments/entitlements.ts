/**
 * Leitura de entitlements do usuário.
 *
 * Sempre via `public.get_user_entitlement(uid)` (security definer).
 * Retorna null se o usuário não tem plano algum.
 *
 * Usado tanto em Server Components (gate de rota via RequirePremium)
 * quanto via Route Handlers.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type Entitlement = {
  plano: string
  ativo: boolean
  status: string
  expira_em: string | null
  cancel_at_period_end: boolean
  fonte: string
}

export async function getEntitlement(
  userId: string,
): Promise<Entitlement | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_user_entitlement', {
    uid: userId,
  })
  if (error) {
    console.warn('[payments] get_user_entitlement error:', error.message)
    return null
  }
  // RPC retorna setof; client recebe como array
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return row as Entitlement
}

export async function hasActivePremium(userId: string): Promise<boolean> {
  const ent = await getEntitlement(userId)
  return !!(ent && ent.ativo && ent.plano === 'premium')
}
