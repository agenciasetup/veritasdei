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

// ─── Trilhas usadas na seção "Estudar" da página de venda ─────────────────

export interface EducaSalesTrailStep {
  label: string
  description: string | null
  sortOrder: number
}

export interface EducaSalesTrail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  difficulty: string
  color: string
  iconName: string
  sortOrder: number
  coverUrl: string | null
  steps: EducaSalesTrailStep[]
}

/**
 * Lista todas as trilhas + seus steps (label/descrição, sem o conteúdo
 * completo) pra montar a seção Estudar da landing.
 */
export const getEducaSalesTrails = unstable_cache(
  async (): Promise<EducaSalesTrail[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('trails')
      .select(
        'id, title, subtitle, description, difficulty, color, icon_name, sort_order, cover_url, trail_steps(label, description, sort_order)',
      )
      .order('sort_order', { ascending: true })
    if (error || !data) {
      if (error) console.warn('[educa/server-data] trails error:', error.message)
      return []
    }
    type RawStep = { label: string; description: string | null; sort_order: number }
    type Raw = {
      id: string
      title: string
      subtitle: string | null
      description: string | null
      difficulty: string
      color: string
      icon_name: string
      sort_order: number
      cover_url: string | null
      trail_steps: RawStep[] | null
    }
    return (data as Raw[]).map(t => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
      difficulty: t.difficulty,
      color: t.color,
      iconName: t.icon_name,
      sortOrder: t.sort_order,
      coverUrl: t.cover_url,
      steps: (t.trail_steps ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(s => ({
          label: s.label,
          description: s.description,
          sortOrder: s.sort_order,
        })),
    }))
  },
  ['educa-sales-trails-v1'],
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
