'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface NextSuggestion {
  groupSlug: string
  groupTitle: string
  subtopicTitle: string
  reason: 'finish_started' | 'start_new'
  studiedInGroup: number
  totalInGroup: number
}

/**
 * Sugere o próximo passo de estudo.
 * Regra: se há grupo em progresso (>0% e <100%), sugere terminá-lo —
 * devolve o primeiro subtópico não estudado desse grupo.
 * Senão, sugere iniciar um grupo com menor sort_order não iniciado.
 */
export function useNextSuggestion(userId: string | undefined) {
  const [suggestion, setSuggestion] = useState<NextSuggestion | null>(null)
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
        const [{ data: groups }, { data: topics }, { data: subtopics }, { data: progress }] = await Promise.all([
          supabase.from('content_groups').select('id, slug, title, sort_order').eq('visible', true).order('sort_order'),
          supabase.from('content_topics').select('id, group_id, sort_order').order('sort_order'),
          supabase.from('content_subtopics').select('id, topic_id, title, sort_order').order('sort_order'),
          supabase.from('user_content_progress').select('subtopic_id, content_type').eq('user_id', userId),
        ])

        if (!groups || groups.length === 0) {
          setLoading(false)
          return
        }

        const topicToGroup: Record<string, string> = {}
        ;(topics ?? []).forEach((t: { id: string; group_id: string }) => {
          topicToGroup[t.id] = t.group_id
        })

        const studiedIds = new Set<string>(
          (progress ?? []).map((p: { subtopic_id: string }) => p.subtopic_id)
        )

        // Agrupa subtópicos por group_id, preservando a ordem
        const subsByGroup: Record<string, Array<{ id: string; title: string }>> = {}
        ;(subtopics ?? []).forEach((s: { id: string; topic_id: string; title: string }) => {
          const gid = topicToGroup[s.topic_id]
          if (!gid) return
          if (!subsByGroup[gid]) subsByGroup[gid] = []
          subsByGroup[gid].push({ id: s.id, title: s.title })
        })

        type GroupStat = {
          id: string
          slug: string
          title: string
          studied: number
          total: number
          firstUnstudied: { id: string; title: string } | null
        }

        const stats: GroupStat[] = groups.map((g: { id: string; slug: string; title: string }) => {
          const subs = subsByGroup[g.id] ?? []
          const studied = subs.filter(s => studiedIds.has(s.id)).length
          const firstUnstudied = subs.find(s => !studiedIds.has(s.id)) ?? null
          return {
            id: g.id,
            slug: g.slug,
            title: g.title,
            studied,
            total: subs.length,
            firstUnstudied,
          }
        }).filter((s: GroupStat) => s.total > 0)

        // 1) Prioriza grupos em progresso — menor % completo mas com algum progresso
        const inProgress = stats.filter(s => s.studied > 0 && s.studied < s.total && s.firstUnstudied)
        if (inProgress.length > 0) {
          // o com mais progresso (mais perto de terminar)
          inProgress.sort((a, b) => (b.studied / b.total) - (a.studied / a.total))
          const pick = inProgress[0]
          setSuggestion({
            groupSlug: pick.slug,
            groupTitle: pick.title,
            subtopicTitle: pick.firstUnstudied!.title,
            reason: 'finish_started',
            studiedInGroup: pick.studied,
            totalInGroup: pick.total,
          })
          setLoading(false)
          return
        }

        // 2) Nenhum em progresso — pega o primeiro grupo não iniciado
        const notStarted = stats.find(s => s.studied === 0 && s.firstUnstudied)
        if (notStarted) {
          setSuggestion({
            groupSlug: notStarted.slug,
            groupTitle: notStarted.title,
            subtopicTitle: notStarted.firstUnstudied!.title,
            reason: 'start_new',
            studiedInGroup: 0,
            totalInGroup: notStarted.total,
          })
        }
      } catch {
        // degrada silenciosamente
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  return { suggestion, loading }
}
