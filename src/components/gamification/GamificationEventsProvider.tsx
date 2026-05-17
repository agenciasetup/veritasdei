'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { XpToastStack, type XpToastItem } from './XpToast'
import LevelUpModal from './LevelUpModal'
import ReliquiaUnlockModal, { type ReliquiaUnlockData } from './ReliquiaUnlockModal'
import CartaUnlockModal from '@/components/colecao/CartaUnlockModal'
import type { Carta } from '@/types/colecao'

type Baseline = {
  totalXp: number
  level: number
  reliquiaIds: Set<string>
  cartaIds: Set<string>
}

export default function GamificationEventsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const [toasts, setToasts] = useState<XpToastItem[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [reliquia, setReliquia] = useState<ReliquiaUnlockData | null>(null)
  // Fila de cartas desbloqueadas: quando várias chegam juntas (ex.: triggers
  // em cascata), a animação roda uma por vez. dismissCarta() avança a fila.
  const [cartaQueue, setCartaQueue] = useState<Carta[]>([])
  const baseline = useRef<Baseline | null>(null)
  const toastSeq = useRef(0)

  useEffect(() => {
    if (!user?.id) {
      baseline.current = null
      return
    }

    const supabase = createClient()
    let cancelled = false

    async function loadBaseline() {
      const [gamiRes, relRes, cartaRes] = await Promise.all([
        supabase
          .from('user_gamification')
          .select('total_xp, current_level')
          .eq('user_id', user!.id)
          .maybeSingle(),
        supabase.from('user_reliquias').select('reliquia_id').eq('user_id', user!.id),
        supabase.from('user_cartas').select('carta_id').eq('user_id', user!.id),
      ])
      if (cancelled) return
      baseline.current = {
        totalXp: gamiRes.data?.total_xp ?? 0,
        level: gamiRes.data?.current_level ?? 1,
        reliquiaIds: new Set(
          (relRes.data || []).map((r: { reliquia_id: string }) => r.reliquia_id),
        ),
        cartaIds: new Set(
          (cartaRes.data || []).map((r: { carta_id: string }) => r.carta_id),
        ),
      }
    }

    loadBaseline()

    type RealtimePayload = { new: Record<string, unknown> }
    const channel = supabase
      .channel(`gami-events-${user.id}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_gamification',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePayload) => {
          const next = payload.new as { total_xp?: number; current_level?: number }
          if (!baseline.current) return
          const nextXp = next.total_xp ?? baseline.current.totalXp
          const nextLevel = next.current_level ?? baseline.current.level
          const deltaXp = nextXp - baseline.current.totalXp

          if (deltaXp > 0) {
            toastSeq.current += 1
            const id = toastSeq.current
            setToasts((prev) => [...prev, { id, xp: deltaXp }])
          }
          if (nextLevel > baseline.current.level) {
            setLevelUp(nextLevel)
          }
          baseline.current.totalXp = nextXp
          baseline.current.level = nextLevel
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_reliquias',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: RealtimePayload) => {
          const reliquiaId = (payload.new as { reliquia_id: string }).reliquia_id
          if (!baseline.current) return
          if (baseline.current.reliquiaIds.has(reliquiaId)) return
          baseline.current.reliquiaIds.add(reliquiaId)

          const { data } = await supabase
            .from('reliquias')
            .select('id, slug, name, description, lore, image_url, rarity')
            .eq('id', reliquiaId)
            .maybeSingle()
          if (data) setReliquia(data as ReliquiaUnlockData)
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_cartas',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: RealtimePayload) => {
          const cartaId = (payload.new as { carta_id: string }).carta_id
          if (!baseline.current) return
          if (baseline.current.cartaIds.has(cartaId)) return
          baseline.current.cartaIds.add(cartaId)

          const { data } = await supabase
            .from('cartas')
            .select('*')
            .eq('id', cartaId)
            .maybeSingle()
          if (data) setCartaQueue((q) => [...q, data as Carta])
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Ao fechar o popup da carta, avança a fila + marca a carta atual como
  // vista pra não reaparecer na vitrine da Coleção.
  async function dismissCarta() {
    const atual = cartaQueue[0]
    setCartaQueue((q) => q.slice(1))
    if (!atual || !user?.id) return
    const supabase = createClient()
    await supabase
      .from('user_cartas')
      .update({ vista: true })
      .eq('user_id', user.id)
      .eq('carta_id', atual.id)
  }

  const cartaAtual = cartaQueue[0] ?? null

  return (
    <>
      {children}
      <XpToastStack toasts={toasts} onDismiss={dismissToast} />
      {levelUp ? <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} /> : null}
      {reliquia ? (
        <ReliquiaUnlockModal reliquia={reliquia} onClose={() => setReliquia(null)} />
      ) : null}
      {cartaAtual ? (
        // key força remount a cada carta — a animação de entrada toca de novo
        <CartaUnlockModal
          key={cartaAtual.id}
          carta={cartaAtual}
          onClose={dismissCarta}
        />
      ) : null}
    </>
  )
}
