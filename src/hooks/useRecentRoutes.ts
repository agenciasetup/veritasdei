'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Rastreamento leve dos últimos destinos navegados pelo usuário.
 * Usado em hubs para mostrar "Recentemente acessado".
 *
 * Persistido em localStorage. Não sincroniza com servidor.
 */

const KEY = 'veritasdei:recent-routes'
const MAX = 6

export interface RecentRoute {
  href: string
  label: string
  /** Epoch ms */
  at: number
}

function load(): RecentRoute[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentRoute[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX)
  } catch {
    return []
  }
}

function save(list: RecentRoute[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {}
}

export function useRecentRoutes(): {
  recents: RecentRoute[]
  track: (href: string, label: string) => void
  clear: () => void
} {
  const [recents, setRecents] = useState<RecentRoute[]>(() => load())

  // Mantém a lista em sincronia entre múltiplas abas
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setRecents(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const track = useCallback((href: string, label: string) => {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.href !== href)
      const next = [{ href, label, at: Date.now() }, ...filtered].slice(0, MAX)
      save(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setRecents([])
    save([])
  }, [])

  return { recents, track, clear }
}
