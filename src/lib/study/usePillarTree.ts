'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  ContentGroup,
  ContentSubtopic,
  ContentTopic,
} from '@/lib/content/useContentGroup'

export interface PillarTreeNode extends ContentTopic {
  subtopics: ContentSubtopic[]
}

export interface PillarTree {
  group: ContentGroup | null
  topics: PillarTreeNode[]
  /** Total de subtópicos em todo o pilar — usado para ProgressTrack honesto */
  totalSubtopics: number
  loading: boolean
}

/**
 * Cache em memória por slug — durante a sessão, navegar entre subtópicos
 * do mesmo pilar não refetch. Invalidado ao reload. Duas queries Supabase
 * (topics + subtopics IN topic_ids); items NÃO vêm aqui (ficam em
 * `useContentItems` do subtópico atual).
 */
const cache = new Map<string, { group: ContentGroup; topics: PillarTreeNode[] }>()

export function usePillarTree(pillarSlug: string): PillarTree {
  const [data, setData] = useState<{ group: ContentGroup; topics: PillarTreeNode[] } | null>(
    () => cache.get(pillarSlug) ?? null,
  )
  const [loading, setLoading] = useState(!cache.has(pillarSlug))

  useEffect(() => {
    const cached = cache.get(pillarSlug)
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data: groupRow } = await supabase
        .from('content_groups')
        .select('*')
        .eq('slug', pillarSlug)
        .eq('visible', true)
        .single()

      if (!groupRow) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data: topicRows } = await supabase
        .from('content_topics')
        .select('*')
        .eq('group_id', (groupRow as ContentGroup).id)
        .eq('visible', true)
        .order('sort_order')

      const topics = (topicRows as ContentTopic[]) ?? []
      const topicIds = topics.map((t) => t.id)

      let subtopicRows: ContentSubtopic[] = []
      if (topicIds.length > 0) {
        const { data: subRows } = await supabase
          .from('content_subtopics')
          .select('*')
          .in('topic_id', topicIds)
          .eq('visible', true)
          .order('sort_order')
        subtopicRows = (subRows as ContentSubtopic[]) ?? []
      }

      const subsByTopic: Record<string, ContentSubtopic[]> = {}
      for (const sub of subtopicRows) {
        if (!subsByTopic[sub.topic_id]) subsByTopic[sub.topic_id] = []
        subsByTopic[sub.topic_id].push(sub)
      }

      const tree: PillarTreeNode[] = topics.map((t) => ({
        ...t,
        subtopics: subsByTopic[t.id] ?? [],
      }))

      const payload = { group: groupRow as ContentGroup, topics: tree }
      cache.set(pillarSlug, payload)
      if (!cancelled) {
        setData(payload)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pillarSlug])

  const totalSubtopics = useMemo(() => {
    if (!data) return 0
    return data.topics.reduce((acc, t) => acc + t.subtopics.length, 0)
  }, [data])

  return {
    group: data?.group ?? null,
    topics: data?.topics ?? [],
    totalSubtopics,
    loading,
  }
}
