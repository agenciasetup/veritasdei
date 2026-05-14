'use client'

/**
 * Checkout Veritas — UI client (clean, baixa fricção).
 *
 * Layout (desktop):
 *   ┌──────────────────────────┐ ┌────────────────┐
 *   │ GLASS                    │ │ flat (sem glass)│
 *   │  produto + preço         │ │  cartão default │
 *   │  benefícios              │ │  form           │
 *   │  seletor de plano        │ │  pagar          │
 *   │  order bumps             │ │                 │
 *   │  dados pessoais          │ │                 │
 *   └──────────────────────────┘ └────────────────┘
 *
 * Mobile: stack na ordem do glass primeiro (produto → seletor →
 * bumps → dados), pagamento por último. Sem brilhos exagerados,
 * tipografia em sans-serif quase tudo.
 *
 * Cartão é o método padrão (vinculado é melhor pra retenção que PIX).
 *
 * "Finalize sua assinatura" foi removido — só logo + linha minimalista
 * de "Pagamento seguro" no rodapé.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  QrCode,
  Sparkles,
  Wifi,
} from 'lucide-react'

// --------------------------------------------------------------------------
// Tipos
// --------------------------------------------------------------------------

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
  codigo?: string
  nome: string
  descricao: string | null
  beneficios: string[]
}

type Intervalo = 'mensal' | 'semestral' | 'anual' | 'unico'

type PriceOption = {
  id: string
  intervalo: Intervalo
  amountCents: number
}

type UserInfo = { email: string; name: string }

type OrderBump = {
  id: string
  codigo: string
  titulo: string
  descricao: string | null
  valor_cents: number
  badge: string | null
}

type Props = {
  sessionId: string
  amountCents: number
  intervalo: Intervalo
  priceId: string
  prices: PriceOption[]
  plan: Plan
  settings: Settings
  user: UserInfo
}

type PaymentMethod = 'credit_card' | 'pix' | 'boleto'

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

type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'elo'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'unknown'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function detectBrand(number: string): CardBrand {
  const n = number.replace(/\D/g, '')
  if (!n) return 'unknown'
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|509[0-9]|6362|6363|6504|6505|6508|6509|6516|6550|6551|6553|6555|627780)/.test(
      n,
    )
  ) {
    return 'elo'
  }
  if (/^(606282|3841)/.test(n) || /^(38|60)/.test(n)) return 'hipercard'
  if (/^4/.test(n)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^3(?:0[0-5]|[68])/.test(n)) return 'diners'
  if (/^6(?:011|5)/.test(n)) return 'discover'
  return 'unknown'
}

const BRAND_THEME: Record<CardBrand, { bg: string; label: string }> = {
  visa: {
    bg: 'linear-gradient(135deg, #1A1F71 0%, #2B388F 60%, #436CD0 100%)',
    label: 'VISA',
  },
  mastercard: {
    bg: 'linear-gradient(135deg, #1F2937 0%, #DC2626 60%, #F59E0B 100%)',
    label: 'mastercard',
  },
  amex: {
    bg: 'linear-gradient(135deg, #006FCF 0%, #0099A8 100%)',
    label: 'AMEX',
  },
  elo: {
    bg: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #F8E122 100%)',
    label: 'elo',
  },
  hipercard: {
    bg: 'linear-gradient(135deg, #7B0F1B 0%, #B7141F 100%)',
    label: 'Hipercard',
  },
  diners: {
    bg: 'linear-gradient(135deg, #1B1F2A 0%, #4A5670 100%)',
    label: 'Diners',
  },
  discover: {
    bg: 'linear-gradient(135deg, #1A1A1A 0%, #FF6000 100%)',
    label: 'Discover',
  },
  unknown: {
    bg: 'linear-gradient(135deg, #2A2A2A 0%, #4A4A4A 100%)',
    label: '',
  },
}

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function intervaloShort(i: Intervalo) {
  return { mensal: '/mês', semestral: '/6 meses', anual: '/ano', unico: '' }[i]
}

function intervaloLabel(i: Intervalo) {
  return { mensal: 'Mensal', semestral: 'Semestral', anual: 'Anual', unico: 'Único' }[i]
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

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------

export default function CheckoutClient({
  sessionId,
  amountCents,
  intervalo: initialIntervalo,
  priceId: initialPriceId,
  prices,
  plan,
  settings,
  user,
}: Props) {
  // Tabs disponíveis. CARTÃO é o default (melhor retenção que PIX).
  const availableTabs: PaymentMethod[] = useMemo(() => {
    const t: PaymentMethod[] = []
    if (settings.allowCreditCard) t.push('credit_card')
    if (settings.allowPix) t.push('pix')
    if (settings.allowBoleto) t.push('boleto')
    return t
  }, [settings.allowCreditCard, settings.allowPix, settings.allowBoleto])

  const [tab, setTab] = useState<PaymentMethod>(availableTabs[0] ?? 'credit_card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pix, setPix] = useState<PixState | null>(null)
  const [boleto, setBoleto] = useState<BoletoState | null>(null)
  const [paid, setPaid] = useState(false)
  const [copyHint, setCopyHint] = useState(false)
  const [cardSubmitted, setCardSubmitted] = useState<
    null | 'CONFIRMED' | 'PENDING' | string
  >(null)

  // Plano selecionado (cliente pode trocar entre mensal/semestral/anual)
  const [currentPriceId, setCurrentPriceId] = useState(initialPriceId)
  const [currentIntervalo, setCurrentIntervalo] = useState<Intervalo>(initialIntervalo)
  const [basePriceCents, setBasePriceCents] = useState(
    prices.find(p => p.id === initialPriceId)?.amountCents ?? amountCents,
  )
  const [switchingPrice, setSwitchingPrice] = useState(false)

  // Customer
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

  const brand = useMemo(() => detectBrand(card.number), [card.number])

  // Bumps
  const [bumps, setBumps] = useState<OrderBump[]>([])
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set())
  const [bumpsTotal, setBumpsTotal] = useState(0)
  const [applyingBumps, setApplyingBumps] = useState(false)

  const currentTotal = basePriceCents + bumpsTotal

  // Carrega bumps
  useEffect(() => {
    if (!plan.codigo) return
    let cancelled = false
    fetch(`/api/checkout/bumps?planCodigo=${encodeURIComponent(plan.codigo)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setBumps((data.bumps ?? []) as OrderBump[])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [plan.codigo])

  // Aplica bumps
  useEffect(() => {
    if (bumps.length === 0) return
    const ctl = new AbortController()
    setApplyingBumps(true)
    fetch('/api/checkout/bumps/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        bumpIds: Array.from(selectedBumps),
      }),
      signal: ctl.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (typeof data?.bumps_cents === 'number') setBumpsTotal(data.bumps_cents)
      })
      .catch(() => {})
      .finally(() => setApplyingBumps(false))
    return () => ctl.abort()
  }, [selectedBumps, sessionId, bumps.length])

  function toggleBump(id: string) {
    setSelectedBumps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Polling
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
      } catch {}
    }
    pollRef.current = setInterval(tick, 3000)
    tick()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [polling, paid, sessionId])

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

  async function selectPrice(option: PriceOption) {
    if (option.id === currentPriceId || switchingPrice) return
    setSwitchingPrice(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/session/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, priceId: option.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao trocar plano')
      setCurrentPriceId(option.id)
      setCurrentIntervalo(option.intervalo)
      setBasePriceCents(data.base_cents ?? option.amountCents)
      setBumpsTotal(data.bumps_cents ?? 0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSwitchingPrice(false)
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
      if (!data.pix) throw new Error('PIX retornou sem QR. Tente de novo.')
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
    } catch {}
  }

  const cssVars: React.CSSProperties = {
    ['--cks-primary' as string]: settings.primaryColor,
    ['--cks-accent' as string]: settings.accentColor,
    ['--cks-bg' as string]: settings.backgroundColor,
    ['--cks-text' as string]: settings.textColor,
    background: settings.backgroundColor,
    color: settings.textColor,
    minHeight: '100vh',
    fontFamily: SANS,
  }

  if (paid) {
    return (
      <main
        style={cssVars}
        className="px-4 py-16 flex items-center justify-center"
      >
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center"
          style={glassStyle()}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-emerald-500/15">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <div
            className="text-lg mb-1 font-semibold"
            style={{ color: 'var(--cks-text)' }}
          >
            Pagamento confirmado
          </div>
          <div
            className="text-sm"
            style={{
              color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
            }}
          >
            Redirecionando pro seu perfil…
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={cssVars} className="px-4 py-8 lg:py-12">
      <div className="max-w-5xl mx-auto">
        {/* Topo enxuto: só logo + selo de segurança */}
        <header className="flex items-center justify-between mb-6 lg:mb-8">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt="Veritas"
              width={36}
              height={36}
              className="h-9 w-auto object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--cks-primary)' }} />
              <span
                className="text-sm font-semibold tracking-wider"
                style={{ color: 'var(--cks-text)' }}
              >
                VERITAS
              </span>
            </div>
          )}
          <div
            className="inline-flex items-center gap-1.5 text-[11px]"
            style={{
              color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
            }}
          >
            <Lock className="w-3 h-3" />
            Pagamento seguro
          </div>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-8 items-start">
          {/* ─── ESQUERDA: GLASS com produto + plano + bumps + dados ─── */}
          <div
            className="rounded-2xl p-5 md:p-7 order-1 lg:order-1"
            style={glassStyle()}
          >
            <ProductHeader
              plan={plan}
              totalCents={currentTotal}
              intervalo={currentIntervalo}
              switching={switchingPrice || applyingBumps}
            />

            {plan.beneficios.length > 0 && (
              <ul className="flex flex-col gap-2 mt-5">
                {plan.beneficios.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[13px]"
                    style={{
                      color:
                        'color-mix(in srgb, var(--cks-text) 82%, transparent)',
                    }}
                  >
                    <Check
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--cks-primary)' }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {prices.length > 1 && (
              <PlanSelector
                prices={prices}
                currentPriceId={currentPriceId}
                onSelect={selectPrice}
                disabled={switchingPrice}
              />
            )}

            {bumps.length > 0 && (
              <BumpsSection
                bumps={bumps}
                selected={selectedBumps}
                onToggle={toggleBump}
              />
            )}

            <div className="mt-7">
              <SectionLabel>Seus dados</SectionLabel>
              <div className="space-y-3 mt-3">
                <Field
                  label="Nome completo"
                  type="text"
                  autoComplete="name"
                  value={customer.name}
                  onChange={v => setCustomer(c => ({ ...c, name: v }))}
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={v => setCustomer(c => ({ ...c, email: v }))}
                  />
                  <Field
                    label="CPF ou CNPJ"
                    inputMode="numeric"
                    value={maskCpfCnpj(customer.cpfCnpj)}
                    onChange={v =>
                      setCustomer(c => ({ ...c, cpfCnpj: v }))
                    }
                  />
                </div>
                <Field
                  label="Celular (opcional)"
                  inputMode="tel"
                  autoComplete="tel"
                  value={maskPhone(customer.mobilePhone)}
                  onChange={v =>
                    setCustomer(c => ({ ...c, mobilePhone: v }))
                  }
                  required={false}
                />
              </div>
            </div>
          </div>

          {/* ─── DIREITA: pagamento direto no fundo (sem glass) ─── */}
          <aside className="order-2 lg:order-2 lg:sticky lg:top-8">
            <div className="px-1">
              <SectionLabel>Forma de pagamento</SectionLabel>

              {availableTabs.length > 1 && (
                <div
                  className="grid gap-1.5 p-1 rounded-xl mt-3 mb-4"
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
                      t === 'pix' ? 'PIX' : t === 'boleto' ? 'Boleto' : 'Cartão'
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className="px-3 py-2.5 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition-colors"
                        style={{
                          background: active
                            ? 'var(--cks-primary)'
                            : 'transparent',
                          color: active
                            ? 'var(--cks-accent)'
                            : 'color-mix(in srgb, var(--cks-text) 80%, transparent)',
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
                  className="mb-3 p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                  }}
                >
                  {error}
                </div>
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
                  amountCents={currentTotal}
                  submitted={cardSubmitted}
                  onSubmit={submitCard}
                  loading={loading}
                  brand={brand}
                />
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

              <div
                className="text-[11px] mt-4 text-center"
                style={{
                  color:
                    'color-mix(in srgb, var(--cks-text) 50%, transparent)',
                }}
              >
                {settings.footerText}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

// --------------------------------------------------------------------------
// Subcomponentes
// --------------------------------------------------------------------------

function ProductHeader({
  plan,
  totalCents,
  intervalo,
  switching,
}: {
  plan: Plan
  totalCents: number
  intervalo: Intervalo
  switching: boolean
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 50%, transparent)',
        }}
      >
        {plan.nome}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span
          className="text-3xl md:text-[2.25rem] transition-opacity tabular-nums"
          style={{
            color: 'var(--cks-text)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            opacity: switching ? 0.5 : 1,
          }}
        >
          {formatBRL(totalCents)}
        </span>
        <span
          className="text-sm"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
          }}
        >
          {intervaloShort(intervalo)}
        </span>
      </div>
      {plan.descricao && (
        <p
          className="text-sm mt-2 max-w-md"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
          }}
        >
          {plan.descricao}
        </p>
      )}
    </div>
  )
}

