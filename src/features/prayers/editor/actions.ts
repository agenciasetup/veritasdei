'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Server actions do editor. Usadas só pra operações que precisam
 * rodar no server (revalidatePath não funciona em client).
 * A escrita de body/meta continua acontecendo client-side via
 * supabase browser client — rápido e suficiente (RLS garante).
 */

async function requireAdmin(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  if (!profile || profile.role !== 'admin') return null
  return user.id
}

/**
 * Invalida o cache da página pública após salvar ou (des)publicar.
 * Chamada pelo editor depois de um save bem-sucedido.
 */
export async function revalidatePrayerRoute(slug: string | null): Promise<void> {
  if (!slug) return
  const adminId = await requireAdmin()
  if (!adminId) return
  revalidatePath(`/oracoes/${slug}`)
  revalidatePath('/oracoes')
  revalidatePath('/sitemap.xml')
}

/**
 * Alterna visible da oração. Retorna o novo valor ou null em falha.
 */
export async function togglePrayerVisibility(
  prayerId: string
): Promise<{ visible: boolean; slug: string | null } | null> {
  const adminId = await requireAdmin()
  if (!adminId) return null
  const supabase = await createServerSupabaseClient()

  const { data: current } = await supabase
    .from('content_items')
    .select('visible, slug')
    .eq('id', prayerId)
    .maybeSingle<{ visible: boolean; slug: string | null }>()

  if (!current) return null

  const next = !current.visible
  const { error } = await supabase
    .from('content_items')
    .update({
      visible: next,
      updated_at: new Date().toISOString(),
    })
    .eq('id', prayerId)

  if (error) return null

  if (current.slug) {
    revalidatePath(`/oracoes/${current.slug}`)
    revalidatePath('/oracoes')
    revalidatePath('/sitemap.xml')
  }

  return { visible: next, slug: current.slug }
}
