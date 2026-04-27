'use client'

/**
 * SubscriptionContext — expõe o status de assinatura do usuário ao app.
 *
 * Carrega via RPC `get_user_entitlement(uid)` quando o user faz login.
 * Expõe `isPremium`, `status`, `plano`, `expiraEm` e um `refresh()`.
 *
 * Usar em:
 *  - headers e hubs (badge "Premium")
 *  - Esconder upsell
 *  - Gates client-side leves (o gate real é server-side via RequirePremium)
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase/client'

type Entitlement = {
  plano: string
  ativo: boolean
  status: string
  expira_em: string | null
  cancel_at_period_end: boolean
  fonte: string
}

interface SubscriptionContextValue {
  // Primeira carga (sem dados ainda).
  loading: boolean
  // Re-fetch em background (já tem dados anteriores). UI deve manter
  // o conteúdo na tela; opcionalmente mostra um spinner discreto.
  refreshing: boolean
  isPremium: boolean
  plano: string | null
  status: string | null
  expiraEm: string | null
  cancelAtPeriodEnd: boolean
  // `fonte` indica de onde veio o entitlement: 'stripe' (web),
  // 'revenuecat' (mobile/loja), 'admin_role' (override de admin), etc.
  // Usado pra decidir entre Stripe Customer Portal vs RevenueCat
  // Customer Center na tela de gerenciar assinatura.
  fonte: string | null
  refresh: () => Promise<void>
}

const Ctx = createContext<SubscriptionContextValue>({
  loading: true,
  refreshing: false,
  isPremium: false,
  plano: null,
  status: null,
  expiraEm: null,
  cancelAtPeriodEnd: false,
  fonte: null,
  refresh: async () => {},
})

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [ent, setEnt] = useState<Entitlement | null>(null)
  // Após a 1ª resposta (sucesso ou erro), os refetches subsequentes
  // não devem piscar `loading=true` — isso causava o "loop esperando"
  // no /perfil quando AuthContext re-emitia user em cada visibility
  // change ou navegação.
  const hasLoadedOnceRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setEnt(null)
      setLoading(false)
      hasLoadedOnceRef.current = true
      return
    }
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    if (hasLoadedOnceRef.current) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const { data, error } = await supabase.rpc('get_user_entitlement', {
        uid: user.id,
      })
      if (error) {
        console.warn('[subscription] rpc error:', error.message)
        // Em refresh: stale-while-revalidate (mantém último ent visível).
        // Em load inicial: limpa pra mostrar "sem assinatura".
        if (!hasLoadedOnceRef.current) setEnt(null)
      } else {
        const row = Array.isArray(data) ? data[0] : data
        setEnt((row as Entitlement) ?? null)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      hasLoadedOnceRef.current = true
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // P6 — escuta o evento global emitido pelo RevenueCatBootstrap
  // (após customerInfoUpdated nativo) pra puxar entitlement novo
  // sem o usuário precisar fechar/abrir o app.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      refresh()
    }
    window.addEventListener('veritasdei:subscription-refresh', handler)
    return () =>
      window.removeEventListener(
        'veritasdei:subscription-refresh',
        handler,
      )
  }, [refresh])

  const value: SubscriptionContextValue = {
    loading,
    refreshing,
    isPremium: !!ent?.ativo,
    plano: ent?.plano ?? null,
    status: ent?.status ?? null,
    expiraEm: ent?.expira_em ?? null,
    cancelAtPeriodEnd: ent?.cancel_at_period_end ?? false,
    fonte: ent?.fonte ?? null,
    refresh,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSubscription() {
  return useContext(Ctx)
}
