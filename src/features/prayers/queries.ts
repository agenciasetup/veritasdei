import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PrayerItem } from './types'

const GROUP_SLUG = 'oracoes'

// ───────────────────────────── shapes ─────────────────────────────

type ContentItemRow = {
  id: string
  slug: string | null
  title: string | null
  latin_title: string | null
  body: string
  latin_body: string | null
  reference: string | null
  keywords: string[] | null
  meta_description: string | null
  indulgence_note: string | null
  scripture_refs: string[] | null
  audio_url: string | null
  video_url: string | null
  icon_name: string | null
  image_url: string | null
  sort_order: number
  visible: boolean
}

type JoinedRow = ContentItemRow & {
  subtopic: {
    slug: string
    title: string | null
    topic: {
      slug: string
      title: string | null
    } | null
  } | null
}

export type PrayerSummary = {
  id: string
  slug: string
  title: string
  latinTitle: string | null
  subtopicSlug: string
  subtopicTitle: string
  topicSlug: string
  topicTitle: string
  iconName: string | null
  metaDescription: string | null
}

export type TopicWithSubtopics = {
  slug: string
  title: string
  subtitle: string | null
  icon: string | null
  sortOrder: number
  subtopics: Array<{
    slug: string
    title: string
    subtitle: string | null
    sortOrder: number
    items: PrayerSummary[]
  }>
}

// ────────────────────────── transforms ───────────────────────────

function toPrayerItem(row: JoinedRow): PrayerItem {
  const sub = row.subtopic ?? null
  const top = sub?.topic ?? null
  return {
    id: row.id,
    slug: row.slug ?? '',
    title: row.title ?? '',
    latinTitle: row.latin_title,
    body: row.body,
    latinBody: row.latin_body,
    reference: row.reference,
    keywords: row.keywords ?? [],
    metaDescription: row.meta_description,
    scriptureRefs: row.scripture_refs ?? [],
    indulgenceNote: row.indulgence_note,
    audioUrl: row.audio_url,
    videoUrl: row.video_url,
    iconName: row.icon_name,
    imageUrl: row.image_url,
    subtopic: { slug: sub?.slug ?? '', title: sub?.title ?? '' },
    topic: { slug: top?.slug ?? '', title: top?.title ?? '' },
  }
}

function toSummary(row: JoinedRow): PrayerSummary {
  const sub = row.subtopic
  const top = sub?.topic
  return {
    id: row.id,
    slug: row.slug ?? '',
    title: row.title ?? '',
    latinTitle: row.latin_title,
    subtopicSlug: sub?.slug ?? '',
    subtopicTitle: sub?.title ?? '',
    topicSlug: top?.slug ?? '',
    topicTitle: top?.title ?? '',
    iconName: row.icon_name,
    metaDescription: row.meta_description,
  }
}

// ───────────────────────────── queries ────────────────────────────

/**
 * Busca uma oração pelo slug. Retorna null se não existe ou não visível.
 */
