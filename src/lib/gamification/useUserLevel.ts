'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Busca apenas o nível de um ou mais usuários (pra listas tipo feed/comentários).
 * Retorna um Map userId → level. Loading é implícito (vazio até terminar).
 *
 * Usa uma única query com `in` e cacheia no sessionStorage pra não refetch
 * durante navegação dentro da sessão.
 */
export function useUserLevels(userIds: string[]): Map<string, number> {
  const [levels, setLevels] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    if (userIds.length === 0) return
    const supabase = createClient()
    if (!supabase) return

    let cancelled = false
    const missing: string[] = []
    const cached = new Map<string, number>()

    for (const id of userIds) {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(`lvl:${id}`) : null
      if (raw) {
        cached.set(id, parseInt(raw, 10) || 1)
      } else {
        missing.push(id)
      }
    }

    if (cached.size > 0) setLevels(prev => new Map([...prev, ...cached]))

    if (missing.length === 0) return

    void (async () => {
      const { data } = await supabase
        .from('user_gamification')
        .select('user_id, current_level')
        .in('user_id', missing)

      if (cancelled || !data) return
      const next = new Map<string, number>(cached)
      for (const row of data as Array<{ user_id: string; current_level: number }>) {
        next.set(row.user_id, row.current_level)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`lvl:${row.user_id}`, String(row.current_level))
        }
      }
      for (const id of missing) {
        if (!next.has(id)) next.set(id, 1)
      }
      setLevels(prev => new Map([...prev, ...next]))
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(',')])

  return levels
}

export function useUserLevel(userId: string | undefined): number | null {
  const [level, setLevel] = useState<number | null>(null)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return

    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(`lvl:${userId}`) : null
    if (cached) {
      setLevel(parseInt(cached, 10) || 1)
      return
    }

    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from('user_gamification')
        .select('current_level')
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      const lvl = (data as { current_level: number } | null)?.current_level ?? 1
      setLevel(lvl)
      if (typeof window !== 'undefined') sessionStorage.setItem(`lvl:${userId}`, String(lvl))
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  return level
}
