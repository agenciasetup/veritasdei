import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Retorna o user autenticado em server context, ou null.
 * Usar em server actions / route handlers.
 */
export async function requireAuthUser(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * Retorna o user id se for system-admin, null caso contrário.
 * Mesmo padrão usado em features/prayers/editor/actions.ts.
 */
export async function requireSystemAdmin(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  if (!profile || profile.role !== 'admin') return null
  return user.id
}
