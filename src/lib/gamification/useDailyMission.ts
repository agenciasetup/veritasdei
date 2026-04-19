'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyMission, MissionType } from '@/types/gamification'

function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DEFAULT_MISSION: { type: MissionType; target: number; xp: number } = {
  type: 'study_subtopic',
  target: 1,
  xp: 20,
}

/**
 * Missão do dia. Se não existir pro dia de hoje, cria. Retorna a atual e
 * permite "claim" (marcar recompensa como resgatada).
 */
export function useDailyMission(userId: string | undefined) {
  const [mission, setMission] = useState<DailyMission | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const today = todayStr()
    try {
      // Tenta pegar a missão de hoje
      const { data } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_date', today)
        .eq('mission_type', DEFAULT_MISSION.type)
        .maybeSingle()

      if (data) {
        setMission(data as DailyMission)
      } else {
        // Cria missão padrão do dia
        const { data: created } = await supabase
          .from('daily_missions')
          .insert({
            user_id: userId,
            mission_date: today,
            mission_type: DEFAULT_MISSION.type,
            target: DEFAULT_MISSION.target,
            xp_reward: DEFAULT_MISSION.xp,
          })
          .select('*')
          .maybeSingle()
        setMission((created as DailyMission | null) ?? null)
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const claim = useCallback(async () => {
    if (!mission || !userId || !mission.completed || mission.claimed) return
    const supabase = createClient()
    if (!supabase) return
    const { error } = await supabase
      .from('daily_missions')
      .update({ claimed: true })
      .eq('user_id', userId)
      .eq('mission_date', mission.mission_date)
      .eq('mission_type', mission.mission_type)
    if (!error) {
      setMission({ ...mission, claimed: true })
    }
  }, [mission, userId])

  return { mission, loading, claim, reload: load }
}
