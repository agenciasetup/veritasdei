'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LastStudied {
  subtopicId: string
  subtopicTitle: string
  subtopicSlug: string | null
  groupSlug: string
  groupTitle: string
  groupCoverUrl: string | null
  groupCoverUrlMobile: string | null
  studiedAt: string
}

/**
 * Retorna o último subtópico que o usuário estudou, enriquecido com
 * o nome do subtópico e o grupo ao qual pertence.
 *
 * Antes: 4 round-trips sequenciais (user_content_progress → content_subtopics
 * → content_topics → content_groups). No 3G/4G médio do Brasil isso
 * gerava ~1.2s só pra renderizar o card "Continue de onde parou".
 *
 * Agora: 1 query com JOIN aninhado do PostgREST + cache em sessionStorage
 * com TTL curto (60s) — perceptivelmente instantâneo na navegação
 * dentro do EDUCA, sem ficar "preso" caso o admin altere algo.
 */

const CACHE_KEY = 'vd.educa.lastStudied.v2'
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
  // Hidratamos imediatamente do cache pra evitar o flash de "Sem progresso".
  const cached = userId ? readCache(userId) : null
  const [last, setLast] = useState<LastStudied | null>(cached?.value ?? null)
  const [loading, setLoading] = useState<boolean>(!cached || !cached.fresh)

  useEffect(() => {
    if (!userId) {
      setLast(null)
      setLoading(false)
      return
    }

    // Se temos cache fresco, não precisa nem disparar a query.
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
        // 1 round-trip com joins aninhados — PostgREST traduz pra um único
        // SELECT com LATERAL joins no Postgres.
        const { data } = await supabase
          .from('user_content_progress')
          .select(
            'subtopic_id, content_type, studied_at, content_subtopics!inner(id, slug, title, content_topics!inner(group_id, content_groups(slug, title, cover_url, cover_url_mobile)))',
          )
          .eq('user_id', userId!)
          .order('studied_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        if (!data) {
          writeCache(userId!, null)
          setLast(null)
          setLoading(false)
          return
        }

        // PostgREST pode devolver relações como array OU objeto dependendo
        // da cardinalidade inferida — normalizamos ambos.
        const subRaw = (data as { content_subtopics: unknown }).content_subtopics
        const sub = (Array.isArray(subRaw) ? subRaw[0] : subRaw) as
          | {
              id: string
              slug: string | null
              title: string
              content_topics:
                | {
                    group_id: string | null
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
                    group_id: string | null
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
          | undefined

        if (!sub) {
          writeCache(userId!, null)
          setLast(null)
          setLoading(false)
          return
        }

        const topicRaw = sub.content_topics
        const topic = Array.isArray(topicRaw) ? topicRaw[0] : topicRaw
        const groupRaw = topic?.content_groups
        const group = Array.isArray(groupRaw) ? groupRaw[0] : groupRaw

        const value: LastStudied = {
          subtopicId: sub.id,
          subtopicTitle: sub.title,
          subtopicSlug: sub.slug ?? null,
          groupSlug: group?.slug ?? (data as { content_type: string }).content_type,
          groupTitle: group?.title ?? (data as { content_type: string }).content_type,
          groupCoverUrl: group?.cover_url ?? null,
          groupCoverUrlMobile: group?.cover_url_mobile ?? null,
          studiedAt: (data as { studied_at: string }).studied_at,
        }

        writeCache(userId!, value)
        setLast(value)
      } catch {
        // degrada silenciosamente
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
