/**
 * Helpers de leitura cacheada do EDUCA (server-only).
 *
 * Usa `unstable_cache` do Next pra deduplicar leituras públicas
 * (banners ativos, capas de pilares) entre requests do mesmo deploy.
 * Tags permitem revalidate manual após admin alterar (ver
 * `revalidateTag('educa:banners')`).
 *
 * Tudo via `createAdminClient()` porque os SELECTs aqui só leem
 * registros públicos (banners ativos, content_groups visíveis) — sem
 * RLS necessário e sem dependência de cookie do usuário, o que
 * permite cache.
 */
import { unstable_cache, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Carta } from '@/types/colecao'

const TAGS = {
  banners: 'educa:banners',
  pillars: 'educa:pillars',
} as const

export interface EducaBanner {
  id: string
  image_url: string
  image_url_mobile: string | null
  image_position: string | null
  image_position_mobile: string | null
  link_url: string | null
  title: string | null
  subtitle: string | null
}

export interface EducaPillar {
  id: string
  slug: string
  title: string
  cover_url: string | null
  cover_url_mobile: string | null
  cover_position: string | null
  cover_position_mobile: string | null
}

export const getActiveBanners = unstable_cache(
  async (): Promise<EducaBanner[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('educa_banners')
      .select(
        'id, image_url, image_url_mobile, image_position, image_position_mobile, link_url, title, subtitle',
      )
      .eq('ativo', true)
      .order('ordem', { ascending: true })
    if (error) {
      console.warn('[educa/server-data] banners error:', error.message)
      return []
    }
    return (data as EducaBanner[]) ?? []
  },
  ['educa-active-banners-v2'],
  { tags: [TAGS.banners], revalidate: 300 },
)

export const getPillars = unstable_cache(
  async (): Promise<EducaPillar[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('content_groups')
      .select(
        'id, slug, title, cover_url, cover_url_mobile, cover_position, cover_position_mobile',
      )
      .eq('visible', true)
      .order('sort_order')
    if (error) {
      console.warn('[educa/server-data] pillars error:', error.message)
      return []
    }
    return (data as EducaPillar[]) ?? []
  },
  ['educa-pillars-v2'],
  { tags: [TAGS.pillars], revalidate: 300 },
)

export type EducaSalesIntervalo = 'mensal' | 'semestral' | 'anual' | 'unico'

export interface EducaSalesPrice {
  id: string
  intervalo: EducaSalesIntervalo
  amountCents: number
}

/**
 * Preços ativos do plano `veritas-educa`, ordenados mensal → anual.
 * Usado pela página de venda (raiz do educa + /educa/assine).
 */
export const getEducaSalesPrices = unstable_cache(
  async (): Promise<EducaSalesPrice[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('billing_plans')
      .select('id, billing_prices(id, intervalo, amount_cents, ativo)')
      .eq('codigo', 'veritas-educa')
      .eq('ativo', true)
      .maybeSingle()
    if (error || !data) {
      if (error) console.warn('[educa/server-data] sales prices error:', error.message)
      return []
    }
    const ordem: Record<string, number> = {
      mensal: 1,
      semestral: 2,
      anual: 3,
      unico: 4,
    }
    type Row = { id: string; intervalo: string; amount_cents: number; ativo: boolean }
    return ((data.billing_prices ?? []) as Row[])
      .filter(p => p.ativo)
      .map(p => ({
        id: p.id,
        intervalo: p.intervalo as EducaSalesIntervalo,
        amountCents: p.amount_cents,
      }))
      .sort((a, b) => (ordem[a.intervalo] ?? 99) - (ordem[b.intervalo] ?? 99))
  },
  ['educa-sales-prices-v1'],
  { revalidate: 300 },
)

// ─── Pilares de estudo usados na seção "Estudar" da página de venda ─────

export interface EducaSalesTopico {
  id: string
  slug: string
  title: string
  subtitle: string | null
  coverUrl: string | null
  sortOrder: number
}

export interface EducaSalesPilar {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  icon: string | null
  coverUrl: string | null
  sortOrder: number
  topicos: EducaSalesTopico[]
}

/**
 * Lista os pilares de estudo visíveis (content_groups) + seus tópicos
 * (content_topics) — exatamente o que aparece em /estudo. Usado pela
 * landing pra montar a fileira Netflix da seção "Estudar".
 *
 * Não traz subtópicos/conteúdo: a landing só mostra o índice por pilar
 * pra deixar a pessoa antever o material. O acesso real ao texto fica
 * pro app pós-assinatura.
 */
