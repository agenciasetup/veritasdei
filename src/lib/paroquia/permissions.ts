import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ParoquiaMemberRole } from '@/types/paroquiaMember'

/**
 * Retorna a role ativa do user em uma paróquia, ou null.
 * SECURITY DEFINER no banco já faz o check; aqui só consultamos a tabela.
 */
export async function getMyRoleInParoquia(
  paroquiaId: string,
): Promise<ParoquiaMemberRole | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('paroquia_members')
    .select('role')
    .eq('paroquia_id', paroquiaId)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle<{ role: ParoquiaMemberRole }>()
  return data?.role ?? null
}

export async function canManageParoquia(paroquiaId: string): Promise<boolean> {
  const role = await getMyRoleInParoquia(paroquiaId)
  return role !== null
}

export async function isParoquiaAdmin(paroquiaId: string): Promise<boolean> {
  const role = await getMyRoleInParoquia(paroquiaId)
  return role === 'admin'
}

/**
 * Conta admins ativos de uma paróquia — usado pra bloquear "sair" do último admin.
 * Usa admin client para bypassar RLS em contexto server.
 */
export async function paroquiaAdminCount(paroquiaId: string): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('paroquia_members')
    .select('id', { count: 'exact', head: true })
    .eq('paroquia_id', paroquiaId)
    .eq('role', 'admin')
    .is('revoked_at', null)
  return count ?? 0
}
