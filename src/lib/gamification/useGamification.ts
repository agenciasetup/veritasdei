'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { tierForLevel } from './levelTier'
import { percentInLevel, xpInLevel, xpToNextLevel, XP_PER_LEVEL } from './xpCurve'
import type { LevelTier, Reliquia, UserGamification } from '@/types/gamification'
import type { EquippedCartaChipData } from '@/components/colecao/EquippedCartaChip'

export interface GamificationData {
  level: number
  totalXp: number
  xpInLevel: number
  xpToNextLevel: number
  percentInLevel: number
  tier: LevelTier
  currentStreak: number
  longestStreak: number
  studiedToday: boolean
  equippedReliquia: Reliquia | null
  /** Carta equipada como vitrine no perfil (chip ao lado do nome). */
  equippedCarta: EquippedCartaChipData | null
  unlockedReliquiaIds: Set<string>
  loading: boolean
  reload: () => Promise<void>
}

const DEFAULT_TIER = tierForLevel(1)

/**
 * Hook central de gamificação. Lê `user_gamification` desnormalizado,
 * deriva XP/nível/barra, carrega relíquia equipada e lista de desbloqueadas.
 */
export function useGamification(userId: string | undefined): GamificationData {
  const [gami, setGami] = useState<UserGamification | null>(null)
  const [equipped, setEquipped] = useState<Reliquia | null>(null)
  const [equippedCarta, setEquippedCarta] = useState<EquippedCartaChipData | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [studiedToday, setStudiedToday] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!userId) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const [gamiRes, unlockedRes, todayRes] = await Promise.all([
        supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_reliquias')
          .select('reliquia_id')
          .eq('user_id', userId),
        supabase
          .from('user_content_progress')
          .select('studied_at')
          .eq('user_id', userId)
          .order('studied_at', { ascending: false })
          .limit(1),
      ])

      const row = gamiRes.data as UserGamification | null
      setGami(row)

      const ids = new Set<string>(
        (unlockedRes.data ?? []).map((r: { reliquia_id: string }) => r.reliquia_id),
      )
      setUnlockedIds(ids)

      // studiedToday: último registro do user é hoje (tz local)?
      const last = todayRes.data?.[0]?.studied_at as string | undefined
      if (last) {
        const d = new Date(last)
        const now = new Date()
        setStudiedToday(
          d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate(),
        )
      } else {
        setStudiedToday(false)
      }

      // Carrega relíquia equipada (se houver)
      if (row?.equipped_reliquia_id) {
        const { data: relic } = await supabase
          .from('reliquias')
          .select('*')
          .eq('id', row.equipped_reliquia_id)
          .maybeSingle()
        setEquipped((relic as Reliquia | null) ?? null)
      } else {
        setEquipped(null)
      }

      // Carta-vitrine equipada (chip ao lado do nome).
      const equippedCartaId = (row as { equipped_carta_id?: string | null } | null)
        ?.equipped_carta_id
      if (equippedCartaId) {
        const { data: cartaRow } = await supabase
          .from('user_cartas')
          .select(
            'serial_number, token, minted_at, carta:cartas(id, slug, nome, subtitulo, numero, raridade, estrelas, simbolo, cor_accent, ilustracao_url)',
          )
          .eq('user_id', userId)
          .eq('carta_id', equippedCartaId)
          .maybeSingle()
        if (cartaRow && (cartaRow as { carta: unknown }).carta) {
          const r = cartaRow as unknown as {
            serial_number: number
            token: string
            minted_at: string
            carta: Omit<EquippedCartaChipData, 'serial_number' | 'token' | 'minted_at'>
          }
          setEquippedCarta({
            ...r.carta,
            serial_number: r.serial_number,
            token: r.token,
            minted_at: r.minted_at,
          })
        } else {
          setEquippedCarta(null)
        }
      } else {
        setEquippedCarta(null)
      }
    } catch {
      // degrada silenciosamente
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const totalXp = gami?.total_xp ?? 0
  const level = gami?.current_level ?? 1

  return {
    level,
    totalXp,
    xpInLevel: xpInLevel(totalXp),
    xpToNextLevel: xpToNextLevel(totalXp),
    percentInLevel: percentInLevel(totalXp),
    tier: gami ? tierForLevel(level) : DEFAULT_TIER,
    currentStreak: gami?.current_streak ?? 0,
    longestStreak: gami?.longest_streak ?? 0,
    studiedToday,
    equippedReliquia: equipped,
    equippedCarta,
    unlockedReliquiaIds: unlockedIds,
    loading,
    reload: load,
  }
}

export { XP_PER_LEVEL }
