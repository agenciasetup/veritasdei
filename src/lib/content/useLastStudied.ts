'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LastStudied {
  subtopicId: string
  subtopicTitle: string
  subtopicSlug: string | null
  groupSlug: string
  groupTitle: string
  studiedAt: string
}

/**
 * Retorna o último subtópico que o usuário estudou, enriquecido com
 * o nome do subtópico e o grupo ao qual pertence. Usado pelo bloco
 * "Continue de onde parou" na página /mapa.
 */
export function useLastStudied(userId: string | undefined) {
  const [last, setLast] = useState<LastStudied | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function load() {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data: rows } = await supabase
          .from('user_content_progress')
          .select('subtopic_id, content_type, studied_at')
          .eq('user_id', userId)
          .order('studied_at', { ascending: false })
          .limit(1)

        const row = rows?.[0]
        if (!row) {
          setLoading(false)
          return
        }

        const { data: sub } = await supabase
          .from('content_subtopics')
          .select('id, slug, title, topic_id')
          .eq('id', row.subtopic_id)
          .maybeSingle()

        if (!sub) {
          setLoading(false)
          return
        }

        const { data: topic } = await supabase
          .from('content_topics')
          .select('group_id')
          .eq('id', sub.topic_id)
          .maybeSingle()

        const { data: group } = topic?.group_id
          ? await supabase
              .from('content_groups')
              .select('slug, title')
              .eq('id', topic.group_id)
              .maybeSingle()
          : { data: null }

        setLast({
          subtopicId: sub.id,
          subtopicTitle: sub.title,
          subtopicSlug: sub.slug ?? null,
          groupSlug: group?.slug ?? row.content_type,
          groupTitle: group?.title ?? row.content_type,
          studiedAt: row.studied_at,
        })
      } catch {
        // degrada silenciosamente
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  return { last, loading }
}
