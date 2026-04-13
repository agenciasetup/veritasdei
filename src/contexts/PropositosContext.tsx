'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  listPropositos,
  listLogsRecentes,
  ensureSeedPropositos,
  checkInProposito,
  desfazerCheckIn,
} from '@/lib/supabase/propositos.queries'
import {
  enrichProposito,
  localDateString,
  addDaysString,
} from '@/lib/propositos'
import type {
  Proposito,
  PropositoLog,
  PropositoComProgresso,
} from '@/types/propositos'

interface PropositosContextValue {
  propositos: PropositoComProgresso[]
  propositosAtivos: PropositoComProgresso[]
  logs: PropositoLog[]
  today: string
  timezone: string
  loading: boolean
  checkIn: (propositoId: string) => Promise<void>
  desfazer: (propositoId: string, feitoEm: string) => Promise<void>
  reload: () => Promise<void>
  /** Aplica um propósito criado/atualizado no estado local imediatamente. */
  upsertLocal: (p: Proposito) => void
  /** Remove um propósito do estado local imediatamente. */
  removeLocal: (propositoId: string) => void
}

const PropositosContext = createContext<PropositosContextValue | null>(null)

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
  } catch {
    return 'America/Sao_Paulo'
  }
}

export function PropositosProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [propositos, setPropositos] = useState<Proposito[]>([])
  const [logs, setLogs] = useState<PropositoLog[]>([])
  const [loading, setLoading] = useState(false)
  const seedDoneRef = useRef<string | null>(null)

  const timezone = useMemo(() => detectTimezone(), [])
  const today = useMemo(() => localDateString(new Date(), timezone), [timezone])
  const since = useMemo(() => addDaysString(today, -400), [today])

  const load = useCallback(async () => {
    if (!user?.id) {
      setPropositos([])
      setLogs([])
      return
    }
    setLoading(true)
    try {
      if (seedDoneRef.current !== user.id) {
        await ensureSeedPropositos(user.id)
        seedDoneRef.current = user.id
      }
      const [props, lgs] = await Promise.all([
        listPropositos(user.id),
        listLogsRecentes(user.id, since),
      ])
      setPropositos(props)
      setLogs(lgs)
    } finally {
      setLoading(false)
    }
  }, [user?.id, since])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      void load()
    } else {
      setPropositos([])
      setLogs([])
    }
  }, [isAuthenticated, user?.id, load])

  const enriquecidos = useMemo<PropositoComProgresso[]>(() => {
    return propositos.map(p => {
      const logsDele = logs.filter(l => l.proposito_id === p.id)
      return enrichProposito(p, logsDele, today)
    })
  }, [propositos, logs, today])

  const ativos = useMemo(
    () => enriquecidos.filter(p => p.ativo),
    [enriquecidos],
  )

  const checkIn = useCallback(
    async (propositoId: string) => {
      if (!user?.id) return
      // otimista: adiciona log local
      const tempLog: PropositoLog = {
        id: `temp-${propositoId}-${today}`,
        proposito_id: propositoId,
        user_id: user.id,
        feito_em: today,
        observacao: null,
        created_at: new Date().toISOString(),
      }
      setLogs(prev => {
        if (prev.some(l => l.proposito_id === propositoId && l.feito_em === today)) {
          return prev
        }
        return [tempLog, ...prev]
      })

      const { error } = await checkInProposito(propositoId, user.id, today)
      if (error) {
        // rollback
        setLogs(prev => prev.filter(l => l.id !== tempLog.id))
        console.warn('[propositos] checkIn falhou:', error)
      } else {
        // recarrega só os logs pra pegar o id real
        const lgs = await listLogsRecentes(user.id, since)
        setLogs(lgs)
      }
    },
    [user?.id, today, since],
  )

  const desfazer = useCallback(
    async (propositoId: string, feitoEm: string) => {
      if (!user?.id) return
      setLogs(prev => prev.filter(l => !(l.proposito_id === propositoId && l.feito_em === feitoEm)))
      const { error } = await desfazerCheckIn(propositoId, feitoEm)
      if (error) {
        console.warn('[propositos] desfazer falhou:', error)
        await load()
      }
    },
    [user?.id, load],
  )

  const upsertLocal = useCallback((p: Proposito) => {
    setPropositos(prev => {
      const idx = prev.findIndex(x => x.id === p.id)
      if (idx === -1) return [...prev, p]
      const copy = prev.slice()
      copy[idx] = p
      return copy
    })
  }, [])

  const removeLocal = useCallback((propositoId: string) => {
    setPropositos(prev => prev.filter(p => p.id !== propositoId))
    setLogs(prev => prev.filter(l => l.proposito_id !== propositoId))
  }, [])

  const value: PropositosContextValue = {
    propositos: enriquecidos,
    propositosAtivos: ativos,
    logs,
    today,
    timezone,
    loading,
    checkIn,
    desfazer,
    reload: load,
    upsertLocal,
    removeLocal,
  }

  return <PropositosContext.Provider value={value}>{children}</PropositosContext.Provider>
}

export function usePropositos(): PropositosContextValue {
  const ctx = useContext(PropositosContext)
  if (!ctx) {
    // Fallback silencioso caso o provider não esteja montado (ex.: páginas públicas).
    return {
      propositos: [],
      propositosAtivos: [],
      logs: [],
      today: localDateString(),
      timezone: detectTimezone(),
      loading: false,
      checkIn: async () => {},
      desfazer: async () => {},
      reload: async () => {},
      upsertLocal: () => {},
      removeLocal: () => {},
    }
  }
  return ctx
}