export const getEducaSalesPilares = unstable_cache(
  async (): Promise<EducaSalesPilar[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('content_groups')
      .select(
        'id, slug, title, subtitle, description, icon, cover_url, sort_order, content_topics(id, slug, title, subtitle, cover_url, sort_order, visible)',
      )
      .eq('visible', true)
      .order('sort_order', { ascending: true })
    if (error || !data) {
      if (error) console.warn('[educa/server-data] pilares error:', error.message)
      return []
    }
    type RawTopic = {
      id: string
      slug: string
      title: string
      subtitle: string | null
      cover_url: string | null
      sort_order: number
      visible: boolean
    }
    type Raw = {
      id: string
      slug: string
      title: string
      subtitle: string | null
      description: string | null
      icon: string | null
      cover_url: string | null
      sort_order: number
      content_topics: RawTopic[] | null
    }
    return (data as Raw[]).map(g => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      subtitle: g.subtitle,
      description: g.description,
      icon: g.icon,
      coverUrl: g.cover_url,
      sortOrder: g.sort_order,
      topicos: (g.content_topics ?? [])
        .filter(t => t.visible)
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(t => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          subtitle: t.subtitle,
          coverUrl: t.cover_url,
          sortOrder: t.sort_order,
        })),
    }))
  },
  ['educa-sales-pilares-v1'],
  { revalidate: 300 },
)

// ─── Cartas em destaque na landing ────────────────────────────────────────

/**
 * Cartas em destaque na página de venda. Retorna a linha completa de
 * `public.cartas` (tipo `Carta` do /types/colecao) pra que a landing
 * possa renderizar com o componente real `<CartaView>` — mesma estética
 * da página /colecao.
 *
 * Escolha das cartas: admin marca `landing_featured = true` no CartaEditor.
 * Sem nenhuma marcada, fallback automático pega as 3 mais raras visíveis.
 */
export const getEducaSalesCartas = unstable_cache(
  async (): Promise<Carta[]> => {
    const supabase = createAdminClient()

    const { data: featured } = await supabase
      .from('cartas')
      .select('*')
      .eq('visivel', true)
      .eq('landing_featured', true)
      .order('landing_featured_order', { ascending: true, nullsFirst: false })
      .order('ordem', { ascending: true })
      .order('numero', { ascending: true })
      .limit(3)

    if (featured && featured.length > 0) {
      return featured as unknown as Carta[]
    }

    // Fallback: 3 mais raras visíveis (ORDER BY estrelas DESC, numero ASC).
    const { data: fallback } = await supabase
      .from('cartas')
      .select('*')
      .eq('visivel', true)
      .order('estrelas', { ascending: false })
      .order('numero', { ascending: true })
      .limit(3)

    return (fallback ?? []) as unknown as Carta[]
  },
  ['educa-sales-cartas-v2'],
  { revalidate: 300 },
)

// ─── Totais para os selos do hero ─────────────────────────────────────────

export interface EducaSalesTotals {
  pilares: number
  topicos: number
  subtopicos: number
  cartas: number
}

export const getEducaSalesTotals = unstable_cache(
  async (): Promise<EducaSalesTotals> => {
    const supabase = createAdminClient()
    const [pilares, topicos, subtopicos, cartas] = await Promise.all([
      supabase
        .from('content_groups')
        .select('id', { count: 'exact', head: true })
        .eq('visible', true),
      supabase
        .from('content_topics')
        .select('id', { count: 'exact', head: true })
        .eq('visible', true),
      supabase
        .from('content_subtopics')
        .select('id', { count: 'exact', head: true })
        .eq('visible', true),
      supabase
        .from('cartas')
        .select('id', { count: 'exact', head: true })
        .eq('visivel', true),
    ])
    return {
      pilares: pilares.count ?? 0,
      topicos: topicos.count ?? 0,
      subtopicos: subtopicos.count ?? 0,
      cartas: cartas.count ?? 0,
    }
  },
  ['educa-sales-totals-v1'],
  { revalidate: 300 },
)

export function revalidateEducaBanners() {
  // Next 16: 2º argumento exigido. `max` = stale-while-revalidate
  // (resposta instantânea com versão antiga, rebuild em background).
  revalidateTag(TAGS.banners, 'max')
}

export function revalidateEducaPillars() {
  revalidateTag(TAGS.pillars, 'max')
}
