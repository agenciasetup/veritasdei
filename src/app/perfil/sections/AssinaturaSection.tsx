'use client'

/**
 * AssinaturaSection — painel self-service da assinatura do usuário.
 *
 * Funcionalidades (Asaas):
 *  - mostra plano, status, próximo vencimento, forma de pagamento e valor;
 *  - trocar data de vencimento (input date);
 *  - trocar forma de pagamento entre PIX e BOLETO (CREDIT_CARD vai pelo
 *    sheet "Trocar cartão" — Asaas exige dados do cartão na troca);
 *  - trocar cartão de crédito (sheet com formulário);
 *  - listar últimas cobranças com link de fatura;
 *  - cancelar.
 *
 * Para Stripe/RevenueCat caímos no botão "Gerenciar pagamento" que abre
 * o portal externo (igual antes).
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarClock,
  CreditCard,
  Loader2,
  Receipt,
  Sparkles,
  X,
} from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { isNativePlatform } from '@/lib/platform/is-native'

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'

type SubscriptionData = {
  provider: string
  supportsSelfService: boolean
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  nextDueDate?: string
  billingType?: BillingType
  value?: number
  cycle?: string
  asaasStatus?: string
}

type PaymentRow = {
  id: string
  value: number
  status: string
  billingType: BillingType
  dueDate: string
  paymentDate: string | null
  invoiceUrl: string | null
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  // dueDate/paymentDate do Asaas vêm como YYYY-MM-DD; period_end como ISO.
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function paymentStatusLabel(s: string): { text: string; color: string } {
  switch (s) {
    case 'CONFIRMED':
    case 'RECEIVED':
      return { text: 'Paga', color: 'var(--success)' }
    case 'PENDING':
      return { text: 'Pendente', color: 'var(--warning)' }
    case 'OVERDUE':
      return { text: 'Atrasada', color: 'var(--warning)' }
    case 'REFUNDED':
      return { text: 'Reembolsada', color: 'var(--text-3)' }
    default:
      return { text: s, color: 'var(--text-3)' }
  }
}

function billingTypeLabel(t: BillingType): string {
  switch (t) {
    case 'PIX':
      return 'PIX'
    case 'BOLETO':
      return 'Boleto'
    case 'CREDIT_CARD':
      return 'Cartão de crédito'
    default:
      return '—'
  }
}

export default function AssinaturaSection() {
  const { isPremium, loading, plano, status, fonte, refresh } = useSubscription()
  const [sub, setSub] = useState<SubscriptionData | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [fetching, setFetching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [native, setNative] = useState(false)

  // Sheets/diálogos inline
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const [editingCard, setEditingCard] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    setNative(isNativePlatform())
  }, [])

  const loadSubscription = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/payments/subscription')
      const data = await res.json()
      if (res.ok) {
        setSub(data.subscription ?? null)
        setPayments(data.payments ?? [])
      }
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    if (isPremium) loadSubscription()
  }, [refresh, isPremium, loadSubscription])

  const fonteGerenciavel = fonte && fonte !== 'admin_role'
  const usaRevenueCat = fonte === 'revenuecat'
  const usaAsaas = sub?.provider === 'asaas' && sub.supportsSelfService

  function flash(kind: 'info' | 'error', msg: string) {
    if (kind === 'info') setInfo(msg)
    else setError(msg)
    setTimeout(() => {
      if (kind === 'info') setInfo(null)
      else setError(null)
    }, 4500)
  }

  async function abrirPortal() {
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
      flash('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function salvarNovaData() {
    if (!dateValue) return
    setBusy(true)
    try {
      const res = await fetch('/api/payments/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextDueDate: dateValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao atualizar')
      flash('info', 'Data de vencimento atualizada.')
      setEditingDate(false)
      await loadSubscription()
    } catch (err) {
      flash('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function trocarParaPix() {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingType: 'PIX' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao atualizar')
      flash('info', 'Forma de pagamento alterada para PIX.')
      await loadSubscription()
    } catch (err) {
      flash('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function trocarParaBoleto() {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingType: 'BOLETO' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao atualizar')
      flash('info', 'Forma de pagamento alterada para boleto.')
      await loadSubscription()
    } catch (err) {
      flash('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function cancelarAsaas() {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao cancelar')
      flash('info', 'Assinatura cancelada. Acesso ativo até o fim do período.')
      setConfirmCancel(false)
      await refresh()
      await loadSubscription()
    } catch (err) {
      flash('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const expiraFmt = formatDate(sub?.currentPeriodEnd)
  const nextDueFmt = formatDate(sub?.nextDueDate)

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2
          className="text-lg mb-1"
          style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-1)' }}
        >
          Minha assinatura
        </h2>
        <p
          className="text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Gerencie seu plano, método de pagamento e histórico de cobranças.
        </p>
      </div>

      {loading ? (
        <div
          className="py-10 text-center text-sm"
          style={{ color: 'var(--text-3)' }}
        >
          Carregando…
        </div>
      ) : !isPremium ? (
        <NotSubscribedCard />
      ) : (
        <PlanSummaryCard
          plano={plano}
          status={status}
          expiraFmt={expiraFmt}
          cancelAtPeriodEnd={sub?.cancelAtPeriodEnd ?? false}
        />
      )}

      {error && <Alert tom="erro">{error}</Alert>}
      {info && <Alert tom="ok">{info}</Alert>}

      {/* Asaas self-service */}
      {isPremium && usaAsaas && sub && status !== 'canceled' && (
        <div
          className="rounded-2xl p-5 mb-3"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          {/* Próximo vencimento */}
          <DataRow
            icon={<CalendarClock className="w-4 h-4" />}
            label="Próximo vencimento"
            value={nextDueFmt ?? '—'}
            action={
              !editingDate ? (
                <button
                  type="button"
                  className="text-xs"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => {
                    setDateValue(sub.nextDueDate ?? '')
                    setEditingDate(true)
                  }}
                >
                  Alterar
                </button>
              ) : null
            }
          />
          {editingDate && (
            <div className="mt-2 mb-4 flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
                value={dateValue}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setDateValue(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={salvarNovaData}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: 'var(--accent)',
                  color: '#0F0E0C',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {busy ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setEditingDate(false)}
                className="px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Forma de pagamento */}
          <DataRow
            icon={<CreditCard className="w-4 h-4" />}
            label="Forma de pagamento"
            value={billingTypeLabel(sub.billingType ?? 'UNDEFINED')}
          />
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            <ActionChip
              active={sub.billingType === 'PIX'}
              disabled={busy || sub.billingType === 'PIX'}
              onClick={trocarParaPix}
            >
              Usar PIX
            </ActionChip>
            <ActionChip
              active={sub.billingType === 'BOLETO'}
              disabled={busy || sub.billingType === 'BOLETO'}
              onClick={trocarParaBoleto}
            >
              Usar boleto
            </ActionChip>
            <ActionChip
              active={sub.billingType === 'CREDIT_CARD'}
              disabled={busy}
              onClick={() => setEditingCard(true)}
            >
              {sub.billingType === 'CREDIT_CARD'
                ? 'Trocar cartão'
                : 'Usar cartão'}
            </ActionChip>
          </div>

          {/* Valor */}
          <DataRow
            icon={<Receipt className="w-4 h-4" />}
            label="Valor"
            value={sub.value ? formatBRL(sub.value) : '—'}
          />
        </div>
      )}

      {/* Histórico */}
      {isPremium && usaAsaas && payments.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-3"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <h3
            className="text-xs uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Histórico de cobranças
          </h3>
          <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border-1)' }}>
            {payments.map(p => {
              const stat = paymentStatusLabel(p.status)
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-3 gap-3"
                >
                  <div className="min-w-0">
                    <p
                      className="text-sm"
                      style={{
                        color: 'var(--text-1)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {formatBRL(p.value)}
                      <span
                        className="ml-2 text-[11px]"
                        style={{ color: stat.color }}
                      >
                        {stat.text}
                      </span>
                    </p>
                    <p
                      className="text-[11px]"
                      style={{
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {billingTypeLabel(p.billingType)} •{' '}
                      {p.paymentDate
                        ? `Pago em ${formatDate(p.paymentDate)}`
                        : `Vence em ${formatDate(p.dueDate)}`}
                    </p>
                  </div>
                  {p.invoiceUrl && (
                    <a
                      href={p.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs"
                      style={{ color: 'var(--accent)' }}
                    >
                      Ver fatura
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Botão portal (Stripe/RevenueCat) */}
      {isPremium && fonteGerenciavel && !usaAsaas && (
        <button
          type="button"
          onClick={abrirPortal}
          disabled={busy}
          className="w-full py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98] mb-3"
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

      {/* Cancelar (Asaas) */}
      {isPremium && usaAsaas && status !== 'canceled' && (
        <div className="flex flex-col gap-2">
          {!confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={busy}
              className="w-full py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
              style={{
                background: 'transparent',
                border:
                  '1px solid color-mix(in srgb, var(--warning) 35%, transparent)',
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
                border:
                  '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
              }}
            >
              <p
                className="text-xs mb-3"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Tem certeza? Você manterá o acesso até o fim do período pago.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-lg text-xs"
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
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--warning)',
                    color: '#0F0E0C',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {busy ? 'Cancelando…' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {fetching && !sub && (
        <div className="flex items-center gap-2 text-xs text-center mt-2" style={{ color: 'var(--text-3)' }}>
          <Loader2 className="w-3 h-3 animate-spin" /> Carregando assinatura…
        </div>
      )}

      {/* Sheet trocar cartão */}
      {editingCard && (
        <CreditCardSheet
          onClose={() => setEditingCard(false)}
          onSuccess={async () => {
            setEditingCard(false)
            flash('info', 'Cartão atualizado. Próximas cobranças vão usar o novo cartão.')
            await loadSubscription()
          }}
          onError={msg => flash('error', msg)}
        />
      )}
    </section>
  )
}

function NotSubscribedCard() {
  return (
    <div
      className="p-5 rounded-2xl mb-4 text-center"
      style={{
        background: 'var(--surface-inset)',
        border: '1px dashed var(--border-1)',
      }}
    >
      <p
        className="text-sm mb-4"
        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
      >
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
  )
}

function PlanSummaryCard({
  plano,
  status,
  expiraFmt,
  cancelAtPeriodEnd,
}: {
  plano: string | null
  status: string | null
  expiraFmt: string | null
  cancelAtPeriodEnd: boolean
}) {
  return (
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
            background:
              'color-mix(in srgb, var(--success) 15%, transparent)',
            color: 'var(--success)',
            border:
              '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {status === 'trialing' ? 'Em avaliação' : 'Ativo'}
        </span>
      </div>
      {expiraFmt && (
        <p
          className="text-xs mb-1"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          {cancelAtPeriodEnd
            ? `Acesso até ${expiraFmt} (não renovará)`
            : `Próxima cobrança: ${expiraFmt}`}
        </p>
      )}
    </div>
  )
}

function DataRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2 min-w-0">
        <span style={{ color: 'var(--text-3)' }}>{icon}</span>
        <span
          className="text-[11px] uppercase tracking-wider"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="text-sm truncate"
          style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
        >
          {value}
        </span>
        {action}
      </div>
    </div>
  )
}

function ActionChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-xs px-3 py-2 rounded-lg disabled:opacity-50"
      style={{
        background: active
          ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
          : 'var(--surface-inset)',
        border: active
          ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
          : '1px solid var(--border-1)',
        color: active ? 'var(--accent)' : 'var(--text-1)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </button>
  )
}

function Alert({
  tom,
  children,
}: {
  tom: 'ok' | 'erro'
  children: React.ReactNode
}) {
  const isOk = tom === 'ok'
  return (
    <div
      className="mb-4 p-3 rounded-xl text-xs"
      style={{
        background: isOk
          ? 'color-mix(in srgb, var(--success) 12%, transparent)'
          : 'rgba(230,126,34,0.12)',
        border: isOk
          ? '1px solid color-mix(in srgb, var(--success) 30%, transparent)'
          : '1px solid rgba(230,126,34,0.3)',
        color: isOk ? 'var(--success)' : '#E67E22',
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </div>
  )
}

// --------------------------------------------------------------------------
// Sheet: trocar cartão
// --------------------------------------------------------------------------

function CreditCardSheet({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    phone: '',
  })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/payments/subscription/credit-card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditCard: {
            holderName: form.holderName.trim(),
            number: form.number.replace(/\D/g, ''),
            expiryMonth: form.expiryMonth.padStart(2, '0'),
            expiryYear: form.expiryYear,
            ccv: form.ccv,
          },
          creditCardHolderInfo: {
            name: form.name.trim() || form.holderName.trim(),
            email: form.email.trim(),
            cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
            postalCode: form.postalCode.replace(/\D/g, ''),
            addressNumber: form.addressNumber.trim(),
            phone: form.phone.replace(/\D/g, '') || undefined,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao trocar cartão')
      onSuccess()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <form
        onSubmit={salvar}
        className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-base"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
            }}
          >
            Trocar cartão
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{ color: 'var(--text-3)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p
          className="text-[11px] mb-4"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Não armazenamos seu cartão — os dados vão direto para a Asaas
          (PCI Level 1).
        </p>

        <Field label="Nome impresso no cartão">
          <input
            required
            value={form.holderName}
            onChange={e => set('holderName', e.target.value)}
            className="form-input"
            style={inputStyle}
          />
        </Field>
        <Field label="Número do cartão">
          <input
            required
            inputMode="numeric"
            value={form.number}
            onChange={e => set('number', e.target.value)}
            placeholder="0000 0000 0000 0000"
            className="form-input"
            style={inputStyle}
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Mês">
            <input
              required
              inputMode="numeric"
              maxLength={2}
              value={form.expiryMonth}
              onChange={e => set('expiryMonth', e.target.value)}
              placeholder="MM"
              style={inputStyle}
            />
          </Field>
          <Field label="Ano">
            <input
              required
              inputMode="numeric"
              maxLength={4}
              value={form.expiryYear}
              onChange={e => set('expiryYear', e.target.value)}
              placeholder="YYYY"
              style={inputStyle}
            />
          </Field>
          <Field label="CCV">
            <input
              required
              inputMode="numeric"
              maxLength={4}
              value={form.ccv}
              onChange={e => set('ccv', e.target.value)}
              placeholder="123"
              style={inputStyle}
            />
          </Field>
        </div>

        <div className="h-px my-4" style={{ background: 'var(--border-1)' }} />

        <p
          className="text-[11px] mb-2 uppercase tracking-wider"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Dados do titular
        </p>

        <Field label="Nome completo">
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Mesmo do cartão (se vazio)"
            style={inputStyle}
          />
        </Field>
        <Field label="E-mail">
          <input
            required
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="CPF/CNPJ">
          <input
            required
            inputMode="numeric"
            value={form.cpfCnpj}
            onChange={e => set('cpfCnpj', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="CEP">
            <input
              required
              inputMode="numeric"
              value={form.postalCode}
              onChange={e => set('postalCode', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Número">
            <input
              required
              value={form.addressNumber}
              onChange={e => set('addressNumber', e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Telefone (opcional)">
          <input
            inputMode="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            style={inputStyle}
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl text-sm mt-3 font-medium"
          style={{
            background: 'var(--accent)',
            color: '#0F0E0C',
            fontFamily: 'var(--font-body)',
          }}
        >
          {busy ? 'Validando cartão…' : 'Salvar cartão'}
        </button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-inset)',
  border: '1px solid var(--border-1)',
  color: 'var(--text-1)',
  fontFamily: 'var(--font-body)',
  padding: '10px 12px',
  borderRadius: '10px',
  fontSize: '14px',
  width: '100%',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <label
        className="block text-[10px] uppercase tracking-wider mb-1"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
