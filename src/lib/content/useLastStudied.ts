'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LastStudied {
  subtopicId: string
  subtopicTitle: string
  subtopicSlug: string | null
  subtopicCoverUrl: string | null
  subtopicCoverUrlMobile: string | null
  topicSlug: string | null
  topicTitle: string | null
  topicCoverUrl: string | null
  topicCoverUrlMobile: string | null
  groupSlug: string
  groupTitle: string
  groupCoverUrl: string | null
  groupCoverUrlMobile: string | null
  studiedAt: string
}

/**
 * Retorna o último subtópico que o usuário estudou, enriquecido com
 * o subtópico, tópico e grupo aos quais pertence (cada um com sua cover).
 *
 * Estratégia de query em 2 passos (mais resiliente que o JOIN aninhado
 * com !inner que tínhamos antes — se qualquer coluna nova não existir
 * em produção, o JOIN inteiro falhava silenciosamente e o card "Continue"
 * sumia):
 *
 *   1. user_content_progress (sem joins) → última entrada do user
 *   2. content_subtopics + relacionados → enriquecimento
 *
 * Se o passo 2 falhar, ainda devolvemos o passo 1 com `content_type` como
 * groupSlug (não perde a navegação, só fica sem capa/título bonito).
 */

const CACHE_KEY = 'vd.educa.lastStudied.v3'
const CACHE_TTL_MS = 60_000

interface CacheEntry {
  userId: string
  at: number
  value: LastStudied | null
}

function readCache(userId: string): { value: LastStudied | null; fresh: boolean } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed || parsed.userId !== userId) return null
    const fresh = Date.now() - parsed.at < CACHE_TTL_MS
    return { value: parsed.value, fresh }
  } catch {
    return null
  }
}

function writeCache(userId: string, value: LastStudied | null) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ userId, at: Date.now(), value } satisfies CacheEntry),
    )
  } catch {
    /* ignore */
  }
}

export function useLastStudied(userId: string | undefined) {
  const cached = userId ? readCache(userId) : null
  const [last, setLast] = useState<LastStudied | null>(cached?.value ?? null)
  const [loading, setLoading] = useState<boolean>(!cached || !cached.fresh)

  useEffect(() => {
    if (!userId) {
      setLast(null)
      setLoading(false)
      return
    }

    const c = readCache(userId)
    if (c?.fresh) {
      setLast(c.value)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // PASSO 1 — entrada mais recente, sem joins (resiliente a colunas
        // ausentes em joined tables).
        const { data: progress } = await supabase
          .from('user_content_progress')
          .select('subtopic_id, content_type, studied_at')
          .eq('user_id', userId!)
          .order('studied_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        if (!progress) {
          writeCache(userId!, null)
          setLast(null)
          setLoading(false)
          return
        }

        const p = progress as {
          subtopic_id: string
          content_type: string
          studied_at: string
        }

        // Fallback "esqueleto" — usa só dados do progresso. Aplicamos
        // imediatamente pra dar resposta rápida (sem flash de empty state)
        // e refinamos com o enriquecimento embaixo se vier.
        const skeleton: LastStudied = {
          subtopicId: p.subtopic_id,
          subtopicTitle: p.subtopic_id,
          subtopicSlug: null,
          subtopicCoverUrl: null,
          subtopicCoverUrlMobile: null,
          topicSlug: null,
          topicTitle: null,
          topicCoverUrl: null,
          topicCoverUrlMobile: null,
          groupSlug: p.content_type,
          groupTitle: p.content_type,
          groupCoverUrl: null,
          groupCoverUrlMobile: null,
          studiedAt: p.studied_at,
        }

        // PASSO 2 — enriquece com subtopic + topic + group em uma query.
        // Sem !inner pra não cancelar tudo se algum nível faltar.
        let enriched = skeleton
        try {
          const { data: sub } = await supabase
            .from('content_subtopics')
            .select(
              'id, slug, title, cover_url, cover_url_mobile, content_topics(slug, title, cover_url, cover_url_mobile, content_groups(slug, title, cover_url, cover_url_mobile))',
            )
            .eq('id', p.subtopic_id)
            .maybeSingle()

          if (sub) {
            const subRow = sub as {
              id: string
              slug: string | null
              title: string
              cover_url: string | null
              cover_url_mobile: string | null
              content_topics:
                | {
                    slug: string | null
                    title: string | null
                    cover_url: string | null
                    cover_url_mobile: string | null
                    content_groups:
                      | {
                          slug: string
                          title: string
                          cover_url: string | null
                          cover_url_mobile: string | null
                        }
                      | {
                          slug: string
                          title: string
                          cover_url: string | null
                          cover_url_mobile: string | null
                        }[]
                      | null
                  }
                | {
                    slug: string | null
                    title: string | null
                    cover_url: string | null
                    cover_url_mobile: string | null
                    content_groups:
                      | {
                          slug: string
                          title: string
                          cover_url: string | null
                          cover_url_mobile: string | null
                        }
                      | {
                          slug: string
                          title: string
                          cover_url: string | null
                          cover_url_mobile: string | null
                        }[]
                      | null
                  }[]
                | null
            }
            const topicRaw = subRow.content_topics
            const topic = Array.isArray(topicRaw) ? topicRaw[0] : topicRaw
            const groupRaw = topic?.content_groups
            const group = Array.isArray(groupRaw) ? groupRaw[0] : groupRaw

            enriched = {
              subtopicId: subRow.id,
              subtopicTitle: subRow.title,
              subtopicSlug: subRow.slug ?? null,
              subtopicCoverUrl: subRow.cover_url ?? null,
              subtopicCoverUrlMobile: subRow.cover_url_mobile ?? null,
              topicSlug: topic?.slug ?? null,
              topicTitle: topic?.title ?? null,
              topicCoverUrl: topic?.cover_url ?? null,
              topicCoverUrlMobile: topic?.cover_url_mobile ?? null,
              groupSlug: group?.slug ?? p.content_type,
              groupTitle: group?.title ?? p.content_type,
              groupCoverUrl: group?.cover_url ?? null,
              groupCoverUrlMobile: group?.cover_url_mobile ?? null,
              studiedAt: p.studied_at,
            }
          }
        } catch {
          // mantém skeleton — degradação ainda gracosa.
        }

        if (cancelled) return
        writeCache(userId!, enriched)
        setLast(enriched)
      } catch {
        // erro fatal no passo 1 — não cacheia null pra permitir retry depois.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  return { last, loading }
}
