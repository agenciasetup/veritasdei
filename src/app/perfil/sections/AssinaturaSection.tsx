'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { isNativePlatform } from '@/lib/platform/is-native'

export default function AssinaturaSection() {
  const { isPremium, loading, plano, status, expiraEm, cancelAtPeriodEnd, fonte, refresh } =
    useSubscription()
  const [busy, setBusy] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [native, setNative] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    setNative(isNativePlatform())
  }, [])

  // 'admin_role' = premium override (admins). Não há nada pra gerenciar.
  // Para usuários reais, o gerenciamento depende da fonte:
  //  - 'revenuecat' → Customer Center nativo do SDK (Play/Apple).
  //  - 'stripe'     → Customer Portal do Stripe (URL).
  //  - 'asaas'      → Cancelamento direto via /api/payments/cancel (sem portal).
  //  - 'hubla'      → Sem self-service ainda; usuário fala com suporte.
  const fonteGerenciavel = fonte && fonte !== 'admin_role'
  const usaRevenueCat = fonte === 'revenuecat'
  const usaAsaas = fonte === 'asaas'

  async function abrirGerenciamento() {
    setBusy(true)
    setError(null)
    try {
      if (usaRevenueCat && native) {
        const { RevenueCatUI } = await import(
          '@revenuecat/purchases-capacitor-ui'
        )
        await RevenueCatUI.presentCustomerCenter()
        await refresh()
      } else {
        const res = await fetch('/api/payments/portal', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Falha ao abrir portal')
        if (data.url) window.location.href = data.url
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function cancelarAsaas() {
    setCanceling(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/payments/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao cancelar')
      setInfo('Assinatura cancelada. O acesso premium expira ao fim do período.')
      setConfirmCancel(false)
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCanceling(false)
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
          style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-1)' }}
        >
          Minha assinatura
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
          Gerencie seu plano, método de pagamento e histórico de cobranças.
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>
          Carregando…
        </div>
      ) : isPremium ? (
        <div
          className="p-5 rounded-2xl mb-4"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span
              className="text-base font-medium"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              Veritas Dei {plano === 'premium' ? 'Premium' : plano}
            </span>
            <span
              className="ml-auto text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--success) 15%, transparent)',
                color: 'var(--success)',
                border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {status === 'trialing' ? 'Em avaliação' : 'Ativo'}
            </span>
          </div>
          {expiraFmt && (
            <p className="text-xs mb-1" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>
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
            background: 'var(--surface-inset)',
            border: '1px dashed var(--border-1)',
          }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>
            Você ainda não tem um plano ativo.
          </p>
          <Link
            href="/planos"
            className="inline-block px-6 py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
            style={{
              background: 'var(--accent)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
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
            fontFamily: 'var(--font-body)',
          }}
        >
          {error}
        </div>
      )}

      {info && (
        <div
          className="mb-4 p-3 rounded-xl text-xs"
          style={{
            background: 'color-mix(in srgb, var(--success) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
            color: 'var(--success)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {info}
        </div>
      )}

      {isPremium && fonteGerenciavel && !usaAsaas && (
        <button
          type="button"
          onClick={abrirGerenciamento}
          disabled={busy}
          className="w-full py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--border-1)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {busy
            ? 'Abrindo…'
            : usaRevenueCat
              ? 'Gerenciar assinatura'
              : 'Gerenciar pagamento'}
        </button>
      )}

      {isPremium && usaAsaas && status !== 'canceled' && (
        <div className="flex flex-col gap-2">
          {!confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={canceling}
              className="w-full py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
              style={{
                background: 'transparent',
                border: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)',
                color: 'var(--warning)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Cancelar assinatura
            </button>
          ) : (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
              }}
            >
              <p
                className="text-xs mb-3"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
              >
                Tem certeza? Você manterá o acesso até o fim do período pago.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  disabled={canceling}
                  className="flex-1 py-2.5 rounded-lg text-xs touch-target active:scale-[0.98]"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Manter
                </button>
                <button
                  type="button"
                  onClick={cancelarAsaas}
                  disabled={canceling}
                  className="flex-1 py-2.5 rounded-lg text-xs touch-target active:scale-[0.98]"
                  style={{
                    background: 'var(--warning)',
                    color: '#0F0E0C',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}
                >
                  {canceling ? 'Cancelando…' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
