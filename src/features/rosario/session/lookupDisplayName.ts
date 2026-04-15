import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Busca o "nome amigável" do usuário pra exibir em salas compartilhadas.
 *
 * Fonte de verdade: `profiles.name`. Se não existir, cai pro prefixo do
 * email. Se nem isso, retorna `null` — o front renderiza "Anônimo".
 *
 * Roda no servidor com o cliente Supabase já autenticado pelo cookie.
 */
export async function lookupDisplayName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  fallbackEmail: string | null | undefined,
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle()

  const name = (data?.name as string | null | undefined)?.trim()
  if (name && name.length > 0) return name.slice(0, 80)

  if (fallbackEmail && fallbackEmail.includes('@')) {
    const prefix = fallbackEmail.split('@')[0]
    if (prefix && prefix.length > 0) return prefix.slice(0, 80)
  }

  return null
}
