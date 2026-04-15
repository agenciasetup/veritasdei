'use client'

import { useCallback } from 'react'
import type { MysterySet } from '@/features/rosario/data/types'

/**
 * Wrapper tipado sobre `fetch('/api/rosario/sessions', { method: 'POST' })`.
 *
 * A gravação do histórico é **best-effort**:
 *   - Se o usuário não estiver autenticado (401), engole o erro — o terço
 *     continua funcionando 100% offline / sem conta.
 *   - Se a rede falhar, engole o erro — a sessão fica registrada apenas no
 *     localStorage (sprint 1.6), sem tentar retry automático. Tentativas
 *     de retry ficam fora do escopo deste sprint.
 *
 * A responsabilidade de saber **quando** chamar (exatamente uma vez por
 * conclusão) fica no consumidor — ver `RosarySession`.
 */

export interface RecordSessionInput {
  mystery_set: MysterySet
  intention_id?: string | null
  sala_id?: string | null
  started_at?: string | null
  duration_seconds?: number | null
}

export interface UseRosaryHistoryRecordReturn {
  recordSession: (input: RecordSessionInput) => Promise<boolean>
}

export function useRosaryHistoryRecord(): UseRosaryHistoryRecordReturn {
  const recordSession = useCallback(
    async (input: RecordSessionInput): Promise<boolean> => {
      try {
        const res = await fetch('/api/rosario/sessions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        })
        return res.ok
      } catch {
        return false
      }
    },
    [],
  )

  return { recordSession }
}
