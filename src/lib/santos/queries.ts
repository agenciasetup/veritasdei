import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SantoDetalhe, SantoOracao, SantoResumo } from '@/types/santo'

const RESUMO_COLUMNS = 'id, slug, nome, invocacao, patronatos, imagem_url, popularidade_rank, festa_texto, tipo_culto'
const DETALHE_COLUMNS = `
  id, slug, nome, invocacao, patronatos, imagem_url, popularidade_rank, festa_texto, tipo_culto,
  nomes_alternativos, oracao_curta, biografia_curta, descricao, martir, familia_religiosa,
  nascimento_local, nascimento_pais, nascimento_data,
  morte_local, morte_pais, morte_data,
  canonizacao_data, canonizado_por, beatificacao_data, beatificado_por,
  oracao_principal_item_id
`.replace(/\s+/g, ' ').trim()

export async function getTop30Santos(): Promise<SantoResumo[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('santos')
    .select(RESUMO_COLUMNS)
    .not('popularidade_rank', 'is', null)
    .order('popularidade_rank', { ascending: true })
    .limit(30)

  if (error) {
    console.error('[santos] getTop30Santos error', error)
    return []
  }
  return (data ?? []) as SantoResumo[]
}

export async function getSantoBySlug(slug: string): Promise<SantoDetalhe | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('santos')
    .select(DETALHE_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[santos] getSantoBySlug error', error)
    return null
  }
  return (data as SantoDetalhe | null) ?? null
}

export async function getSantoById(id: string): Promise<SantoResumo | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('santos')
    .select(RESUMO_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[santos] getSantoById error', error)
    return null
  }
  return (data as SantoResumo | null) ?? null
}

export async function getSantoDevotosCount(santoId: string): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('santo_devocao_id', santoId)

  if (error) {
    console.error('[santos] getSantoDevotosCount error', error)
    return 0
  }
  return count ?? 0
}

export async function getSantoOracoes(santoId: string): Promise<SantoOracao[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('santo_oracoes')
    .select(`
      content_item_id,
      tipo,
      sort_order,
      content_items:content_item_id (
        slug, title, body
      )
    `)
    .eq('santo_id', santoId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[santos] getSantoOracoes error', error)
    return []
  }

  type Row = {
    content_item_id: string
    tipo: SantoOracao['tipo']
    sort_order: number
    content_items:
      | { slug: string | null; title: string | null; body: string }
      | Array<{ slug: string | null; title: string | null; body: string }>
      | null
  }

  return ((data as unknown as Row[] | null) ?? [])
    .map(r => {
      const ci = Array.isArray(r.content_items) ? r.content_items[0] : r.content_items
      if (!ci || !ci.slug || !ci.title) return null
      return {
        content_item_id: r.content_item_id,
        tipo: r.tipo,
        sort_order: r.sort_order,
        slug: ci.slug,
        title: ci.title,
        body: ci.body,
      }
    })
    .filter((x): x is SantoOracao => x !== null)
}

export async function searchSantos(query: string, limit = 20): Promise<SantoResumo[]> {
  const supabase = await createServerSupabaseClient()
  const q = query.trim()
  if (q.length < 2) return []

  const { data, error } = await supabase.rpc('search_santos', { q, max_results: limit })

  if (error) {
    console.error('[santos] searchSantos RPC error, falling back to ilike', error)
    const { data: fallback } = await supabase
      .from('santos')
      .select(RESUMO_COLUMNS)
      .ilike('nome', `%${q}%`)
      .order('popularidade_rank', { ascending: true, nullsFirst: false })
      .limit(limit)
    return (fallback ?? []) as SantoResumo[]
  }
  return (data ?? []) as SantoResumo[]
}
