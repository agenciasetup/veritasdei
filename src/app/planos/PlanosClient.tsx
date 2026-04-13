'use client'

/**
 * Cliente de /planos — seleção de intervalo + checkout.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'

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
  const { isPremium } = useSubscription()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plan = plans[0] ?? null

  const sortedPrices = useMemo(() => {
    if (!plan) return []
    const ord = { mensal: 1, semestral: 2, anual: 3, unico: 4 }
    return plan.billing_prices.slice().sort((a, b) => ord[a.intervalo] - ord[b.intervalo])
  }, [plan])

  const mensal = sortedPrices.find(p => p.intervalo === 'mensal')

  async function assinar(priceId: string) {
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

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
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
              background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: '#C9A84C' }} />
          </div>
          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
          >
            {plan.nome}
          </h1>
          {plan.descricao && (
            <p
              className="text-sm max-w-md mx-auto"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              {plan.descricao}
            </p>
          )}
        </header>

        {isPremium && (
          <div
            className="mb-6 p-4 rounded-2xl text-center"
            style={{
              background: 'rgba(102,187,106,0.1)',
              border: '1px solid rgba(102,187,106,0.3)',
              color: '#66BB6A',
              fontFamily: 'Poppins, sans-serif',
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
              background: 'rgba(230,126,34,0.1)',
              border: '1px solid rgba(230,126,34,0.3)',
              color: '#E67E22',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        <div
          className="p-6 md:p-8 rounded-3xl mb-6"
          style={{
            background:
              'linear-gradient(160deg, rgba(201,168,76,0.08), rgba(255,255,255,0.02))',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <ul className="flex flex-col gap-3 mb-8">
            {plan.beneficios.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
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
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium">{labelIntervalo(price.intervalo)}</span>
                      {desc != null && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(102,187,106,0.15)',
                            color: '#66BB6A',
                            border: '1px solid rgba(102,187,106,0.3)',
                          }}
                        >
                          -{desc}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: '#7A7368' }}>
                      {formatBRL(price.amount_cents)}
                      {price.intervalo === 'mensal' && ' /mês'}
                      {price.intervalo === 'semestral' && ' a cada 6 meses'}
                      {price.intervalo === 'anual' && ' /ano'}
                    </div>
                  </div>
                  <div
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                      color: '#0F0E0C',
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
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Pagamento processado com segurança. Cancele quando quiser.
        </p>
      </div>
    </main>
  )
}