function PlanSelector({
  prices,
  currentPriceId,
  onSelect,
  disabled,
}: {
  prices: PriceOption[]
  currentPriceId: string
  onSelect: (p: PriceOption) => void
  disabled: boolean
}) {
  const monthly = prices.find(p => p.intervalo === 'mensal')
  return (
    <div className="mt-6">
      <SectionLabel>Periodicidade</SectionLabel>
      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${prices.length}, 1fr)` }}
      >
        {prices.map(p => {
          const active = p.id === currentPriceId
          // Calcula equivalente mensal pra ancorar o desconto
          const meses =
            p.intervalo === 'mensal'
              ? 1
              : p.intervalo === 'semestral'
                ? 6
                : p.intervalo === 'anual'
                  ? 12
                  : 1
          const perMes = p.amountCents / meses
          const economia =
            monthly && p.intervalo !== 'mensal' && p.intervalo !== 'unico'
              ? Math.round(
                  ((monthly.amountCents * meses - p.amountCents) /
                    (monthly.amountCents * meses)) *
                    100,
                )
              : 0
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled || active}
              onClick={() => onSelect(p)}
              className="text-left p-3 rounded-xl transition-all"
              style={{
                background: active
                  ? 'color-mix(in srgb, var(--cks-primary) 15%, transparent)'
                  : 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
                border: active
                  ? '1.5px solid var(--cks-primary)'
                  : '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
                cursor: disabled ? 'wait' : 'pointer',
                opacity: disabled && !active ? 0.6 : 1,
              }}
            >
              <div
                className="text-[13px] font-medium"
                style={{ color: 'var(--cks-text)' }}
              >
                {intervaloLabel(p.intervalo)}
              </div>
              <div
                className="text-[15px] font-semibold tabular-nums mt-0.5"
                style={{ color: 'var(--cks-text)' }}
              >
                {formatBRL(p.amountCents)}
              </div>
              {p.intervalo !== 'mensal' && p.intervalo !== 'unico' && (
                <div
                  className="text-[10.5px] mt-0.5"
                  style={{
                    color:
                      'color-mix(in srgb, var(--cks-text) 60%, transparent)',
                  }}
                >
                  {formatBRL(Math.round(perMes))}/mês
                </div>
              )}
              {economia > 0 && (
                <div
                  className="text-[10px] uppercase tracking-wider mt-1.5 inline-block px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      'color-mix(in srgb, var(--cks-primary) 22%, transparent)',
                    color: 'var(--cks-primary)',
                    fontWeight: 600,
                  }}
                >
                  −{economia}%
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BumpsSection({
  bumps,
  selected,
  onToggle,
}: {
  bumps: OrderBump[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="mt-6">
      <SectionLabel>Adicione ao pedido</SectionLabel>
      <div className="mt-3 space-y-2">
        {bumps.map(bump => {
          const isOn = selected.has(bump.id)
          return (
            <label
              key={bump.id}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{
                background: isOn
                  ? 'color-mix(in srgb, var(--cks-primary) 12%, transparent)'
                  : 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
                border: isOn
                  ? '1px solid color-mix(in srgb, var(--cks-primary) 40%, transparent)'
                  : '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
              }}
            >
              <span
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                style={{
                  background: isOn ? 'var(--cks-primary)' : 'transparent',
                  border: isOn
                    ? '1px solid var(--cks-primary)'
                    : '1px solid color-mix(in srgb, var(--cks-text) 30%, transparent)',
                }}
              >
                {isOn && (
                  <Check
                    className="w-3 h-3"
                    style={{ color: 'var(--cks-accent)' }}
                  />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--cks-text)' }}
                  >
                    {bump.titulo}
                  </span>
                  <span
                    className="text-[13px] font-semibold tabular-nums whitespace-nowrap"
                    style={{ color: 'var(--cks-primary)' }}
                  >
                    + {formatBRL(bump.valor_cents)}
                  </span>
                </div>
                {bump.descricao && (
                  <p
                    className="text-[11.5px] mt-0.5"
                    style={{
                      color:
                        'color-mix(in srgb, var(--cks-text) 65%, transparent)',
                    }}
                  >
                    {bump.descricao}
                  </p>
                )}
                {bump.badge && (
                  <span
                    className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] tracking-wider uppercase"
                    style={{
                      background: 'var(--cks-primary)',
                      color: 'var(--cks-accent)',
                      fontWeight: 700,
                    }}
                  >
                    {bump.badge}
                  </span>
                )}
              </div>
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => onToggle(bump.id)}
                className="sr-only"
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}

function CardPreview({
  card,
  brand,
}: {
  card: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
  }
  brand: CardBrand
}) {
  const theme = BRAND_THEME[brand]
  const masked = (card.number.replace(/\D/g, '') + '••••••••••••••••').slice(0, 16)
  const groups = [
    masked.slice(0, 4),
    masked.slice(4, 8),
    masked.slice(8, 12),
    masked.slice(12, 16),
  ]
  const exp = `${card.expiryMonth.padStart(2, '0') || 'MM'}/${
    card.expiryYear.slice(-2) || 'AA'
  }`
  return (
    <div
      className="relative w-full aspect-[1.586/1] max-w-[400px] rounded-xl p-4 overflow-hidden text-white shadow-lg transition-all"
      style={{ background: theme.bg }}
    >
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="w-8 h-6 rounded bg-gradient-to-br from-yellow-300/80 to-yellow-600/80" />
          <Wifi className="w-4 h-4 opacity-70 rotate-90" />
        </div>
        <div className="text-lg md:text-xl tracking-[0.16em] font-mono">
          {groups.join(' ')}
        </div>
        <div className="flex items-end justify-between gap-3 text-xs">
          <div className="min-w-0">
            <div className="text-[8px] uppercase tracking-widest opacity-60">
              Titular
            </div>
            <div className="uppercase truncate">
              {card.holderName || 'NOME NO CARTÃO'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[8px] uppercase tracking-widest opacity-60">
              Validade
            </div>
            <div>{exp}</div>
          </div>
          <div
            className="font-bold whitespace-nowrap text-sm"
            style={{ letterSpacing: brand === 'visa' ? '0.05em' : undefined }}
          >
            {theme.label}
          </div>
        </div>
      </div>
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
        className="w-full px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--cks-primary)',
          color: 'var(--cks-accent)',
          fontWeight: 600,
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <QrCode className="w-4 h-4" />
            Gerar PIX
          </>
        )}
      </button>
    )
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-2.5 rounded-xl">
        <Image
          src={`data:image/png;base64,${pix.encodedImage}`}
          alt="QR Code PIX"
          width={200}
          height={200}
          className="block"
          unoptimized
        />
      </div>
      <div
        className="text-xs text-center max-w-xs"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 65%, transparent)',
        }}
      >
        Aponte a câmera do app do seu banco — ou copie o código abaixo.
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="w-full px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
        style={{
          background: 'color-mix(in srgb, var(--cks-primary) 12%, transparent)',
          border:
            '1px solid color-mix(in srgb, var(--cks-primary) 30%, transparent)',
          color: 'var(--cks-primary)',
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
          color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
        }}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Aguardando confirmação…
      </div>
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
        className="w-full px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--cks-primary)',
          color: 'var(--cks-accent)',
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
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-sm" style={{ color: 'var(--cks-text)' }}>
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
          className="w-full px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
          style={{
            background: 'var(--cks-primary)',
            color: 'var(--cks-accent)',
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
          color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
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
  brand,
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
  brand: CardBrand
}) {
  if (submitted) {
    return (
      <div className="text-center py-8">
        <Loader2
          className="w-7 h-7 animate-spin mx-auto mb-3"
          style={{ color: 'var(--cks-primary)' }}
        />
        <div className="text-sm" style={{ color: 'var(--cks-text)' }}>
          Confirmando seu pagamento…
        </div>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <CardPreview card={card} brand={brand} />

      <Field
        label="Número do cartão"
        inputMode="numeric"
        autoComplete="cc-number"
        value={card.number}
        onChange={v => setCard(c => ({ ...c, number: maskCard(v) }))}
      />
      <Field
        label="Nome impresso no cartão"
        autoComplete="cc-name"
        value={card.holderName}
        onChange={v => setCard(c => ({ ...c, holderName: v }))}
      />
      <div className="grid grid-cols-3 gap-2">
        <Field
          label="Mês"
          inputMode="numeric"
          autoComplete="cc-exp-month"
          maxLength={2}
          value={card.expiryMonth}
          onChange={v =>
            setCard(c => ({
              ...c,
              expiryMonth: v.replace(/\D/g, '').slice(0, 2),
            }))
          }
        />
        <Field
          label="Ano"
          inputMode="numeric"
          autoComplete="cc-exp-year"
          maxLength={4}
          value={card.expiryYear}
          onChange={v =>
            setCard(c => ({
              ...c,
              expiryYear: v.replace(/\D/g, '').slice(0, 4),
            }))
          }
        />
        <Field
          label="CVV"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          value={card.ccv}
          onChange={v =>
            setCard(c => ({ ...c, ccv: v.replace(/\D/g, '').slice(0, 4) }))
          }
        />
      </div>

      <SectionLabel className="mt-2">Endereço de cobrança</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field
          label="CEP"
          inputMode="numeric"
          value={maskCep(address.postalCode)}
          onChange={v => setAddress(a => ({ ...a, postalCode: v }))}
        />
        <Field
          label="Número"
          value={address.addressNumber}
          onChange={v => setAddress(a => ({ ...a, addressNumber: v }))}
        />
      </div>
      <Field
        label="Complemento (opcional)"
        value={address.addressComplement}
        onChange={v => setAddress(a => ({ ...a, addressComplement: v }))}
        required={false}
      />

      {installmentsMax > 1 && (
        <Field
          label="Parcelas"
          as="select"
          value={String(installments)}
          onChange={v => setInstallments(Number(v))}
        >
          {Array.from({ length: installmentsMax }).map((_, i) => {
            const n = i + 1
            return (
              <option key={n} value={n}>
                {n}x de {formatBRL(Math.round(amountCents / n))}
              </option>
            )
          })}
        </Field>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-3 px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--cks-primary)',
          color: 'var(--cks-accent)',
          fontWeight: 600,
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
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

function glassStyle(): React.CSSProperties {
  return {
    background:
      'linear-gradient(155deg, color-mix(in srgb, var(--cks-text) 7%, transparent), color-mix(in srgb, var(--cks-text) 2%, transparent))',
    border:
      '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
    backdropFilter: 'blur(14px) saturate(140%)',
    WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  }
}

function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`text-[10px] uppercase tracking-[0.18em] font-medium ${className}`}
      style={{
        color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
      }}
    >
      {children}
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  maxLength?: number
  required?: boolean
  as?: 'input' | 'select'
  children?: React.ReactNode
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  autoComplete,
  maxLength,
  required = true,
  as = 'input',
  children,
}: FieldProps) {
  const id = useId()
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] mb-1"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
        }}
      >
        {label}
      </label>
      {as === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2.5 rounded-lg outline-none text-[14px]"
          style={inputStyle()}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg outline-none text-[14px]"
          style={inputStyle()}
        />
      )}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
    border: '1px solid color-mix(in srgb, var(--cks-text) 14%, transparent)',
    color: 'var(--cks-text)',
    fontFamily: SANS,
    transition: 'border-color 0.15s ease',
  }
}
