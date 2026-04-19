'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AchievementTier = 'iniciante' | 'metade' | 'mestre'

export interface Achievement {
  id: string              // {groupSlug}-{tier}
  groupSlug: string
  groupTitle: string
  tier: AchievementTier
  label: string           // "Iniciante em Dogmas"
  unlocked: boolean
  studied: number
  total: number
  threshold: number       // quantos subtópicos precisava estudar
}

const TIER_LABEL: Record<AchievementTier, string> = {
  iniciante: 'Iniciante',
  metade: 'Metade',
  mestre: 'Mestre',
}

/**
 * Calcula todas as conquistas (3 tiers × N pilares) baseado em
 * quantos subtópicos o usuário estudou em cada grupo.
 *
 * Regras por grupo:
 *  - Iniciante: estudou >= 1 subtópico
 *  - Metade:    estudou >= 50% dos subtópicos
 *  - Mestre:    estudou 100%
 */
export function useAchievements(userId: string | undefined) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
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
          supabase.from('content_groups').select('id, slug, title').eq('visible', true).order('sort_order'),
          supabase.from('content_topics').select('id, group_id'),
          supabase.from('content_subtopics').select('id, topic_id'),
          supabase.from('user_content_progress').select('subtopic_id').eq('user_id', userId),
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

        const subsPerGroup: Record<string, { total: number; studied: number }> = {}
        ;(subtopics ?? []).forEach((s: { id: string; topic_id: string }) => {
          const gid = topicToGroup[s.topic_id]
          if (!gid) return
          if (!subsPerGroup[gid]) subsPerGroup[gid] = { total: 0, studied: 0 }
          subsPerGroup[gid].total++
          if (studiedIds.has(s.id)) subsPerGroup[gid].studied++
        })

        const result: Achievement[] = []
        for (const g of groups as Array<{ id: string; slug: string; title: string }>) {
          const stat = subsPerGroup[g.id] ?? { total: 0, studied: 0 }
          if (stat.total === 0) continue

          const halfThreshold = Math.max(1, Math.ceil(stat.total / 2))

          const tiers: Array<{ tier: AchievementTier; threshold: number }> = [
            { tier: 'iniciante', threshold: 1 },
            { tier: 'metade', threshold: halfThreshold },
            { tier: 'mestre', threshold: stat.total },
          ]

          tiers.forEach(({ tier, threshold }) => {
            result.push({
              id: `${g.slug}-${tier}`,
              groupSlug: g.slug,
              groupTitle: g.title,
              tier,
              label: `${TIER_LABEL[tier]} em ${g.title}`,
              unlocked: stat.studied >= threshold,
              studied: stat.studied,
              total: stat.total,
              threshold,
            })
          })
        }

        setAchievements(result)
      } catch {
        // degrada silenciosamente
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length

  return { achievements, unlockedCount, totalCount, loading }
}
