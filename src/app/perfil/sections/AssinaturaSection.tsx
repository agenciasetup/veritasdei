'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'

export default function AssinaturaSection() {
  const { isPremium, loading, plano, status, expiraEm, cancelAtPeriodEnd, refresh } =
    useSubscription()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  async function abrirPortal() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao abrir portal')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const expiraFmt = expiraEm
    ? new Date(expiraEm).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2
          className="text-lg mb-1"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          Minha assinatura
        </h2>
        <p className="text-xs" style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
          Gerencie seu plano, método de pagamento e histórico de cobranças.
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm" style={{ color: '#8A8378' }}>
          Carregando…
        </div>
      ) : isPremium ? (
        <div
          className="p-5 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.02))',
            border: '1px solid rgba(201,168,76,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
            <span
              className="text-base font-medium"
              style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
            >
              Veritas Dei {plano === 'premium' ? 'Premium' : plano}
            </span>
            <span
              className="ml-auto text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(102,187,106,0.15)',
                color: '#66BB6A',
                border: '1px solid rgba(102,187,106,0.3)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {status === 'trialing' ? 'Em avaliação' : 'Ativo'}
            </span>
          </div>
          {expiraFmt && (
            <p className="text-xs mb-1" style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}>
              {cancelAtPeriodEnd
                ? `Acesso até ${expiraFmt} (não renovará)`
                : `Próxima cobrança: ${expiraFmt}`}
            </p>
          )}
        </div>
      ) : (
        <div
          className="p-5 rounded-2xl mb-4 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.25)',
          }}
        >
          <p className="text-sm mb-4" style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}>
            Você ainda não tem um plano ativo.
          </p>
          <Link
            href="/planos"
            className="inline-block px-6 py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              color: '#0F0E0C',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
            }}
          >
            Ver planos
          </Link>
        </div>
      )}

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-xs"
          style={{
            background: 'rgba(230,126,34,0.12)',
            border: '1px solid rgba(230,126,34,0.3)',
            color: '#E67E22',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {error}
        </div>
      )}

      {isPremium && (
        <button
          type="button"
          onClick={abrirPortal}
          disabled={busy}
          className="w-full py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {busy ? 'Abrindo…' : 'Gerenciar pagamento'}
        </button>
      )}
    </section>
  )
}
