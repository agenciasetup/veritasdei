'use client'

/**
 * Checkout Veritas — UI client (premium, full-bleed).
 *
 * Layout (desktop ≥ lg):
 *   ┌──────────────────────────┬─────────────────────────┐
 *   │  GLASS (left half)        │  FLAT (right half)      │
 *   │  full height, sem margin  │  full height, fundo bg  │
 *   │                            │                          │
 *   │  produto + preço          │  cartão preview         │
 *   │  benefícios               │  forma de pagto         │
 *   │  seletor de plano         │  cartões salvos         │
 *   │  order bumps              │  form / token           │
 *   │  dados pessoais           │  parcelamento c/ juros  │
 *   │  endereço (cartão)        │  botão pagar            │
 *   └──────────────────────────┴─────────────────────────┘
 *
 * Mobile: glass full-bleed em cima, pagamento flat embaixo.
 *
 * Identidade do cartão: detectBrand + detectIssuer (Nubank roxo, Itaú
 * laranja-azul, Santander vermelho, etc.) — ver lib/payments/card-brands.
 *
 * Endereço com autopreenchimento via ViaCEP — usuário digita CEP e
 * logradouro/bairro/cidade/UF aparecem.
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
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
} from 'lucide-react'
import {
  detectBrand,
  detectIssuer,
  getCardTheme,
  getBrandLabel,
  type CardBrand,
} from '@/lib/payments/card-brands'
import { lookupCep } from '@/lib/payments/viacep'
import {
  listInstallmentOptions,
  maxInstallments,
  type Intervalo,
} from '@/lib/payments/installments'
import { COMPANY_INFO } from '@/lib/company-info'

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

type SavedCard = {
  id: string
  brand: string | null
  bank: string | null
  last4: string
  holder_name: string | null
  expiry_month: string | null
  expiry_year: string | null
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

// --------------------------------------------------------------------------
// Helpers locais
// --------------------------------------------------------------------------

const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

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
  return {
    mensal: 'Mensal',
    semestral: 'Semestral',
    anual: 'Anual',
    unico: 'Único',
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
  const availableTabs: PaymentMethod[] = useMemo(() => {
    const t: PaymentMethod[] = []
    if (settings.allowCreditCard) t.push('credit_card')
    if (settings.allowPix) t.push('pix')
    if (settings.allowBoleto) t.push('boleto')
    return t
  }, [settings.allowCreditCard, settings.allowPix, settings.allowBoleto])

  const [tab, setTab] = useState<PaymentMethod>(
    availableTabs[0] ?? 'credit_card',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pix, setPix] = useState<PixState | null>(null)
  const [boleto, setBoleto] = useState<BoletoState | null>(null)
  const [paid, setPaid] = useState(false)
  const [copyHint, setCopyHint] = useState(false)
  const [cardSubmitted, setCardSubmitted] = useState<
    null | 'CONFIRMED' | 'PENDING' | string
  >(null)

  // Plano
  const [currentPriceId, setCurrentPriceId] = useState(initialPriceId)
  const [currentIntervalo, setCurrentIntervalo] =
    useState<Intervalo>(initialIntervalo)
  const [basePriceCents, setBasePriceCents] = useState(
    prices.find(p => p.id === initialPriceId)?.amountCents ?? amountCents,
  )
  const [switchingPrice, setSwitchingPrice] = useState(false)

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
    street: '',
    addressNumber: '',
    addressComplement: '',
    bairro: '',
    cidade: '',
    uf: '',
  })
  const [installments, setInstallments] = useState(1)
  const [saveCard, setSaveCard] = useState(true)
  const [cepLoading, setCepLoading] = useState(false)

  // Cartões salvos
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [useSavedCard, setUseSavedCard] = useState<string | null>(null)
  const [showCardForm, setShowCardForm] = useState(true)

  const cardNumberForTheme = useSavedCard
    ? (() => {
        const sc = savedCards.find(c => c.id === useSavedCard)
        return sc ? `${sc.last4 || ''}0000`.padStart(16, '0') : card.number
      })()
    : card.number

  const brand = useMemo(
    () => detectBrand(cardNumberForTheme),
    [cardNumberForTheme],
  )
  const issuer = useMemo(
    () => detectIssuer(cardNumberForTheme),
    [cardNumberForTheme],
  )
  const theme = useMemo(
    () => getCardTheme(cardNumberForTheme),
    [cardNumberForTheme],
  )

  // Carrega cartões salvos
  useEffect(() => {
    let cancelled = false
    fetch('/api/payments/cards')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const list = (data.cards ?? []) as SavedCard[]
        setSavedCards(list)
        // Se tem cartão salvo, default = primeiro salvo (esconde form)
        if (list.length > 0) {
          setUseSavedCard(list[0].id)
          setShowCardForm(false)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Bumps
  const [bumps, setBumps] = useState<OrderBump[]>([])
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set())
  const [bumpsTotal, setBumpsTotal] = useState(0)
  const [applyingBumps, setApplyingBumps] = useState(false)

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

  // Total para exibir: base + bumps (sem juros — juros entram no botão pagar)
  const subtotalCents = basePriceCents + bumpsTotal

  // Opções de parcelamento — calculadas em cima do subtotal (base + bumps)
  const installmentOptions = useMemo(
    () =>
      listInstallmentOptions(
        subtotalCents,
        currentIntervalo,
        settings.installmentsMax,
      ),
    [subtotalCents, currentIntervalo, settings.installmentsMax],
  )
  const maxInst = maxInstallments(currentIntervalo, settings.installmentsMax)

  // Se trocou o intervalo e o número de parcelas atual excede o max, reset.
  useEffect(() => {
    if (installments > maxInst) setInstallments(1)
  }, [maxInst, installments])

  const selectedInstallment =
    installmentOptions.find(o => o.n === installments) ?? installmentOptions[0]
  const finalTotalCents = selectedInstallment?.totalCents ?? subtotalCents

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

  // ViaCEP — autopreenche endereço quando CEP atinge 8 dígitos
  useEffect(() => {
    const d = digitsOnly(address.postalCode)
    if (d.length !== 8) return
    let cancelled = false
    setCepLoading(true)
    lookupCep(d)
      .then(r => {
        if (cancelled || !r) return
        setAddress(a => ({
          ...a,
          street: r.logradouro || a.street,
          bairro: r.bairro || a.bairro,
          cidade: r.localidade || a.cidade,
          uf: r.uf || a.uf,
        }))
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [address.postalCode])

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
      setInstallments(1)
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
      if (!res.ok) {
        // Erro específico: conta Asaas sem Pix Automático ativado.
        // Mensagem amigável + orientação pra ativar.
        const msg: string = data.error ?? 'Falha ao gerar PIX'
        if (/não é permitida para assinatura/i.test(msg)) {
          throw new Error(
            'PIX recorrente ainda não está habilitado nesta conta Asaas. ' +
              'Ative o Pix Automático no painel da Asaas em Integrações → ' +
              'Pix Automático. Enquanto isso, use cartão ou boleto.',
          )
        }
        throw new Error(msg)
      }
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
      const usingToken = !!useSavedCard
      const body: Record<string, unknown> = {
        sessionId,
        method: 'credit_card',
        customer: buildCustomerPayload(),
        installments,
      }
      if (usingToken) {
        body.savedCardId = useSavedCard
      } else {
        body.card = {
          holderName: card.holderName.trim(),
          number: card.number.replace(/\s+/g, ''),
          expiryMonth: card.expiryMonth.trim(),
          expiryYear: card.expiryYear.trim(),
          ccv: card.ccv.trim(),
        }
        body.address = {
          postalCode: digitsOnly(address.postalCode),
          addressNumber: address.addressNumber.trim(),
          addressComplement: address.addressComplement.trim() || undefined,
        }
        body.saveCard = saveCard
      }
      const res = await fetch('/api/payments/asaas/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao processar cartão')
      setCardSubmitted(data.status ?? 'PENDING')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  async function deleteSavedCard(id: string) {
    if (!window.confirm('Remover este cartão salvo?')) return
    try {
      await fetch(`/api/payments/cards/${id}`, { method: 'DELETE' })
      setSavedCards(prev => prev.filter(c => c.id !== id))
      if (useSavedCard === id) {
        setUseSavedCard(null)
        setShowCardForm(true)
      }
    } catch {}
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
        <div className="max-w-md w-full p-8 rounded-2xl text-center" style={glassStyle()}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-emerald-500/15">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-lg mb-1 font-semibold" style={{ color: 'var(--cks-text)' }}>
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
    <main style={cssVars} className="min-h-screen">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* ─── ESQUERDA: glass full-bleed do topo ao fim ─── */}
        <section
          className="px-5 md:px-10 lg:px-14 py-8 lg:py-12 order-1 lg:order-1"
          style={glassStyle()}
        >
          <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto lg:mr-12 space-y-9">
            {/* Header mini */}
            <div className="flex items-center justify-between">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt="Veritas"
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: 'var(--cks-primary)' }}
                  />
                  <span
                    className="text-xs font-semibold tracking-[0.18em]"
                    style={{ color: 'var(--cks-text)' }}
                  >
                    VERITAS
                  </span>
                </div>
              )}
              <div
                className="inline-flex items-center gap-1.5 text-[11px]"
                style={{
                  color:
                    'color-mix(in srgb, var(--cks-text) 60%, transparent)',
                }}
              >
                <Lock className="w-3 h-3" />
                Pagamento seguro
              </div>
            </div>

            {/* Produto */}
            <ProductHeader
              plan={plan}
              totalCents={subtotalCents}
              intervalo={currentIntervalo}
              switching={switchingPrice || applyingBumps}
            />

            {plan.beneficios.length > 0 && (
              <ul className="flex flex-col gap-2">
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

            <div>
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
                    onChange={v => setCustomer(c => ({ ...c, cpfCnpj: v }))}
                  />
                </div>
                <Field
                  label="Celular (opcional)"
                  inputMode="tel"
                  autoComplete="tel"
                  value={maskPhone(customer.mobilePhone)}
                  onChange={v => setCustomer(c => ({ ...c, mobilePhone: v }))}
                  required={false}
                />
              </div>
            </div>

            {/* Endereço — só aparece quando vai pagar com cartão e não usa salvo */}
            {tab === 'credit_card' && !useSavedCard && (
              <div>
                <SectionLabel>Endereço de cobrança</SectionLabel>
                <div className="space-y-3 mt-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field
                      label="CEP"
                      inputMode="numeric"
                      value={maskCep(address.postalCode)}
                      onChange={v =>
                        setAddress(a => ({ ...a, postalCode: v }))
                      }
                      suffix={
                        cepLoading ? (
                          <Loader2
                            className="w-3.5 h-3.5 animate-spin"
                            style={{ color: 'var(--cks-primary)' }}
                          />
                        ) : null
                      }
                    />
                    <Field
                      label="Número"
                      value={address.addressNumber}
                      onChange={v =>
                        setAddress(a => ({ ...a, addressNumber: v }))
                      }
                    />
                  </div>
                  <Field
                    label="Rua / Logradouro"
                    value={address.street}
                    onChange={v => setAddress(a => ({ ...a, street: v }))}
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field
                      label="Bairro"
                      value={address.bairro}
                      onChange={v => setAddress(a => ({ ...a, bairro: v }))}
                    />
                    <Field
                      label="Complemento (opcional)"
                      value={address.addressComplement}
                      onChange={v =>
                        setAddress(a => ({ ...a, addressComplement: v }))
                      }
                      required={false}
                    />
                  </div>
                  <div className="grid sm:grid-cols-[1fr_120px] gap-3">
                    <Field
                      label="Cidade"
                      value={address.cidade}
                      onChange={v => setAddress(a => ({ ...a, cidade: v }))}
                    />
                    <Field
                      label="UF"
                      maxLength={2}
                      value={address.uf}
                      onChange={v =>
                        setAddress(a => ({ ...a, uf: v.toUpperCase() }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── DIREITA: flat ─── */}
        <aside className="px-5 md:px-10 lg:px-14 py-8 lg:py-12 order-2 lg:order-2">
          <div className="max-w-md mx-auto lg:mx-0 lg:mr-auto lg:ml-12 space-y-5">
            {tab === 'credit_card' && (
              <CardPreview
                card={card}
                brand={brand}
                bankName={issuer?.name ?? null}
                theme={theme}
                fallbackLabel={getBrandLabel(cardNumberForTheme)}
                savedCard={savedCards.find(c => c.id === useSavedCard) ?? null}
              />
            )}

            <SectionLabel>Forma de pagamento</SectionLabel>

            {availableTabs.length > 1 && (
              <div
                className="grid gap-1.5 p-1 rounded-xl"
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
                        background: active ? 'var(--cks-primary)' : 'transparent',
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
                className="p-3 rounded-lg text-sm"
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
              <>
                {savedCards.length > 0 && (
                  <SavedCardsList
                    cards={savedCards}
                    selected={useSavedCard}
                    onSelect={id => {
                      setUseSavedCard(id)
                      setShowCardForm(false)
                    }}
                    onDelete={deleteSavedCard}
                    onAddNew={() => {
                      setUseSavedCard(null)
                      setShowCardForm(true)
                    }}
                    showAddButton={!showCardForm}
                  />
                )}

                {showCardForm && !useSavedCard && (
                  <CardForm
                    card={card}
                    setCard={setCard}
                    saveCard={saveCard}
                    setSaveCard={setSaveCard}
                    hasOtherCards={savedCards.length > 0}
                    onCancel={
                      savedCards.length > 0
                        ? () => {
                            setShowCardForm(false)
                            setUseSavedCard(savedCards[0].id)
                          }
                        : null
                    }
                  />
                )}

                {maxInst > 1 && (
                  <div>
                    <SectionLabel>Parcelamento</SectionLabel>
                    <select
                      value={installments}
                      onChange={e => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-lg outline-none text-[14px] mt-2"
                      style={inputStyle()}
                    >
                      {installmentOptions.map(o => (
                        <option key={o.n} value={o.n}>
                          {o.n}x de {formatBRL(o.installmentCents)}
                          {o.hasInterest
                            ? ` (total ${formatBRL(o.totalCents)} c/ juros)`
                            : ' sem juros'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {cardSubmitted ? (
                  <div className="text-center py-6">
                    <Loader2
                      className="w-7 h-7 animate-spin mx-auto mb-3"
                      style={{ color: 'var(--cks-primary)' }}
                    />
                    <div className="text-sm" style={{ color: 'var(--cks-text)' }}>
                      Confirmando seu pagamento…
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={submitCard}
                    disabled={loading}
                    className="w-full mt-2 px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
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
                        Pagar {formatBRL(finalTotalCents)}
                      </>
                    )}
                  </button>
                )}
              </>
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
              className="text-[11px] text-center"
              style={{
                color:
                  'color-mix(in srgb, var(--cks-text) 50%, transparent)',
              }}
            >
              {settings.footerText}
            </div>

            <TrustFooter />
          </div>
        </aside>
      </div>
    </main>
  )
}

function TrustFooter() {
  return (
    <div
      className="mt-6 pt-5 border-t"
      style={{
        borderColor: 'color-mix(in srgb, var(--cks-text) 10%, transparent)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px]"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 65%, transparent)',
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck
            className="w-3.5 h-3.5"
            style={{ color: 'var(--cks-primary)' }}
          />
          Pagamento seguro
        </span>
        <span
          aria-hidden
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            background:
              'color-mix(in srgb, var(--cks-text) 25%, transparent)',
          }}
        />
        <span className="inline-flex items-center gap-1.5">
          Processado por
          <span
            className="px-1.5 py-0.5 rounded font-bold tracking-tight"
            style={{
              background: '#0066FF',
              color: '#fff',
              fontSize: '10px',
              letterSpacing: '0.02em',
            }}
          >
            asaas
          </span>
          <span className="opacity-60">· PCI Level 1</span>
        </span>
      </div>
      <div
        className="mt-3 text-[10px] text-center leading-relaxed"
        style={{
          color: 'color-mix(in srgb, var(--cks-text) 45%, transparent)',
        }}
      >
        <div>
          {COMPANY_INFO.legalName} · CNPJ {COMPANY_INFO.cnpj}
        </div>
        <div>{COMPANY_INFO.shortAddress}</div>
        <div>{COMPANY_INFO.email}</div>
      </div>
    </div>
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
          className="text-3xl md:text-[2.5rem] transition-opacity tabular-nums"
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
    <div>
      <SectionLabel>Periodicidade</SectionLabel>
      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${prices.length}, 1fr)` }}
      >
        {prices.map(p => {
          const active = p.id === currentPriceId
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
              <div className="text-[13px] font-medium" style={{ color: 'var(--cks-text)' }}>
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
                    color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
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
    <div>
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
                  <Check className="w-3 h-3" style={{ color: 'var(--cks-accent)' }} />
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
  bankName,
  theme,
  fallbackLabel,
  savedCard,
}: {
  card: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
  }
  brand: CardBrand
  bankName: string | null
  theme: ReturnType<typeof getCardTheme>
  fallbackLabel: string
  savedCard: SavedCard | null
}) {
  const masked = savedCard
    ? '••••••••••••' + (savedCard.last4 || '0000')
    : (card.number.replace(/\D/g, '') + '••••••••••••••••').slice(0, 16)
  const groups = [
    masked.slice(0, 4),
    masked.slice(4, 8),
    masked.slice(8, 12),
    masked.slice(12, 16),
  ]
  const exp = savedCard
    ? `${savedCard.expiry_month ?? 'MM'}/${
        savedCard.expiry_year?.slice(-2) ?? 'AA'
      }`
    : `${card.expiryMonth.padStart(2, '0') || 'MM'}/${
        card.expiryYear.slice(-2) || 'AA'
      }`
  const holder = savedCard
    ? savedCard.holder_name || 'TITULAR DO CARTÃO'
    : card.holderName || 'NOME NO CARTÃO'
  return (
    <div
      className="relative w-full aspect-[1.586/1] rounded-2xl p-5 overflow-hidden shadow-2xl transition-all"
      style={{ background: theme.bg, color: theme.fg }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.25), transparent 55%)',
        }}
      />
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <div
              className="w-9 h-7 rounded-md"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,215,100,0.85), rgba(180,135,40,0.85))',
              }}
            />
            {bankName && (
              <div
                className="text-[9px] uppercase tracking-[0.22em] opacity-90"
                style={{ color: theme.accent }}
              >
                {bankName}
              </div>
            )}
          </div>
          <Wifi className="w-5 h-5 opacity-70 rotate-90" />
        </div>
        <div className="text-lg md:text-xl tracking-[0.18em] font-mono">
          {groups.join(' ')}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[8px] uppercase tracking-widest opacity-60">
              Titular
            </div>
            <div className="text-[12px] uppercase truncate">{holder}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] uppercase tracking-widest opacity-60">
              Validade
            </div>
            <div className="text-[12px]">{exp}</div>
          </div>
          <div
            className="font-bold whitespace-nowrap text-sm"
            style={{
              letterSpacing: brand === 'visa' ? '0.05em' : undefined,
            }}
          >
            {fallbackLabel}
          </div>
        </div>
      </div>
    </div>
  )
}

function SavedCardsList({
  cards,
  selected,
  onSelect,
  onDelete,
  onAddNew,
  showAddButton,
}: {
  cards: SavedCard[]
  selected: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onAddNew: () => void
  showAddButton: boolean
}) {
  return (
    <div>
      <SectionLabel>Meus cartões</SectionLabel>
      <div className="mt-2 space-y-2">
        {cards.map(c => {
          const isOn = selected === c.id
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl transition-colors"
              style={{
                background: isOn
                  ? 'color-mix(in srgb, var(--cks-primary) 12%, transparent)'
                  : 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
                border: isOn
                  ? '1px solid color-mix(in srgb, var(--cks-primary) 40%, transparent)'
                  : '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isOn ? 'var(--cks-primary)' : 'transparent',
                    border: isOn
                      ? '1px solid var(--cks-primary)'
                      : '1px solid color-mix(in srgb, var(--cks-text) 30%, transparent)',
                  }}
                >
                  {isOn && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--cks-accent)' }}
                    />
                  )}
                </span>
                <div>
                  <div
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--cks-text)' }}
                  >
                    {(c.brand ?? '').toUpperCase() || 'Cartão'} •••• {c.last4}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{
                      color:
                        'color-mix(in srgb, var(--cks-text) 60%, transparent)',
                    }}
                  >
                    {c.bank ? c.bank + ' · ' : ''}
                    {c.expiry_month && c.expiry_year
                      ? `${c.expiry_month}/${c.expiry_year.slice(-2)}`
                      : ''}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                aria-label="Remover cartão"
                className="p-1.5 rounded-md"
                style={{
                  color:
                    'color-mix(in srgb, var(--cks-text) 50%, transparent)',
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {showAddButton && (
          <button
            type="button"
            onClick={onAddNew}
            className="w-full p-3 rounded-xl text-[13px] flex items-center justify-center gap-2"
            style={{
              background: 'transparent',
              border:
                '1px dashed color-mix(in srgb, var(--cks-text) 25%, transparent)',
              color:
                'color-mix(in srgb, var(--cks-text) 70%, transparent)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar outro cartão
          </button>
        )}
      </div>
    </div>
  )
}

function CardForm({
  card,
  setCard,
  saveCard,
  setSaveCard,
  hasOtherCards,
  onCancel,
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
  saveCard: boolean
  setSaveCard: (v: boolean) => void
  hasOtherCards: boolean
  onCancel: (() => void) | null
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>
          {hasOtherCards ? 'Novo cartão' : 'Dados do cartão'}
        </SectionLabel>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px]"
            style={{
              color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
            }}
          >
            Cancelar
          </button>
        )}
      </div>

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
            setCard(c => ({
              ...c,
              ccv: v.replace(/\D/g, '').slice(0, 4),
            }))
          }
        />
      </div>

      <label className="flex items-center gap-2 text-[12px] cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={e => setSaveCard(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: 'var(--cks-primary)' }}
        />
        <span
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 80%, transparent)',
          }}
        >
          Salvar cartão pra próximas cobranças
        </span>
      </label>
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
      <div className="space-y-3">
        <div
          className="text-[11px] p-3 rounded-lg"
          style={{
            background:
              'color-mix(in srgb, var(--cks-text) 4%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
            color:
              'color-mix(in srgb, var(--cks-text) 70%, transparent)',
          }}
        >
          PIX recorrente (Pix Automático do Banco Central): você
          autoriza uma vez no app do seu banco e as próximas cobranças
          são debitadas automaticamente. Pode revogar quando quiser.
        </div>
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
      </div>
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
          background:
            'color-mix(in srgb, var(--cks-primary) 12%, transparent)',
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

// --------------------------------------------------------------------------
// UI utilitários
// --------------------------------------------------------------------------

function glassStyle(): React.CSSProperties {
  return {
    background:
      'linear-gradient(165deg, color-mix(in srgb, var(--cks-text) 8%, transparent), color-mix(in srgb, var(--cks-text) 2%, transparent))',
    backdropFilter: 'blur(18px) saturate(140%)',
    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
    borderRight:
      '1px solid color-mix(in srgb, var(--cks-text) 10%, transparent)',
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
  suffix?: React.ReactNode
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
  suffix,
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
      <div className="relative">
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
        {suffix && (
          <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
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
