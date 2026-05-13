'use client'

/**
 * Checkout customizado Veritas — UI client.
 *
 * Layout 2-col (desktop) / stacked (mobile), inspirado em Stripe Link /
 * Mercado Livre / Hubla:
 *   - ESQUERDA: resumo do produto, valor, benefícios completos, badges
 *     de confiança. Sticky em telas grandes.
 *   - DIREITA: formulário em duas etapas. Etapa 1 coleta nome / e-mail /
 *     CPF / celular (exigência do Asaas). Etapa 2 escolhe o método e
 *     finaliza (PIX | Boleto | Cartão). Apenas a etapa 2 troca de
 *     conteúdo conforme o método; o cabeçalho com dados pessoais não
 *     pisca a cada troca.
 *
 * O Asaas rejeita qualquer cobrança sem `cpfCnpj` no customer (PIX
 * inclusive). Por isso o form unificado: o `/api/payments/asaas/charge`
 * faz POST /v3/customers/:id antes de criar a subscription.
 *
 * Cores respeitam billing_checkout_settings (admin tweakaable).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  Copy,
  CreditCard,
  FileText,
  Lock,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type Settings = {
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  headerTitle: string
  headerSubtitle: string
  footerText: string
  allowPix: boolean
  allowBoleto: boolean
  allowCreditCard: boolean
  installmentsMax: number
}

type Plan = {
  nome: string
  descricao: string | null
  beneficios: string[]
}

type User = { email: string; name: string }

type Props = {
  sessionId: string
  amountCents: number
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  plan: Plan
  settings: Settings
  user: User
}

type PaymentMethod = 'pix' | 'boleto' | 'credit_card'

type PixState = {
  encodedImage: string
  payload: string
  expirationDate: string
  paymentId: string
  invoiceUrl: string | null
}

type BoletoState = {
  bankSlipUrl: string | null
  dueDate: string
  paymentId: string
  invoiceUrl: string | null
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function intervaloLabel(i: Props['intervalo']) {
  return {
    mensal: '/ mês',
    semestral: '/ 6 meses',
    anual: '/ ano',
    unico: 'pagamento único',
  }[i]
}

function maskCard(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function maskCpfCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function maskCep(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3').trim()
  }
  return d.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3').trim()
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, '')
}

export default function CheckoutClient({
  sessionId,
  amountCents,
  intervalo,
  plan,
  settings,
  user,
}: Props) {
  const availableTabs: PaymentMethod[] = useMemo(() => {
    const t: PaymentMethod[] = []
    if (settings.allowPix) t.push('pix')
    if (settings.allowBoleto) t.push('boleto')
    if (settings.allowCreditCard) t.push('credit_card')
    return t
  }, [settings.allowPix, settings.allowBoleto, settings.allowCreditCard])

  const [tab, setTab] = useState<PaymentMethod>(availableTabs[0] ?? 'pix')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pix, setPix] = useState<PixState | null>(null)
  const [boleto, setBoleto] = useState<BoletoState | null>(null)
  const [paid, setPaid] = useState(false)
  const [copyHint, setCopyHint] = useState(false)
  const [cardSubmitted, setCardSubmitted] = useState<
    null | 'CONFIRMED' | 'PENDING' | string
  >(null)

  // Dados pessoais (sempre obrigatórios — Asaas exige).
  const [customer, setCustomer] = useState({
    name: user.name,
    email: user.email,
    cpfCnpj: '',
    mobilePhone: '',
  })

  // Cartão
  const [card, setCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  })
  const [address, setAddress] = useState({
    postalCode: '',
    addressNumber: '',
    addressComplement: '',
  })
  const [installments, setInstallments] = useState(1)

  // Polling: roda quando temos pix ativo, boleto ativo OU cartão submetido.
  const polling = !!pix || !!boleto || cardSubmitted !== null
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!polling || paid) return
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/payments/asaas/status?sessionId=${sessionId}`,
          { cache: 'no-store' },
        )
        const data = (await res.json()) as { paid?: boolean }
        if (data.paid) {
          setPaid(true)
          setTimeout(() => {
            window.location.href = '/perfil?tab=assinatura&status=success'
          }, 1500)
        }
      } catch {
        // Silencioso — tenta de novo no próximo tick.
      }
    }
    pollRef.current = setInterval(tick, 3000)
    tick()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [polling, paid, sessionId])

  // Validação rápida: customer com cpfCnpj é o mínimo pra PIX/Boleto.
  // Pra cartão exige endereço + cartão.
  const customerValid = useMemo(() => {
    if (!customer.name.trim()) return false
    if (!/^\S+@\S+\.\S+$/.test(customer.email.trim())) return false
    const d = digitsOnly(customer.cpfCnpj)
    return d.length === 11 || d.length === 14
  }, [customer])

  function buildCustomerPayload() {
    return {
      name: customer.name.trim(),
      email: customer.email.trim(),
      cpfCnpj: digitsOnly(customer.cpfCnpj),
      mobilePhone: digitsOnly(customer.mobilePhone) || undefined,
    }
  }

  async function startPix() {
    setError(null)
    if (!customerValid) {
      setError('Preencha seu nome, e-mail e CPF antes de continuar.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/asaas/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          method: 'pix',
          customer: buildCustomerPayload(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao gerar PIX')
      if (!data.pix) throw new Error('PIX retornou sem QR. Tente novamente.')
      setPix({
        encodedImage: data.pix.encodedImage,
        payload: data.pix.payload,
        expirationDate: data.pix.expirationDate,
        paymentId: data.paymentId,
        invoiceUrl: data.invoiceUrl ?? null,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function startBoleto() {
    setError(null)
    if (!customerValid) {
      setError('Preencha seu nome, e-mail e CPF antes de continuar.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/asaas/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          method: 'boleto',
          customer: buildCustomerPayload(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao gerar boleto')
      setBoleto({
        bankSlipUrl: data.boleto?.bankSlipUrl ?? null,
        dueDate: data.boleto?.dueDate ?? '',
        paymentId: data.paymentId,
        invoiceUrl: data.invoiceUrl ?? null,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function submitCard(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!customerValid) {
      setError('Preencha seus dados antes de continuar.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/asaas/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          method: 'credit_card',
          customer: buildCustomerPayload(),
          card: {
            holderName: card.holderName.trim(),
            number: card.number.replace(/\s+/g, ''),
            expiryMonth: card.expiryMonth.trim(),
            expiryYear: card.expiryYear.trim(),
            ccv: card.ccv.trim(),
          },
          address: {
            postalCode: digitsOnly(address.postalCode),
            addressNumber: address.addressNumber.trim(),
            addressComplement: address.addressComplement.trim() || undefined,
          },
          installments,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao processar cartão')
      setCardSubmitted(data.status ?? 'PENDING')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  async function copyPayload() {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.payload)
      setCopyHint(true)
      setTimeout(() => setCopyHint(false), 1800)
    } catch {
      // Usuário pode selecionar manualmente — não bloqueia.
    }
  }

  const cssVars: React.CSSProperties = {
    ['--cks-primary' as string]: settings.primaryColor,
    ['--cks-accent' as string]: settings.accentColor,
    ['--cks-bg' as string]: settings.backgroundColor,
    ['--cks-text' as string]: settings.textColor,
    background: `radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, ${settings.primaryColor} 6%, transparent), transparent 70%), ${settings.backgroundColor}`,
    color: settings.textColor,
    minHeight: '100vh',
  }

  // Etapa "finalizada" — pagamento confirmado pelo polling.
  if (paid) {
    return (
      <main style={cssVars} className="px-4 py-16 flex items-center justify-center">
        <section
          className="max-w-md w-full p-8 rounded-3xl text-center"
          style={{
            background: 'color-mix(in srgb, #66BB6A 14%, transparent)',
            border: '1px solid #66BB6A',
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-[#66BB6A]/20">
            <Check className="w-7 h-7" style={{ color: '#66BB6A' }} />
          </div>
          <div
            className="text-xl mb-1"
            style={{ color: '#66BB6A', fontFamily: 'var(--font-elegant)', fontWeight: 600 }}
          >
            Pagamento confirmado
          </div>
          <div
            className="text-sm"
            style={{
              color: 'color-mix(in srgb, var(--cks-text) 75%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Redirecionando pro seu perfil…
          </div>
        </section>
      </main>
    )
  }

  return (
    <main style={cssVars} className="px-4 py-8 md:py-12 lg:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Topo: logo + titulo, compacto */}
        <header className="flex flex-col items-center text-center mb-8 md:mb-12">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt="Veritas"
              width={56}
              height={56}
              className="h-14 w-auto object-contain mb-3"
              unoptimized
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
              style={{
                background:
                  'color-mix(in srgb, var(--cks-primary) 18%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--cks-primary) 35%, transparent)',
              }}
            >
              <Sparkles
                className="w-5 h-5"
                style={{ color: 'var(--cks-primary)' }}
              />
            </div>
          )}
          <h1
            className="text-2xl md:text-3xl mb-1"
            style={{
              fontFamily: 'var(--font-elegant, var(--font-display))',
              color: 'var(--cks-text)',
            }}
          >
            {settings.headerTitle}
          </h1>
          <p
            className="text-sm max-w-md"
            style={{
              color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {settings.headerSubtitle}
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10 items-start">
          {/* ─── ESQUERDA: Resumo do produto ─── */}
          <aside className="lg:sticky lg:top-10 order-2 lg:order-1">
            <ProductSummary
              plan={plan}
              amountCents={amountCents}
              intervalo={intervalo}
            />

            <div
              className="mt-4 p-4 rounded-2xl flex items-start gap-3 text-xs"
              style={{
                background:
                  'color-mix(in srgb, var(--cks-text) 4%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
                color:
                  'color-mix(in srgb, var(--cks-text) 75%, transparent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Lock
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--cks-primary)' }}
              />
              <div>
                <p
                  className="font-medium mb-0.5"
                  style={{ color: 'var(--cks-text)' }}
                >
                  Pagamento seguro
                </p>
                <p>
                  Processado pela Asaas (PCI Level 1). Cancele quando quiser pelo seu perfil.
                </p>
              </div>
            </div>
          </aside>

          {/* ─── DIREITA: Form ─── */}
          <section className="order-1 lg:order-2">
            {/* Etapa 1 — Dados do cliente */}
            <Card>
              <StepBadge number={1}>Seus dados</StepBadge>

              <Field label="Nome completo">
                <input
                  type="text"
                  autoComplete="name"
                  value={customer.name}
                  onChange={e =>
                    setCustomer(c => ({ ...c, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-3 rounded-xl outline-none"
                  style={inputStyle()}
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <Field label="E-mail">
                  <input
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={e =>
                      setCustomer(c => ({ ...c, email: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-3 rounded-xl outline-none"
                    style={inputStyle()}
                  />
                </Field>
                <Field label="CPF / CNPJ">
                  <input
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={maskCpfCnpj(customer.cpfCnpj)}
                    onChange={e =>
                      setCustomer(c => ({ ...c, cpfCnpj: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-3 rounded-xl outline-none"
                    style={inputStyle()}
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="Celular (opcional)">
                  <input
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    value={maskPhone(customer.mobilePhone)}
                    onChange={e =>
                      setCustomer(c => ({ ...c, mobilePhone: e.target.value }))
                    }
                    className="w-full px-3 py-3 rounded-xl outline-none"
                    style={inputStyle()}
                  />
                </Field>
              </div>
            </Card>

            {/* Etapa 2 — Forma de pagamento */}
            <div className="mt-4">
              <Card>
                <StepBadge number={2}>Forma de pagamento</StepBadge>

                {availableTabs.length > 1 && (
                  <div
                    className="grid gap-2 p-1 rounded-2xl mt-1 mb-5"
                    style={{
                      gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)`,
                      background:
                        'color-mix(in srgb, var(--cks-text) 5%, transparent)',
                      border:
                        '1px solid color-mix(in srgb, var(--cks-text) 10%, transparent)',
                    }}
                  >
                    {availableTabs.map(t => {
                      const active = t === tab
                      const Icon =
                        t === 'pix'
                          ? QrCode
                          : t === 'boleto'
                            ? FileText
                            : CreditCard
                      const label =
                        t === 'pix'
                          ? 'PIX'
                          : t === 'boleto'
                            ? 'Boleto'
                            : 'Cartão'
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTab(t)}
                          className="px-3 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                          style={{
                            background: active
                              ? 'var(--cks-primary)'
                              : 'transparent',
                            color: active
                              ? 'var(--cks-accent)'
                              : 'var(--cks-text)',
                            fontFamily: 'var(--font-body)',
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {error && (
                  <div
                    className="mb-4 p-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(230,126,34,0.12)',
                      border: '1px solid rgba(230,126,34,0.35)',
                      color: '#E67E22',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {error}
                  </div>
                )}

                {tab === 'pix' && (
                  <PixPanel
                    pix={pix}
                    loading={loading}
                    onStart={startPix}
                    onCopy={copyPayload}
                    copyHint={copyHint}
                  />
                )}

                {tab === 'boleto' && (
                  <BoletoPanel
                    boleto={boleto}
                    loading={loading}
                    onStart={startBoleto}
                  />
                )}

                {tab === 'credit_card' && (
                  <CardForm
                    card={card}
                    setCard={setCard}
                    address={address}
                    setAddress={setAddress}
                    installments={installments}
                    setInstallments={setInstallments}
                    installmentsMax={settings.installmentsMax}
                    amountCents={amountCents}
                    submitted={cardSubmitted}
                    onSubmit={submitCard}
                    loading={loading}
                  />
                )}
              </Card>
            </div>

            <div
              className="flex items-center justify-center gap-2 text-[11px] mt-5"
              style={{
                color:
                  'color-mix(in srgb, var(--cks-text) 55%, transparent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {settings.footerText}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

// --------------------------------------------------------------------------
// Subcomponentes
// --------------------------------------------------------------------------

function ProductSummary({
  plan,
  amountCents,
  intervalo,
}: {
  plan: Plan
  amountCents: number
  intervalo: Props['intervalo']
}) {
  return (
    <div
      className="rounded-3xl p-6 md:p-7 overflow-hidden relative"
      style={{
        background:
          'linear-gradient(140deg, color-mix(in srgb, var(--cks-primary) 14%, transparent), color-mix(in srgb, var(--cks-text) 4%, transparent))',
        border:
          '1px solid color-mix(in srgb, var(--cks-primary) 25%, transparent)',
      }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.2em] mb-2"
        style={{
          color: 'var(--cks-primary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Resumo da assinatura
      </p>
      <h2
        className="text-xl md:text-2xl mb-1"
        style={{
          fontFamily: 'var(--font-elegant, var(--font-display))',
          color: 'var(--cks-text)',
        }}
      >
        {plan.nome}
      </h2>
      {plan.descricao && (
        <p
          className="text-xs mb-5"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {plan.descricao}
        </p>
      )}

      <div className="flex items-baseline gap-1.5 mb-5">
        <span
          className="text-3xl md:text-4xl"
          style={{
            color: 'var(--cks-primary)',
            fontFamily: 'var(--font-elegant, var(--font-display))',
            fontWeight: 700,
          }}
        >
          {formatBRL(amountCents)}
        </span>
        <span
          className="text-xs"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 65%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {intervaloLabel(intervalo)}
        </span>
      </div>

      {plan.beneficios.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {plan.beneficios.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-xs"
              style={{
                color: 'color-mix(in srgb, var(--cks-text) 85%, transparent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background:
                    'color-mix(in srgb, var(--cks-primary) 20%, transparent)',
                  border:
                    '1px solid color-mix(in srgb, var(--cks-primary) 35%, transparent)',
                }}
              >
                <Check className="w-2.5 h-2.5" style={{ color: 'var(--cks-primary)' }} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PixPanel({
  pix,
  loading,
  onStart,
  onCopy,
  copyHint,
}: {
  pix: PixState | null
  loading: boolean
  onStart: () => void
  onCopy: () => void
  copyHint: boolean
}) {
  if (!pix) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--cks-primary)',
          color: 'var(--cks-accent)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <QrCode className="w-4 h-4" />
            Gerar PIX agora
          </>
        )}
      </button>
    )
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-3 rounded-2xl">
        <Image
          src={`data:image/png;base64,${pix.encodedImage}`}
          alt="QR Code PIX"
          width={220}
          height={220}
          className="block"
          unoptimized
        />
      </div>
      <div
        className="text-xs text-center max-w-xs"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
        }}
      >
        Aponte a câmera do seu app de banco — ou copie o código abaixo.
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="w-full px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
        style={{
          background: 'color-mix(in srgb, var(--cks-primary) 15%, transparent)',
          border:
            '1px solid color-mix(in srgb, var(--cks-primary) 35%, transparent)',
          color: 'var(--cks-primary)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
        }}
      >
        {copyHint ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copiar código PIX
          </>
        )}
      </button>
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
        }}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Aguardando confirmação do pagamento…
      </div>
      {pix.invoiceUrl && (
        <a
          href={pix.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] underline"
          style={{ color: 'var(--cks-primary)' }}
        >
          Abrir fatura completa
        </a>
      )}
    </div>
  )
}

function BoletoPanel({
  boleto,
  loading,
  onStart,
}: {
  boleto: BoletoState | null
  loading: boolean
  onStart: () => void
}) {
  if (!boleto) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--cks-primary)',
          color: 'var(--cks-accent)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Gerar boleto
          </>
        )}
      </button>
    )
  }
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'color-mix(in srgb, var(--cks-primary) 15%, transparent)',
          border:
            '1px solid color-mix(in srgb, var(--cks-primary) 35%, transparent)',
        }}
      >
        <FileText className="w-6 h-6" style={{ color: 'var(--cks-primary)' }} />
      </div>
      <div
        className="text-sm"
        style={{ color: 'var(--cks-text)', fontFamily: 'var(--font-body)' }}
      >
        Boleto gerado.
      </div>
      <div
        className="text-xs"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 65%, transparent)',
        }}
      >
        Vencimento: {boleto.dueDate}
      </div>
      {boleto.bankSlipUrl && (
        <a
          href={boleto.bankSlipUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
          style={{
            background: 'var(--cks-primary)',
            color: 'var(--cks-accent)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          Abrir boleto
        </a>
      )}
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
        }}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Liberaremos o acesso assim que a compensação chegar.
      </div>
    </div>
  )
}

function CardForm({
  card,
  setCard,
  address,
  setAddress,
  installments,
  setInstallments,
  installmentsMax,
  amountCents,
  submitted,
  onSubmit,
  loading,
}: {
  card: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  setCard: React.Dispatch<
    React.SetStateAction<{
      holderName: string
      number: string
      expiryMonth: string
      expiryYear: string
      ccv: string
    }>
  >
  address: {
    postalCode: string
    addressNumber: string
    addressComplement: string
  }
  setAddress: React.Dispatch<
    React.SetStateAction<{
      postalCode: string
      addressNumber: string
      addressComplement: string
    }>
  >
  installments: number
  setInstallments: (n: number) => void
  installmentsMax: number
  amountCents: number
  submitted: null | string
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
}) {
  if (submitted) {
    return (
      <div className="text-center py-8">
        <Loader2
          className="w-8 h-8 animate-spin mx-auto mb-3"
          style={{ color: 'var(--cks-primary)' }}
        />
        <div
          className="text-sm"
          style={{
            color: 'var(--cks-text)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Confirmando seu pagamento…
        </div>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Número do cartão">
        <input
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={card.number}
          onChange={e =>
            setCard(c => ({ ...c, number: maskCard(e.target.value) }))
          }
          required
          className="w-full px-3 py-3 rounded-xl outline-none"
          style={inputStyle()}
        />
      </Field>
      <Field label="Nome impresso no cartão">
        <input
          autoComplete="cc-name"
          value={card.holderName}
          onChange={e =>
            setCard(c => ({ ...c, holderName: e.target.value }))
          }
          required
          className="w-full px-3 py-3 rounded-xl outline-none"
          style={inputStyle()}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Mês">
          <input
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            maxLength={2}
            value={card.expiryMonth}
            onChange={e =>
              setCard(c => ({
                ...c,
                expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
              }))
            }
            required
            className="w-full px-3 py-3 rounded-xl outline-none"
            style={inputStyle()}
          />
        </Field>
        <Field label="Ano">
          <input
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AAAA"
            maxLength={4}
            value={card.expiryYear}
            onChange={e =>
              setCard(c => ({
                ...c,
                expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4),
              }))
            }
            required
            className="w-full px-3 py-3 rounded-xl outline-none"
            style={inputStyle()}
          />
        </Field>
        <Field label="CVV">
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            value={card.ccv}
            onChange={e =>
              setCard(c => ({
                ...c,
                ccv: e.target.value.replace(/\D/g, '').slice(0, 4),
              }))
            }
            required
            className="w-full px-3 py-3 rounded-xl outline-none"
            style={inputStyle()}
          />
        </Field>
      </div>

      <div
        className="text-[11px] uppercase tracking-wider mt-3 mb-0"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 50%, transparent)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Endereço de cobrança
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="CEP">
          <input
            inputMode="numeric"
            placeholder="00000-000"
            value={maskCep(address.postalCode)}
            onChange={e =>
              setAddress(a => ({ ...a, postalCode: e.target.value }))
            }
            required
            className="w-full px-3 py-3 rounded-xl outline-none"
            style={inputStyle()}
          />
        </Field>
        <Field label="Número">
          <input
            placeholder="123"
            value={address.addressNumber}
            onChange={e =>
              setAddress(a => ({ ...a, addressNumber: e.target.value }))
            }
            required
            className="w-full px-3 py-3 rounded-xl outline-none"
            style={inputStyle()}
          />
        </Field>
      </div>
      <Field label="Complemento (opcional)">
        <input
          value={address.addressComplement}
          onChange={e =>
            setAddress(a => ({ ...a, addressComplement: e.target.value }))
          }
          className="w-full px-3 py-3 rounded-xl outline-none"
          style={inputStyle()}
        />
      </Field>

      {installmentsMax > 1 && (
        <Field label="Parcelas">
          <select
            value={installments}
            onChange={e => setInstallments(Number(e.target.value))}
            className="w-full px-3 py-3 rounded-xl outline-none"
            style={inputStyle()}
          >
            {Array.from({ length: installmentsMax }).map((_, i) => {
              const n = i + 1
              return (
                <option key={n} value={n}>
                  {n}x de {formatBRL(Math.round(amountCents / n))}
                </option>
              )
            })}
          </select>
        </Field>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-3 px-5 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--cks-primary)',
          color: 'var(--cks-accent)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pagar {formatBRL(amountCents)}
          </>
        )}
      </button>
    </form>
  )
}

// --------------------------------------------------------------------------
// UI utilitários
// --------------------------------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="p-5 md:p-6 rounded-3xl"
      style={{
        background:
          'color-mix(in srgb, var(--cks-text) 4%, transparent)',
        border:
          '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </section>
  )
}

function StepBadge({
  number,
  children,
}: {
  number: number
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium"
        style={{
          background:
            'color-mix(in srgb, var(--cks-primary) 20%, transparent)',
          border:
            '1px solid color-mix(in srgb, var(--cks-primary) 40%, transparent)',
          color: 'var(--cks-primary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {number}
      </span>
      <h3
        className="text-base"
        style={{
          color: 'var(--cks-text)',
          fontFamily: 'var(--font-elegant, var(--font-display))',
        }}
      >
        {children}
      </h3>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-[10px] uppercase tracking-wider"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'color-mix(in srgb, var(--cks-text) 5%, transparent)',
    border: '1px solid color-mix(in srgb, var(--cks-text) 15%, transparent)',
    color: 'var(--cks-text)',
    fontFamily: 'var(--font-body)',
  }
}
