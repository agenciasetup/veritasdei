'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePropositos } from '@/contexts/PropositosContext'
import {
  periodoKey,
  selecionarParaPrompt,
  type PromptState,
  type RespostaPrompt,
} from '@/lib/propositos-prompt'
import PropositoCheckInModal from './PropositoCheckInModal'

/**
 * Gate global do modal de check-in.
 *
 * - Carrega o estado do localStorage (chave por usuário).
 * - Decide se há propósitos pendentes a perguntar HOJE.
 * - Espera 1.2s após login pra não competir com outros modais
 *   (CoachMarks, NovidadesModal). Esses só rodam pós-onboarding também.
 * - Persiste cada resposta em localStorage no formato:
 *     {propositoId: {periodo, dia, resposta}}
 */

const STORAGE_PREFIX = 'veritasdei:proposito-prompt:v1'

function storageKey(userId: string | undefined): string {
  return `${STORAGE_PREFIX}:${userId ?? 'anon'}`
}

function readState(userId: string | undefined): PromptState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return {}
    return JSON.parse(raw) as PromptState
  } catch {
    return {}
  }
}

function writeState(userId: string | undefined, state: PromptState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    /* quota / private mode — ignora */
  }
}

export default function PropositoCheckInGate() {
  const { propositosAtivos, loading, today } = usePropositos()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<PromptState>({})
  const [userKey, setUserKey] = useState<string | undefined>(undefined)
  const [armed, setArmed] = useState(false)

  // Identifica usuário pelo primeiro proposito carregado (que tem user_id).
  // Não puxamos useAuth aqui pra evitar render extra no AppShell.
  useEffect(() => {
    const uid = propositosAtivos[0]?.user_id
    if (uid && uid !== userKey) {
      setUserKey(uid)
      setState(readState(uid))
    }
  }, [propositosAtivos, userKey])

  // Espera o contexto carregar antes de armar (1.2s extra de cortesia).
  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => setArmed(true), 1200)
    return () => clearTimeout(t)
  }, [loading])

  const pendentes = useMemo(() => {
    if (!armed) return []
    return selecionarParaPrompt(propositosAtivos, state, today)
  }, [armed, propositosAtivos, state, today])

  // Abre o modal automaticamente quando há pendentes (apenas uma vez por sessão).
  useEffect(() => {
    if (!armed) return
    if (pendentes.length === 0) return
    if (open) return
    setOpen(true)
    // Marca esses propósitos como "vistos hoje" pra não reabrir caso a pessoa
    // feche sem responder — comportamento "1 prompt por dia".
    // (Só registramos como 'lembrar' implícito ao fechar; aqui só evitamos loop.)
  }, [armed, pendentes, open])

  const handleResponder = useCallback(
    (propositoId: string, resposta: RespostaPrompt) => {
      const p = propositosAtivos.find(x => x.id === propositoId)
      if (!p) return
      setState(prev => {
        const next: PromptState = {
          ...prev,
          [propositoId]: {
            periodo: periodoKey(p, today),
            dia: today,
            resposta,
          },
        }
        writeState(userKey, next)
        return next
      })
    },
    [propositosAtivos, today, userKey],
  )

  const handleClose = useCallback(() => {
    // Marca todos os ainda-não-respondidos como "lembrar" pra não voltar hoje.
    setState(prev => {
      const next: PromptState = { ...prev }
      for (const p of pendentes) {
        if (next[p.id]?.dia === today) continue
        next[p.id] = {
          periodo: periodoKey(p, today),
          dia: today,
          resposta: 'lembrar',
        }
      }
      writeState(userKey, next)
      return next
    })
    setOpen(false)
  }, [pendentes, today, userKey])

  if (!open || pendentes.length === 0) return null

  return (
    <PropositoCheckInModal
      pendentes={pendentes}
      onResponder={handleResponder}
      onClose={handleClose}
    />
  )
}
