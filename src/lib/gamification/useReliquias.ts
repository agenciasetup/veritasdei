'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reliquia } from '@/types/gamification'

export interface ReliquiasState {
  catalog: Reliquia[]
  unlockedIds: Set<string>
  equippedId: string | null
  loading: boolean
  equip: (reliquiaId: string | null) => Promise<void>
  reload: () => Promise<void>
}

/**
 * Carrega o catálogo completo de relíquias (visíveis) + quais o usuário
 * desbloqueou + qual está equipada. Expõe `equip()` pra trocar a equipada.
 */
export function useReliquias(userId: string | undefined): ReliquiasState {
  const [catalog, setCatalog] = useState<Reliquia[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [equippedId, setEquippedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const catalogRes = await supabase
        .from('reliquias')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true })

      setCatalog((catalogRes.data as Reliquia[] | null) ?? [])

      if (userId) {
        const [unlockedRes, gamiRes] = await Promise.all([
          supabase
            .from('user_reliquias')
            .select('reliquia_id')
            .eq('user_id', userId),
          supabase
            .from('user_gamification')
            .select('equipped_reliquia_id')
            .eq('user_id', userId)
            .maybeSingle(),
        ])
        setUnlockedIds(
          new Set(
            (unlockedRes.data ?? []).map(
              (r: { reliquia_id: string }) => r.reliquia_id,
            ),
          ),
        )
        setEquippedId(
          (gamiRes.data as { equipped_reliquia_id: string | null } | null)
            ?.equipped_reliquia_id ?? null,
        )
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

  const equip = useCallback(
    async (reliquiaId: string | null) => {
      if (!userId) return
      const supabase = createClient()
      if (!supabase) return

      // Rejeita se tentar equipar algo que não desbloqueou
      if (reliquiaId && !unlockedIds.has(reliquiaId)) return

      const prev = equippedId
      setEquippedId(reliquiaId) // optimistic

      const { error } = await supabase
        .from('user_gamification')
        .upsert({ user_id: userId, equipped_reliquia_id: reliquiaId })

      if (error) setEquippedId(prev)
    },
    [userId, unlockedIds, equippedId],
  )

  return {
    catalog,
    unlockedIds,
    equippedId,
    loading,
    equip,
    reload: load,
  }
}
