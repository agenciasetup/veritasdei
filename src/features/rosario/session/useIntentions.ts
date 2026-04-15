'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  RosaryIntention,
  RosaryIntentionDraft,
  RosaryIntentionPatch,
} from '@/features/rosario/data/historyTypes'

/**
 * Hook cliente que gerencia as intenções pessoais do usuário logado.
 *
 * Todas as chamadas são `fetch` contra os route handlers do sprint 2.2
 * (`/api/rosario/intentions` e `/api/rosario/intentions/[id]`), que fazem
 * a autenticação via cookie. Se o usuário não estiver logado, o fetch
 * responde 401 e o estado fica vazio com `available=false` — os
 * consumidores usam isso pra esconder a UI gentilmente.
 */

export type IntentionsStatus = 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error'

export interface UseIntentionsReturn {
  status: IntentionsStatus
  intentions: RosaryIntention[]
  /** `true` se o usuário está autenticado e o fetch inicial retornou. */
  available: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (draft: RosaryIntentionDraft) => Promise<RosaryIntention | null>
  update: (id: string, patch: RosaryIntentionPatch) => Promise<RosaryIntention | null>
  remove: (id: string) => Promise<boolean>
}

export function useIntentions(): UseIntentionsReturn {
  const [status, setStatus] = useState<IntentionsStatus>('idle')
  const [intentions, setIntentions] = useState<RosaryIntention[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/rosario/intentions', { method: 'GET' })
      if (res.status === 401) {
        setStatus('unauthenticated')
        setIntentions([])
        return
      }
      if (!res.ok) {
        setStatus('error')
        setError(`HTTP ${res.status}`)
        return
      }
      const data = (await res.json()) as { intentions: RosaryIntention[] }
      setIntentions(data.intentions ?? [])
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Falha ao carregar intenções')
    }
  }, [])

  useEffect(() => {
    // Deferimos para um microtask pra evitar que o `setStatus('loading')`
    // síncrono dentro de `refresh` dispare o aviso do React Compiler sobre
    // setState no corpo de um effect.
    const handle = queueMicrotask(() => {
      void refresh()
    })
    return () => {
      // queueMicrotask não tem cancel, mas o valor é undefined — mantemos
      // a referência pra satisfazer o lint e documentar a intenção.
      void handle
    }
  }, [refresh])

  const create = useCallback(
    async (draft: RosaryIntentionDraft): Promise<RosaryIntention | null> => {
      try {
        const res = await fetch('/api/rosario/intentions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(draft),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { intention: RosaryIntention }
        setIntentions((prev) => [data.intention, ...prev])
        return data.intention
      } catch {
        return null
      }
    },
    [],
  )

  const update = useCallback(
    async (id: string, patch: RosaryIntentionPatch): Promise<RosaryIntention | null> => {
      try {
        const res = await fetch(`/api/rosario/intentions/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { intention: RosaryIntention }
        setIntentions((prev) =>
          prev
            .map((i) => (i.id === id ? data.intention : i))
            .sort(sortIntentions),
        )
        return data.intention
      } catch {
        return null
      }
    },
    [],
  )

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/rosario/intentions/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) return false
      setIntentions((prev) => prev.filter((i) => i.id !== id))
      return true
    } catch {
      return false
    }
  }, [])

  return {
    status,
    intentions,
    available: status === 'ready',
    error,
    refresh,
    create,
    update,
    remove,
  }
}

function sortIntentions(a: RosaryIntention, b: RosaryIntention): number {
  // Não-arquivadas primeiro, depois por updated_at desc.
  if (a.arquivada !== b.arquivada) return a.arquivada ? 1 : -1
  return b.updated_at.localeCompare(a.updated_at)
}
