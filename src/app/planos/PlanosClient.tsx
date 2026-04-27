'use client'

/**
 * Cliente de /planos — seleção de intervalo + checkout.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import PremiumFeaturesCarousel from '@/components/payments/PremiumFeaturesCarousel'
import { isNativePlatform } from '@/lib/platform/is-native'

type Price = {
  id: string
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  amount_cents: number
  moeda: string
  ativo: boolean
}

type Plan = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  beneficios: string[]
  destaque: string | null
  billing_prices: Price[]
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function labelIntervalo(i: Price['intervalo']) {
  return { mensal: 'Mensal', semestral: 'Semestral', anual: 'Anual', unico: 'Único' }[i]
}

function economia(price: Price, mensal: Price | undefined): number | null {
  if (!mensal || price.intervalo === 'mensal') return null
  const meses = price.intervalo === 'semestral' ? 6 : price.intervalo === 'anual' ? 12 : 0
  if (meses === 0) return null
  const integral = mensal.amount_cents * meses
  const pct = Math.round(((integral - price.amount_cents) / integral) * 100)
  return pct > 0 ? pct : null
}

export default function PlanosClient({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { isPremium, refresh: refreshSubscription } = useSubscription()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // `native` é setado após mount: SSR sempre renderiza o fluxo web e o
  // hydrate do WebView Capacitor troca pro fluxo nativo. Evita mismatch.
  const [native, setNative] = useState(false)
  useEffect(() => {
    setNative(isNativePlatform())
  }, [])

  const plan = plans[0] ?? null

  const sortedPrices = useMemo(() => {
    if (!plan) return []
    const ord = { mensal: 1, semestral: 2, anual: 3, unico: 4 }
    return plan.billing_prices.slice().sort((a, b) => ord[a.intervalo] - ord[b.intervalo])
  }, [plan])

  const mensal = sortedPrices.find(p => p.intervalo === 'mensal')

  /**
   * Caminho NATIVO (Capacitor Android/iOS): apresenta o Paywall do
   * RevenueCat. O Paywall mostra a Offering "current" configurada no
   * painel — usuário escolhe um package (mensal/semestral/anual/lifetime)
   * e a compra acontece via Play Billing/StoreKit. Webhook do RC grava
   * em billing_subscriptions; refresh() puxa o entitlement novo.
   *
   * O `priceId` recebido aqui é só um trigger — no Paywall do RC o
   * usuário pode escolher qualquer package; o próprio Paywall sabe
   * qual é o "destacado" pela ordem definida no painel.
   */
  async function assinarNative() {
    if (!isAuthenticated) {
      router.push(`/login?next=/planos`)
      return
    }
    setError(null)
    setLoadingPriceId('paywall')
    try {
      const { RevenueCatUI, PAYWALL_RESULT } = await import(
        '@revenuecat/purchases-capacitor-ui'
      )
      const { result } = await RevenueCatUI.presentPaywall()
      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        // Webhook do RC pode levar alguns segundos para gravar no
        // Supabase. Refresh imediato + fallback após 4s.
        await refreshSubscription()
        setTimeout(() => {
          refreshSubscription().catch(() => {})
        }, 4000)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingPriceId(null)
    }
  }

  /**
   * Caminho WEB (browser/PWA): mantém o Stripe Checkout existente.
   * Não muda nada do fluxo legado.
   */
  async function assinarWeb(priceId: string) {
    if (!isAuthenticated) {
      router.push(`/login?next=/planos`)
      return
    }
    setLoadingPriceId(priceId)
    setError(null)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao iniciar checkout')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de checkout ausente')
      }
    } catch (err) {
      setError((err as Error).message)
      setLoadingPriceId(null)
    }
  }

  function assinar(priceId: string) {
    if (native) return assinarNative()
    return assinarWeb(priceId)
  }

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
          Nenhum plano disponível no momento.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            {plan.nome}
          </h1>
          {plan.descricao && (
            <p
              className="text-sm max-w-md mx-auto"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              {plan.descricao}
            </p>
          )}
        </header>

        {!isPremium && (
          <div className="mb-8">
            <PremiumFeaturesCarousel variant="full" />
          </div>
        )}

        {isPremium && (
          <div
            className="mb-6 p-4 rounded-2xl text-center"
            style={{
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
              color: 'var(--success)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Você já tem acesso Premium. Gerencie sua assinatura em{' '}
            <a href="/perfil?tab=assinatura" className="underline">
              perfil
            </a>
            .
          </div>
        )}

        {error && (
          <div
            className="mb-6 p-4 rounded-2xl text-sm"
            style={{
              background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
              color: 'var(--warning)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </div>
        )}

        <div
          className="p-6 md:p-8 rounded-3xl mb-6"
          style={{
            background:
              'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <ul className="flex flex-col gap-3 mb-8">
            {plan.beneficios.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
              >
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                {b}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            {sortedPrices.map(price => {
              const desc = economia(price, mensal)
              const loading = loadingPriceId === price.id
              return (
                <button
                  key={price.id}
                  type="button"
                  onClick={() => assinar(price.id)}
                  disabled={loading || isPremium}
                  className="p-4 rounded-2xl flex items-center justify-between gap-3 text-left transition-all disabled:opacity-60"
                  style={{
                    background: 'var(--surface-inset)',
                    border: '1px solid var(--border-1)',
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium">{labelIntervalo(price.intervalo)}</span>
                      {desc != null && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'color-mix(in srgb, var(--success) 18%, transparent)',
                            color: 'var(--success)',
                            border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                          }}
                        >
                          -{desc}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {formatBRL(price.amount_cents)}
                      {price.intervalo === 'mensal' && ' /mês'}
                      {price.intervalo === 'semestral' && ' a cada 6 meses'}
                      {price.intervalo === 'anual' && ' /ano'}
                    </div>
                  </div>
                  <div
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPremium ? (
                      'Ativo'
                    ) : (
                      'Assinar'
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p
          className="text-[11px] text-center"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Pagamento processado com segurança. Cancele quando quiser.
        </p>
      </div>
    </main>
  )
}
