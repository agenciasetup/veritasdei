'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ROSARY_STEPS } from '@/features/rosario/data/beadSequence'
import { createClient } from '@/lib/supabase/client'
import type {
  RosaryDecadeReaders,
  RosaryRoom,
  RosaryRoomParticipant,
} from '@/features/rosario/data/historyTypes'

/**
 * Hook que sincroniza o estado de uma sala de terço compartilhado via
 * Supabase Realtime (Postgres Changes).
 *
 * Recebe o snapshot inicial (já hidratado pelo server component) e
 * a partir daí mantém `room` e `participants` atualizados ouvindo
 * mudanças na tabela `rosary_rooms` (pro passo/estado/co-host) e
 * `rosary_room_participants` (entrada/saída de gente).
 *
 * As ações de avanço (`advance`, `back`, `goTo`) só funcionam pra
 * host/co-host — fazem PATCH via route handler e confiam na resposta
 * do Realtime pra atualizar o estado local. O retorno otimista é feito
 * pro UX não ficar travado esperando o round-trip.
 *
 * Decisões:
 *  - Fonte única de verdade é o servidor. `passo_index` local segue
 *    sempre `room.passo_index` — otimismo é aplicado via um override
 *    temporário que é descartado ao receber o broadcast.
 *  - Se o cliente realtime falha (sem env, sem network, etc.), o hook
 *    degrada pra "snapshot estático" — nada quebra, só não sincroniza.
 */

const LAST_INDEX = ROSARY_STEPS.length - 1

export interface UseSharedRosaryProgressReturn {
  room: RosaryRoom
  participants: RosaryRoomParticipant[]
  currentIndex: number
  isCompleted: boolean
  canControl: boolean
  isHost: boolean
  isCoHost: boolean
  /** Ids de usuários conectados ao canal agora (via Supabase Realtime Presence). */
  onlineUserIds: ReadonlySet<string>
  /** True quando a última ação otimista ainda não foi confirmada. */
  pending: boolean
  /** Última mensagem de erro (ação negada, rede, etc.), se houver. */
  error: string | null
  advance: () => Promise<void>
  back: () => Promise<void>
  goTo: (index: number) => Promise<void>
  setState: (state: RosaryRoom['state']) => Promise<void>
  setCoHost: (userId: string | null) => Promise<void>
  /**
   * Atribui (ou remove) o leitor de uma dezena (1-5). Apenas host/co-host.
   * Passe `null` em `userId` pra remover a atribuição daquela dezena.
   */
  setDecadeReader: (decade: 1 | 2 | 3 | 4 | 5, userId: string | null) => Promise<void>
  refresh: () => Promise<void>
}