export async function fetchPrayerBySlug(slug: string): Promise<PrayerItem | null> {
  if (!slug) return null
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id, slug, title, latin_title, body, latin_body, reference, keywords,
      meta_description, indulgence_note, scripture_refs, audio_url, video_url,
      icon_name, image_url, sort_order, visible,
      subtopic:content_subtopics!inner (
        slug, title,
        topic:content_topics!inner (
          slug, title,
          group:content_groups!inner ( slug )
        )
      )
    `)
    .eq('slug', slug)
    .eq('visible', true)
    .eq('subtopic.topic.group.slug', GROUP_SLUG)
    .maybeSingle<JoinedRow & { subtopic: { slug: string; title: string | null; topic: { slug: string; title: string | null; group: { slug: string } } } }>()

  if (error || !data) return null
  return toPrayerItem(data as unknown as JoinedRow)
}

/**
 * Árvore completa da biblioteca: topics → subtopics → items (summary).
 * Usada no /oracoes index + /oracoes/categoria/[topicSlug].
 */
export async function fetchLibraryTree(): Promise<TopicWithSubtopics[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('content_topics')
    .select(`
      slug, title, subtitle, icon, sort_order,
      group:content_groups!inner ( slug ),
      subtopics:content_subtopics (
        slug, title, subtitle, sort_order, visible,
        items:content_items (
          id, slug, title, latin_title, icon_name, meta_description,
          sort_order, visible
        )
      )
    `)
    .eq('group.slug', GROUP_SLUG)
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  return (data as unknown as Array<{
    slug: string
    title: string | null
    subtitle: string | null
    icon: string | null
    sort_order: number
    subtopics: Array<{
      slug: string
      title: string | null
      subtitle: string | null
      sort_order: number
      visible: boolean
      items: Array<{
        id: string
        slug: string | null
        title: string | null
        latin_title: string | null
        icon_name: string | null
        meta_description: string | null
        sort_order: number
        visible: boolean
      }>
    }>
  }>).map(t => ({
    slug: t.slug,
    title: t.title ?? '',
    subtitle: t.subtitle,
    icon: t.icon,
    sortOrder: t.sort_order,
    subtopics: (t.subtopics ?? [])
      .filter(s => s.visible)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({
        slug: s.slug,
        title: s.title ?? '',
        subtitle: s.subtitle,
        sortOrder: s.sort_order,
        items: (s.items ?? [])
          .filter(i => i.visible && i.slug)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(i => ({
            id: i.id,
            slug: i.slug ?? '',
            title: i.title ?? '',
            latinTitle: i.latin_title,
            subtopicSlug: s.slug,
            subtopicTitle: s.title ?? '',
            topicSlug: t.slug,
            topicTitle: t.title ?? '',
            iconName: i.icon_name,
            metaDescription: i.meta_description,
          })),
      })),
  }))
}

/**
 * Lista os subtopics + items de UM topic específico (ex: 'dia-a-dia').
 */
export async function fetchTopic(topicSlug: string): Promise<TopicWithSubtopics | null> {
  const tree = await fetchLibraryTree()
  return tree.find(t => t.slug === topicSlug) ?? null
}

/**
 * Favoritos do usuário logado (os 10 mais recentes por padrão).
 * Devolve [] se não logado.
 */
export async function fetchUserFavorites(limit = 10): Promise<PrayerSummary[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('prayer_favorites')
    .select(`
      created_at,
      item:content_items!inner (
        id, slug, title, latin_title, icon_name, meta_description,
        visible,
        subtopic:content_subtopics!inner (
          slug, title,
          topic:content_topics!inner ( slug, title )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as unknown as Array<{
    item: JoinedRow & {
      subtopic: { slug: string; title: string | null; topic: { slug: string; title: string | null } }
    }
  }>)
    .filter(row => row.item.visible && row.item.slug)
    .map(row => toSummary(row.item))
}

/**
 * Checa se um item específico está favoritado pelo usuário atual.
 */
export async function isFavorited(itemId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('prayer_favorites')
    .select('item_id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()
  return !!data
}

/**
 * Próxima/anterior no mesmo subtopic — pro footer de navegação
 * da página individual.
 */
export async function fetchSiblings(slug: string): Promise<{
  prev: PrayerSummary | null
  next: PrayerSummary | null
}> {
  if (!slug) return { prev: null, next: null }
  const tree = await fetchLibraryTree()
  for (const t of tree) {
    for (const s of t.subtopics) {
      const idx = s.items.findIndex(i => i.slug === slug)
      if (idx === -1) continue
      return {
        prev: idx > 0 ? s.items[idx - 1] : null,
        next: idx < s.items.length - 1 ? s.items[idx + 1] : null,
      }
    }
  }
  return { prev: null, next: null }
}

/**
 * Busca textual usando a RPC search_prayers (trigger-based tsvector).
 * Server-side para SSR dos resultados iniciais.
 */
export async function searchPrayers(q: string): Promise<Array<{
  id: string
  slug: string
  title: string
  subtitle: string
  snippet: string
  rank: number
  iconName: string | null
}>> {
  const query = q.trim()
  if (!query || query.length < 2) return []
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_prayers', {
    q: query,
    group_slug: GROUP_SLUG,
  })
  if (error || !data) return []
  return (data as Array<{
    id: string
    slug: string
    title: string
    subtitle: string
    snippet: string
    rank: number
    icon_name: string | null
  }>).map(r => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    snippet: r.snippet,
    rank: r.rank,
    iconName: r.icon_name,
  }))
}
