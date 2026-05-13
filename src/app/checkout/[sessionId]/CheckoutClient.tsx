'use client'

/**
 * Checkout customizado Veritas — UI client (redesign glassmorphism).
 *
 * Layout:
 *   ESQUERDA: resumo do produto (topo) + dados pessoais (embaixo, em form
 *             flutuante "ao ar" — sem cartão envolvendo).
 *   DIREITA:  método de pagamento + cartão visual (Visa/MC/Elo…) +
 *             confirmação. Glass card aqui, sticky no desktop.
 *
 * Mobile: stacked na ordem produto → dados → pagamento.
 *
 * Glassmorphism: backdrop-filter blur + bordas finas com transparência +
 * radial-gradients no fundo. Os inputs ficam "flutuando" — sem card
 * envolvendo o form de dados pessoais.
 *
 * Cartão visual: detecta bandeira pelo BIN e troca a cor de fundo do
 * cartão preview (Visa azul, Master vermelho, Elo amarelo+preto, etc.).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wifi,
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
  codigo?: string
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
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  plan: Plan
  settings: Settings
  user: UserInfo
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

type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'elo'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'unknown'

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

  const [customer, setCustomer] = useState({
    name: user.name,
    email: user.email,
    cpfCnpj: '',
    mobilePhone: '',
  })

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

  // Order bumps disponíveis pro plano + ids selecionados pelo cliente.
  // currentTotal reflete o que vai ser cobrado (base + bumps).
  const [bumps, setBumps] = useState<OrderBump[]>([])
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set())
  const [currentTotal, setCurrentTotal] = useState<number>(amountCents)
  const [applyingBumps, setApplyingBumps] = useState(false)

  useEffect(() => {
    if (!plan.codigo) return
    let cancelled = false
    fetch(`/api/checkout/bumps?planCodigo=${encodeURIComponent(plan.codigo)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setBumps((data.bumps ?? []) as OrderBump[])
      })
      .catch(() => {
        // Lista de bumps é opcional — falha silenciosa não bloqueia checkout.
      })
    return () => {
      cancelled = true
    }
  }, [plan.codigo])

  // Quando o cliente liga/desliga um bump, manda pro backend recalcular
  // amount_cents da session. Usamos AbortController pra cancelar request
  // anterior se ele clica rápido em vários toggles.
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
        if (data?.amount_cents) setCurrentTotal(data.amount_cents)
      })
      .catch(() => {
        // ignora abort/falha — UI mantém o último total válido
      })
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
      } catch {
        // ignora — tenta no próximo tick
      }
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
      // ignora
    }
  }

  const cssVars: React.CSSProperties = {
    ['--cks-primary' as string]: settings.primaryColor,
    ['--cks-accent' as string]: settings.accentColor,
    ['--cks-bg' as string]: settings.backgroundColor,
    ['--cks-text' as string]: settings.textColor,
    background: `
      radial-gradient(ellipse 90% 60% at 20% 0%, color-mix(in srgb, ${settings.primaryColor} 12%, transparent), transparent 65%),
      radial-gradient(ellipse 70% 50% at 90% 30%, color-mix(in srgb, ${settings.primaryColor} 7%, transparent), transparent 70%),
      ${settings.backgroundColor}
    `,
    color: settings.textColor,
    minHeight: '100vh',
  }

  if (paid) {
    return (
      <main
        style={cssVars}
        className="px-4 py-16 flex items-center justify-center"
      >
        <GlassPanel className="max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-[#66BB6A]/20">
            <Check className="w-7 h-7" style={{ color: '#66BB6A' }} />
          </div>
          <div
            className="text-xl mb-1"
            style={{
              color: '#66BB6A',
              fontFamily: 'var(--font-elegant, var(--font-display))',
              fontWeight: 600,
            }}
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
        </GlassPanel>
      </main>
    )
  }

  return (
    <main style={cssVars} className="px-4 py-8 md:py-12 lg:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Topo */}
        <header className="flex flex-col items-center text-center mb-10 md:mb-14">
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
              color: 'color-mix(in srgb, var(--cks-text) 65%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {settings.headerSubtitle}
          </p>
        </header>

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-start">
          {/* ─── ESQUERDA ─── */}
          <div className="space-y-10 order-2 lg:order-1">
            <ProductSummary
              plan={plan}
              baseCents={amountCents}
              totalCents={currentTotal}
              intervalo={intervalo}
              selectedBumps={bumps.filter(b => selectedBumps.has(b.id))}
              applying={applyingBumps}
            />

            {bumps.length > 0 && (
              <OrderBumpsSection
                bumps={bumps}
                selected={selectedBumps}
                onToggle={toggleBump}
              />
            )}

            {/* Dados pessoais — inputs flutuantes, sem card envolvendo */}
            <section>
              <SectionTitle
                eyebrow="Dados pessoais"
                title="Quem está assinando"
              />
              <div className="space-y-4 mt-5">
                <FloatField
                  label="Nome completo"
                  type="text"
                  autoComplete="name"
                  value={customer.name}
                  onChange={v => setCustomer(c => ({ ...c, name: v }))}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FloatField
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={v => setCustomer(c => ({ ...c, email: v }))}
                  />
                  <FloatField
                    label="CPF ou CNPJ"
                    inputMode="numeric"
                    value={maskCpfCnpj(customer.cpfCnpj)}
                    onChange={v => setCustomer(c => ({ ...c, cpfCnpj: v }))}
                  />
                </div>
                <FloatField
                  label="Celular (opcional)"
                  inputMode="tel"
                  autoComplete="tel"
                  value={maskPhone(customer.mobilePhone)}
                  onChange={v => setCustomer(c => ({ ...c, mobilePhone: v }))}
                  required={false}
                />
              </div>
            </section>
          </div>

          {/* ─── DIREITA ─── */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-10">
            <GlassPanel className="p-6 md:p-7">
              <SectionTitle
                eyebrow="Pagamento"
                title="Como você prefere pagar"
              />

              {availableTabs.length > 1 && (
                <div
                  className="grid gap-2 p-1 rounded-2xl mt-4 mb-5"
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
                  amountCents={currentTotal}
                  submitted={cardSubmitted}
                  onSubmit={submitCard}
                  loading={loading}
                  brand={brand}
                />
              )}

              <div
                className="flex items-center justify-center gap-2 text-[11px] mt-5"
                style={{
                  color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {settings.footerText}
              </div>
            </GlassPanel>
          </aside>
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
  baseCents,
  totalCents,
  intervalo,
  selectedBumps,
  applying,
}: {
  plan: Plan
  baseCents: number
  totalCents: number
  intervalo: Props['intervalo']
  selectedBumps: OrderBump[]
  applying: boolean
}) {
  const hasExtras = selectedBumps.length > 0
  return (
    <section>
      <SectionTitle eyebrow="Resumo da assinatura" title={plan.nome} />
      {plan.descricao && (
        <p
          className="text-sm mt-2 max-w-md"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {plan.descricao}
        </p>
      )}

      <div className="flex items-baseline gap-1.5 mt-5">
        <span
          className="text-4xl md:text-5xl transition-opacity"
          style={{
            color: 'var(--cks-primary)',
            fontFamily: 'var(--font-elegant, var(--font-display))',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            opacity: applying ? 0.55 : 1,
          }}
        >
          {formatBRL(totalCents)}
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

      {hasExtras && (
        <div
          className="mt-4 p-3 rounded-2xl text-xs flex flex-col gap-1.5"
          style={{
            background:
              'color-mix(in srgb, var(--cks-text) 4%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
            fontFamily: 'var(--font-body)',
            color:
              'color-mix(in srgb, var(--cks-text) 80%, transparent)',
          }}
        >
          <div className="flex items-center justify-between">
            <span>Plano</span>
            <span>{formatBRL(baseCents)}</span>
          </div>
          {selectedBumps.map(b => (
            <div key={b.id} className="flex items-center justify-between">
              <span className="truncate pr-2">+ {b.titulo}</span>
              <span>{formatBRL(b.valor_cents)}</span>
            </div>
          ))}
          <div
            className="flex items-center justify-between pt-1.5 mt-1.5"
            style={{
              borderTop:
                '1px solid color-mix(in srgb, var(--cks-text) 10%, transparent)',
              color: 'var(--cks-text)',
              fontWeight: 600,
            }}
          >
            <span>Total</span>
            <span>{formatBRL(totalCents)}</span>
          </div>
        </div>
      )}

      {plan.beneficios.length > 0 && (
        <ul className="flex flex-col gap-2.5 mt-6">
          {plan.beneficios.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm"
              style={{
                color: 'color-mix(in srgb, var(--cks-text) 85%, transparent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background:
                    'color-mix(in srgb, var(--cks-primary) 22%, transparent)',
                  border:
                    '1px solid color-mix(in srgb, var(--cks-primary) 38%, transparent)',
                }}
              >
                <Check
                  className="w-2.5 h-2.5"
                  style={{ color: 'var(--cks-primary)' }}
                />
              </span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function OrderBumpsSection({
  bumps,
  selected,
  onToggle,
}: {
  bumps: OrderBump[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <section>
      <SectionTitle eyebrow="Adicione ao seu pedido" title="Ofertas exclusivas" />
      <div className="mt-5 space-y-3">
        {bumps.map(bump => {
          const isOn = selected.has(bump.id)
          return (
            <label
              key={bump.id}
              className="block cursor-pointer rounded-2xl p-4 transition-all relative"
              style={{
                background: isOn
                  ? 'color-mix(in srgb, var(--cks-primary) 14%, transparent)'
                  : 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
                border: isOn
                  ? '1px solid color-mix(in srgb, var(--cks-primary) 50%, transparent)'
                  : '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
              }}
            >
              {bump.badge && (
                <span
                  className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase"
                  style={{
                    background: 'var(--cks-primary)',
                    color: 'var(--cks-accent)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                  }}
                >
                  {bump.badge}
                </span>
              )}
              <div className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                  style={{
                    background: isOn
                      ? 'var(--cks-primary)'
                      : 'transparent',
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
                      className="text-sm font-medium"
                      style={{
                        color: 'var(--cks-text)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {bump.titulo}
                    </span>
                    <span
                      className="text-sm whitespace-nowrap"
                      style={{
                        color: 'var(--cks-primary)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                      }}
                    >
                      + {formatBRL(bump.valor_cents)}
                    </span>
                  </div>
                  {bump.descricao && (
                    <p
                      className="text-xs mt-1"
                      style={{
                        color:
                          'color-mix(in srgb, var(--cks-text) 65%, transparent)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {bump.descricao}
                    </p>
                  )}
                </div>
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
    </section>
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
  const masked = (card.number.replace(/\D/g, '') + '••••••••••••••••').slice(
    0,
    16,
  )
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
      className="relative w-full aspect-[1.586/1] max-w-[420px] mx-auto rounded-2xl p-5 overflow-hidden text-white shadow-xl transition-all"
      style={{ background: theme.bg }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.35), transparent 50%)',
        }}
      />
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-600/80 border border-yellow-500/40" />
          <Wifi className="w-5 h-5 opacity-80 rotate-90" />
        </div>
        <div
          className="text-xl md:text-2xl tracking-[0.18em] font-mono"
          style={{ textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}
        >
          {groups.join(' ')}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-widest opacity-70">
              Titular
            </div>
            <div className="text-sm uppercase truncate">
              {card.holderName || 'NOME NO CARTÃO'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest opacity-70">
              Validade
            </div>
            <div className="text-sm">{exp}</div>
          </div>
          <div
            className="text-base font-bold italic whitespace-nowrap"
            style={{
              letterSpacing: brand === 'visa' ? '0.05em' : undefined,
            }}
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
        Aponte a câmera do app do seu banco — ou copie o código abaixo.
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="w-full px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
        style={{
          background:
            'color-mix(in srgb, var(--cks-primary) 15%, transparent)',
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
        Aguardando confirmação…
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
          background:
            'color-mix(in srgb, var(--cks-primary) 15%, transparent)',
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <CardPreview card={card} brand={brand} />

      <FloatField
        label="Número do cartão"
        inputMode="numeric"
        autoComplete="cc-number"
        value={card.number}
        onChange={v => setCard(c => ({ ...c, number: maskCard(v) }))}
      />
      <FloatField
        label="Nome impresso no cartão"
        autoComplete="cc-name"
        value={card.holderName}
        onChange={v => setCard(c => ({ ...c, holderName: v }))}
      />
      <div className="grid grid-cols-3 gap-3">
        <FloatField
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
        <FloatField
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
        <FloatField
          label="CVV"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          value={card.ccv}
          onChange={v =>
            setCard(c => ({
              ...c,
              ccv: v.replace(/\D/g, '').slice(0, 4),
            }))
          }
        />
      </div>

      <div
        className="text-[10px] uppercase tracking-wider mt-2"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 50%, transparent)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Endereço de cobrança
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <FloatField
          label="CEP"
          inputMode="numeric"
          value={maskCep(address.postalCode)}
          onChange={v => setAddress(a => ({ ...a, postalCode: v }))}
        />
        <FloatField
          label="Número"
          value={address.addressNumber}
          onChange={v => setAddress(a => ({ ...a, addressNumber: v }))}
        />
      </div>
      <FloatField
        label="Complemento (opcional)"
        value={address.addressComplement}
        onChange={v => setAddress(a => ({ ...a, addressComplement: v }))}
        required={false}
      />

      {installmentsMax > 1 && (
        <FloatField
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
        </FloatField>
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

function GlassPanel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        background:
          'linear-gradient(140deg, color-mix(in srgb, var(--cks-text) 8%, transparent), color-mix(in srgb, var(--cks-text) 3%, transparent))',
        border:
          '1px solid color-mix(in srgb, var(--cks-text) 14%, transparent)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        boxShadow:
          '0 12px 40px -16px color-mix(in srgb, var(--cks-primary) 25%, transparent), 0 1px 0 0 color-mix(in srgb, var(--cks-text) 8%, transparent) inset',
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[0.22em] mb-1.5"
        style={{
          color: 'var(--cks-primary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-xl md:text-2xl"
        style={{
          fontFamily: 'var(--font-elegant, var(--font-display))',
          color: 'var(--cks-text)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
    </div>
  )
}

type FloatFieldProps = {
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

function FloatField({
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
}: FloatFieldProps) {
  const hasValue = value !== ''
  return (
    <label className="block relative">
      {as === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="w-full px-4 pt-5 pb-2 rounded-2xl outline-none focus:outline-none"
          style={inputStyle()}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder=" "
          className="w-full px-4 pt-5 pb-2 rounded-2xl outline-none focus:outline-none"
          style={inputStyle()}
        />
      )}
      <span
        className="pointer-events-none absolute left-4 transition-all"
        style={{
          top: hasValue ? '6px' : '50%',
          transform: hasValue ? 'none' : 'translateY(-50%)',
          fontSize: hasValue ? '10px' : '13px',
          letterSpacing: hasValue ? '0.05em' : 'normal',
          textTransform: hasValue ? 'uppercase' : 'none',
          color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {label}
      </span>
    </label>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
    border: '1px solid color-mix(in srgb, var(--cks-text) 14%, transparent)',
    color: 'var(--cks-text)',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s ease, background 0.15s ease',
    minHeight: '54px',
  }
}