export function useSharedRosaryProgress(
  initialRoom: RosaryRoom,
  initialParticipants: RosaryRoomParticipant[],
  viewerUserId: string,
): UseSharedRosaryProgressReturn {
  const [room, setRoomState] = useState<RosaryRoom>(initialRoom)
  const [participants, setParticipants] =
    useState<RosaryRoomParticipant[]>(initialParticipants)
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlineUserIds, setOnlineUserIds] = useState<ReadonlySet<string>>(
    () => new Set([viewerUserId]),
  )

  const roomIdRef = useRef(initialRoom.id)
  const codigoRef = useRef(initialRoom.codigo)

  const isHost = room.host_user_id === viewerUserId
  const isCoHost = room.co_host_user_id === viewerUserId
  const canControl = isHost || isCoHost

  // effectivePassoIndex: otimista, volta pro servidor assim que o
  // broadcast confirma (ou corrige).
  const currentIndex =
    optimisticIndex !== null ? optimisticIndex : room.passo_index

  const isCompleted = room.state === 'finalizada' || currentIndex > LAST_INDEX

  // --- Realtime subscription -------------------------------------------------
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const roomId = roomIdRef.current
    const channel = supabase.channel(`rosario:sala:${roomId}`, {
      config: { presence: { key: viewerUserId } },
    })

    channel
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rosary_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload: { new: RosaryRoom }) => {
          const next = payload.new
          setRoomState(next)
          // Se o broadcast confirma o passo otimista (ou o servidor mandou
          // um passo diferente), descarta o otimismo.
          setOptimisticIndex((prev) => {
            if (prev === null) return null
            if (prev === next.passo_index) return null
            // Servidor mandou outro valor — respeita o servidor.
            return null
          })
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'rosary_room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Qualquer mudança na lista de participantes: refaz um SELECT.
          // Podia aplicar o delta direto, mas o snapshot completo é mais
          // simples e a lista é pequena.
          void refreshFromServer()
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'presence' as any,
        { event: 'sync' },
        () => {
          // presenceState() retorna um record { key: [{ ... }] }.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state = (channel as any).presenceState() as Record<string, unknown>
          const ids = new Set<string>()
          for (const key of Object.keys(state)) ids.add(key)
          setOnlineUserIds(ids)
        },
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ user_id: viewerUserId, at: Date.now() })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Helpers pro fetch snapshot completo -----------------------------------
  const refreshFromServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/rosario/rooms/${codigoRef.current}`, {
        method: 'GET',
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        room: RosaryRoom
        participants: RosaryRoomParticipant[]
      }
      setRoomState(data.room)
      setParticipants(data.participants)
      setOptimisticIndex(null)
    } catch {
      // Silêncio.
    }
  }, [])

  // --- Ações de controle -----------------------------------------------------
  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      setPending(true)
      setError(null)
      try {
        const res = await fetch(`/api/rosario/rooms/${codigoRef.current}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Não foi possível atualizar a sala.')
          setOptimisticIndex(null)
          return false
        }
        const data = (await res.json()) as {
          room: RosaryRoom
          participants: RosaryRoomParticipant[]
        }
        setRoomState(data.room)
        setParticipants(data.participants)
        setOptimisticIndex(null)
        return true
      } catch {
        setError('Erro de rede.')
        setOptimisticIndex(null)
        return false
      } finally {
        setPending(false)
      }
    },
    [],
  )

  const advance = useCallback(async () => {
    if (!canControl) return
    const current = room.passo_index
    if (current >= LAST_INDEX) {
      // Já no último passo: finalizar.
      await patch({ state: 'finalizada' })
      return
    }
    const next = current + 1
    setOptimisticIndex(next)
    await patch({ passo_index: next })
  }, [canControl, room.passo_index, patch])

  const back = useCallback(async () => {
    if (!canControl) return
    const current = room.passo_index
    if (current <= 0) return
    const next = current - 1
    setOptimisticIndex(next)
    await patch({ passo_index: next })
  }, [canControl, room.passo_index, patch])

  const goTo = useCallback(
    async (index: number) => {
      if (!canControl) return
      const clamped = Math.max(0, Math.min(LAST_INDEX, Math.floor(index)))
      setOptimisticIndex(clamped)
      await patch({ passo_index: clamped })
    },
    [canControl, patch],
  )

  const setRoomStatePatch = useCallback(
    async (state: RosaryRoom['state']) => {
      if (!canControl) return
      await patch({ state })
    },
    [canControl, patch],
  )

  const setCoHost = useCallback(
    async (userId: string | null) => {
      if (!isHost) return
      await patch({ co_host_user_id: userId })
    },
    [isHost, patch],
  )

  const setDecadeReader = useCallback(
    async (decade: 1 | 2 | 3 | 4 | 5, userId: string | null) => {
      if (!canControl) return
      const key = String(decade) as keyof RosaryDecadeReaders
      const current: RosaryDecadeReaders = { ...(room.decade_readers ?? {}) }
      if (userId === null) {
        delete current[key]
      } else {
        current[key] = userId
      }
      await patch({ decade_readers: current })
    },
    [canControl, room.decade_readers, patch],
  )

  return {
    room,
    participants,
    currentIndex,
    isCompleted,
    canControl,
    isHost,
    isCoHost,
    onlineUserIds,
    pending,
    error,
    advance,
    back,
    goTo,
    setState: setRoomStatePatch,
    setCoHost,
    setDecadeReader,
    refresh: refreshFromServer,
  }
}
