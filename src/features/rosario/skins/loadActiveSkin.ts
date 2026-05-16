import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveTheme, type RosarySkin } from '@/features/rosario/data/skinTypes'

/**
 * Carrega a skin ativa do usuário (referenciada por
 * `profiles.active_rosary_skin_id`). Quando não há skin equipada ou a
 * referenciada não existe mais, cai pro `devocional-classico` (slug
 * conhecido da seed canônica). Quando nem essa existir (DB ainda não
 * migrado), retorna `null` — o caller usa o fallback hardcoded.
 *
 * Server-side only. Roda com cliente já autenticado.
 */
export async function loadActiveSkin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string | null,
): Promise<RosarySkin | null> {
  let skinRow: Record<string, unknown> | null = null

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_rosary_skin_id')
      .eq('id', userId)
      .maybeSingle()

    const activeId = profile?.active_rosary_skin_id as string | null | undefined
    if (activeId) {
      const { data: skin } = await supabase
        .from('rosary_skins')
        .select('*')
        .eq('id', activeId)
        .eq('status', 'published')
        .eq('visivel', true)
        .maybeSingle()
      skinRow = (skin as Record<string, unknown> | null) ?? null
    }
  }

  // Fallback: devocional-classico
  if (!skinRow) {
    const { data: defaultSkin } = await supabase
      .from('rosary_skins')
      .select('*')
      .eq('slug', 'devocional-classico')
      .eq('status', 'published')
      .maybeSingle()
    skinRow = (defaultSkin as Record<string, unknown> | null) ?? null
  }

  if (!skinRow) return null

  return rowToSkin(skinRow)
}

/**
 * Converte uma row do `rosary_skins` (PostgREST shape) num `RosarySkin`
 * já validado. Aplica fallbacks no theme.
 */
export function rowToSkin(row: Record<string, unknown>): RosarySkin {
  return {
    id: row.id as string,
    slug: row.slug as string,
    nome: row.nome as string,
    subtitulo: (row.subtitulo as string | null) ?? null,
    descricao: (row.descricao as string | null) ?? null,
    epigraph: (row.epigraph as string | null) ?? null,
    categoria: row.categoria as RosarySkin['categoria'],
    raridade: row.raridade as RosarySkin['raridade'],
    glyph: (row.glyph as string) ?? '✦',
    preview_url: (row.preview_url as string | null) ?? null,
    theme: resolveTheme(row.theme),
    mysteries: (row.mysteries as RosarySkin['mysteries']) ?? null,
    base_mystery_set: (row.base_mystery_set as RosarySkin['base_mystery_set']) ?? null,
    unlock_tipo: row.unlock_tipo as RosarySkin['unlock_tipo'],
    unlock_regras: (row.unlock_regras as RosarySkin['unlock_regras']) ?? {
      operador: 'todas',
      condicoes: [],
    },
    unlock_label: (row.unlock_label as string | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    preco_cents: (row.preco_cents as number) ?? 0,
    ordem: (row.ordem as number) ?? 0,
    visivel: (row.visivel as boolean) ?? true,
    status: row.status as RosarySkin['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}
