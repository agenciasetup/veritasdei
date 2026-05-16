import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rowToSkin } from '@/features/rosario/skins/loadActiveSkin'
import type { RosarySkinCatalogItem } from '@/features/rosario/data/skinTypes'

/**
 *   GET /api/rosario/skins
 *
 * Retorna o catálogo de skins publicadas, anotado com o estado do
 * usuário atual: `owned` (já desbloqueada) e `equipped` (skin ativa).
 * Não autenticado também vê o catálogo, mas sem flags de propriedade.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: skins, error } = await supabase
    .from('rosary_skins')
    .select('*')
    .eq('status', 'published')
    .eq('visivel', true)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({
      skins: (skins ?? []).map((s) => ({
        ...rowToSkin(s as Record<string, unknown>),
        owned: false,
        equipped: false,
        unlocked_at: null,
        fonte: null,
      })) as RosarySkinCatalogItem[],
      authenticated: false,
    })
  }

  // Carrega coleção + skin ativa em paralelo
  const [{ data: owned }, { data: profile }] = await Promise.all([
    supabase
      .from('user_rosary_skins')
      .select('skin_id, unlocked_at, fonte')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('active_rosary_skin_id')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const ownedMap = new Map(
    (owned ?? []).map((r) => [
      r.skin_id as string,
      { unlocked_at: r.unlocked_at as string, fonte: r.fonte as string },
    ]),
  )
  const activeId = (profile?.active_rosary_skin_id as string | null) ?? null

  const items: RosarySkinCatalogItem[] = (skins ?? []).map((s) => {
    const skin = rowToSkin(s as Record<string, unknown>)
    const ownership = ownedMap.get(skin.id)
    return {
      ...skin,
      owned: !!ownership,
      equipped: skin.id === activeId,
      unlocked_at: ownership?.unlocked_at ?? null,
      fonte: (ownership?.fonte as RosarySkinCatalogItem['fonte']) ?? null,
    }
  })

  return NextResponse.json({ skins: items, authenticated: true })
}
