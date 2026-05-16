import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve o "nome amigável" do usuário pra exibir em salas compartilhadas.
 *
 * Fallback chain:
 *   1. `profiles.name`
 *   2. metadados do auth.users (`full_name`, `name`)
 *   3. prefixo do email
 *   4. `'Convidado'`
 *
 * Esta resolução também roda dentro da função SQL
 * `_rosary_resolve_display_name` (mesma lógica em PL/pgSQL) — manter
 * em sincronia. A função SQL é a fonte de verdade quando o participante
 * é inserido via trigger ou `join_rosary_room`; este helper aqui é
 * usado como defesa-em-profundidade no servidor.
 */
export async function lookupDisplayName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  fallbackEmail: string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userMetadata?: Record<string, any> | null,
): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle()

  const profileName = (data?.name as string | null | undefined)?.trim()
  if (profileName && profileName.length > 0) return profileName.slice(0, 80)

  const metaFullName =
    typeof userMetadata?.full_name === 'string'
      ? userMetadata.full_name.trim()
      : ''
  if (metaFullName.length > 0) return metaFullName.slice(0, 80)

  const metaName =
    typeof userMetadata?.name === 'string' ? userMetadata.name.trim() : ''
  if (metaName.length > 0) return metaName.slice(0, 80)

  if (fallbackEmail && fallbackEmail.includes('@')) {
    const prefix = fallbackEmail.split('@')[0]
    if (prefix && prefix.length > 0) return prefix.slice(0, 80)
  }

  return 'Convidado'
}

/**
 * Resolve a URL do avatar — `profiles.profile_image_url` com fallback
 * pros metadados do OAuth (`avatar_url`, `picture`). Pode retornar
 * `null` se o usuário não tem avatar.
 */
export async function lookupAvatarUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userMetadata?: Record<string, any> | null,
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('profile_image_url')
    .eq('id', userId)
    .maybeSingle()

  const url = (data?.profile_image_url as string | null | undefined)?.trim()
  if (url && url.length > 0) return url

  const metaAvatar =
    typeof userMetadata?.avatar_url === 'string'
      ? userMetadata.avatar_url.trim()
      : ''
  if (metaAvatar.length > 0) return metaAvatar

  const metaPicture =
    typeof userMetadata?.picture === 'string'
      ? userMetadata.picture.trim()
      : ''
  if (metaPicture.length > 0) return metaPicture

  return null
}
