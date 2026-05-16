'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Carta, CartaColecao, Personagem } from '@/types/colecao'

// Coleção do usuário. A RLS de `cartas` só revela cartas desbloqueadas, então
// a query de user_cartas já traz exatamente o que a pessoa conquistou — o
// resto de cada personagem fica como silhueta (total_cartas - desbloqueadas).

export interface PersonagemColecao extends Personagem {
  /** Cartas desbloqueadas deste personagem (com dados completos). */
  cartas: CartaColecao[]
  desbloqueadas: number
}

export interface CodexState {
  personagens: PersonagemColecao[]
  /** Cartas recém-desbloqueadas ainda não vistas (para o modal de celebração). */
  novas: Carta[]
  totalCartas: number
  totalDesbloqueadas: number
  loading: boolean
  error: string | null
  marcarVista: (cartaId: string) => Promise<void>
  alternarFavorita: (cartaId: string) => Promise<void>
  recarregar: () => Promise<void>
}

interface UserCartaRow {
  carta_id: string
  desbloqueada_em: string
  vista: boolean
  favorita: boolean
  serial_number: number
  token: string
  signature: string
  minted_at: string
  carta: Carta | null
}

export function useCodex(userId: string | undefined): CodexState {
  const [personagens, setPersonagens] = useState<PersonagemColecao[]>([])
  const [novas, setNovas] = useState<Carta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const persRes = await supabase
        .from('personagens')
        .select('*')
        .eq('visivel', true)
        .order('ordem')
      if (persRes.error) throw persRes.error
      const pers = (persRes.data as Personagem[] | null) ?? []

      let porPersonagem = new Map<string, CartaColecao[]>()
      const novasCartas: Carta[] = []

      if (userId) {
        const ucRes = await supabase
          .from('user_cartas')
          .select(
            'carta_id, desbloqueada_em, vista, favorita, serial_number, token, signature, minted_at, carta:cartas(*)',
          )
          .eq('user_id', userId)
          .order('desbloqueada_em', { ascending: false })
        if (ucRes.error) throw ucRes.error

        const rows = (ucRes.data as unknown as UserCartaRow[] | null) ?? []
        porPersonagem = rows.reduce((acc, row) => {
          if (!row.carta) return acc
          const carta: CartaColecao = {
            ...row.carta,
            favorita: row.favorita,
            serial_number: row.serial_number,
            token: row.token,
            signature: row.signature,
            minted_at: row.minted_at,
          }
          const lista = acc.get(row.carta.personagem_id) ?? []
          lista.push(carta)
          acc.set(row.carta.personagem_id, lista)
          if (!row.vista) novasCartas.push(row.carta)
          return acc
        }, new Map<string, CartaColecao[]>())
      }

      setPersonagens(
        pers.map((p) => {
          const cartas = (porPersonagem.get(p.id) ?? []).sort(
            (a, b) => a.ordem - b.ordem,
          )
          return { ...p, cartas, desbloqueadas: cartas.length }
        }),
      )
      setNovas(novasCartas)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar coleção')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    queueMicrotask(() => void carregar())
  }, [carregar])

  const marcarVista = useCallback(
    async (cartaId: string) => {
      if (!userId) return
      const supabase = createClient()
      if (!supabase) return
      setNovas((n) => n.filter((c) => c.id !== cartaId))
      await supabase
        .from('user_cartas')
        .update({ vista: true })
        .eq('user_id', userId)
        .eq('carta_id', cartaId)
    },
    [userId],
  )

  const alternarFavorita = useCallback(
    async (cartaId: string) => {
      if (!userId) return
      const supabase = createClient()
      if (!supabase) return
      let novoValor = false
      setPersonagens((prev) =>
        prev.map((p) => ({
          ...p,
          cartas: p.cartas.map((c) => {
            if (c.id !== cartaId) return c
            novoValor = !c.favorita
            return { ...c, favorita: novoValor }
          }),
        })),
      )
      await supabase
        .from('user_cartas')
        .update({ favorita: novoValor })
        .eq('user_id', userId)
        .eq('carta_id', cartaId)
    },
    [userId],
  )

  const totalCartas = personagens.reduce((s, p) => s + p.total_cartas, 0)
  const totalDesbloqueadas = personagens.reduce(
    (s, p) => s + p.desbloqueadas,
    0,
  )

  return {
    personagens,
    novas,
    totalCartas,
    totalDesbloqueadas,
    loading,
    error,
    marcarVista,
    alternarFavorita,
    recarregar: carregar,
  }
}
