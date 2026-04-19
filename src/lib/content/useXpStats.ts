'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface XpStats {
  totalXp: number
  level: number
  xpInLevel: number
  xpToNextLevel: number
  percentInLevel: number
  totalStudied: number
}

const XP_PER_SUBTOPIC = 10
const XP_PER_LEVEL = 100

/**
 * Calcula XP total e nível a partir de user_content_progress.
 * Cada subtópico estudado vale 10 XP. Cada 100 XP = 1 nível.
 * Sem tabela adicional — tudo derivado.
 */
export function useXpStats(userId: string | undefined) {
  const [stats, setStats] = useState<XpStats>({
    totalXp: 0,
    level: 1,
    xpInLevel: 0,
    xpToNextLevel: XP_PER_LEVEL,
    percentInLevel: 0,
    totalStudied: 0,
  })
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
        const { count } = await supabase
          .from('user_content_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        const totalStudied = count ?? 0
        const totalXp = totalStudied * XP_PER_SUBTOPIC
        const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
        const xpInLevel = totalXp % XP_PER_LEVEL
        const xpToNextLevel = XP_PER_LEVEL - xpInLevel
        const percentInLevel = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

        setStats({ totalXp, level, xpInLevel, xpToNextLevel, percentInLevel, totalStudied })
      } catch {
        // degrada silenciosamente
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  return { ...stats, loading }
}
