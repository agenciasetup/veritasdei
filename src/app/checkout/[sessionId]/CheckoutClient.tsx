'use client'

/**
 * Checkout customizado Veritas — UI client.
 *
 * Renderiza tabs PIX / Cartão (cada uma controlada por settings.allow_*),
 * dispara `/api/payments/asaas/charge` e polla `/api/payments/asaas/status`
 * a cada 3s até `paid=true`. Quando confirmado, redireciona pro perfil.
 *
 * O design respeita as cores configuradas em billing_checkout_settings —
 * cores caem em CSS vars locais (sem reflow nas tokens globais).
 */

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  Copy,
  CreditCard,
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

type PixState = {
  encodedImage: string
  payload: string
  expirationDate: string
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
  return { mensal: 'mês', semestral: '6 meses', anual: 'ano', unico: 'único' }[i]
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

export default function CheckoutClient({
  sessionId,
  amountCents,
  intervalo,
  plan,
  settings,
  user,
}: Props) {
  const tabs: ('pix' | 'credit_card')[] = []
  if (settings.allowPix) tabs.push('pix')
  if (settings.allowCreditCard) tabs.push('credit_card')

  const [tab, setTab] = useState<'pix' | 'credit_card'>(tabs[0] ?? 'pix')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pix, setPix] = useState<PixState | null>(null)
  const [paid, setPaid] = useState(false)
  const [copyHint, setCopyHint] = useState(false)

  // Cartão
  const [card, setCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  })
  const [holder, setHolder] = useState({
    name: user.name,
    email: user.email,
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    addressComplement: '',
    phone: '',
  })
  const [installments, setInstallments] = useState(1)
  const [cardSubmitted, setCardSubmitted] = useState<
    null | 'CONFIRMED' | 'PENDING' | string
  >(null)

  // Polling: roda quando temos pix ativo OU cartão submetido
  const polling = !!pix || cardSubmitted !== null
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

  async function startPix() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/payments/asaas/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, method: 'pix' }),
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

  async function submitCard(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/payments/asaas/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          method: 'credit_card',
          card: {
            holderName: card.holderName.trim(),
            number: card.number.replace(/\s+/g, ''),
            expiryMonth: card.expiryMonth.trim(),
            expiryYear: card.expiryYear.trim(),
            ccv: card.ccv.trim(),
          },
          holder: {
            name: holder.name.trim(),
            email: holder.email.trim(),
            cpfCnpj: holder.cpfCnpj.replace(/\D/g, ''),
            postalCode: holder.postalCode.replace(/\D/g, ''),
            addressNumber: holder.addressNumber.trim(),
            addressComplement: holder.addressComplement.trim() || undefined,
            mobilePhone: holder.phone.replace(/\D/g, '') || undefined,
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
    background: settings.backgroundColor,
    color: settings.textColor,
    minHeight: '100vh',
  }

  return (
    <main style={cssVars} className="px-4 py-10 md:py-16">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          {settings.logoUrl ? (
            <div className="flex justify-center mb-4">
              <Image
                src={settings.logoUrl}
                alt="Veritas"
                width={64}
                height={64}
                className="h-16 w-auto object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: 'color-mix(in srgb, var(--cks-primary) 18%, transparent)',
                border: '1px solid color-mix(in srgb, var(--cks-primary) 35%, transparent)',
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'var(--cks-primary)' }} />
            </div>
          )}
          <h1
            className="text-2xl md:text-3xl mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cks-text)' }}
          >
            {settings.headerTitle}
          </h1>
          <p
            className="text-sm max-w-md mx-auto"
            style={{
              color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {settings.headerSubtitle}
          </p>
        </header>

        {/* Resumo do plano */}
        <section
          className="p-5 rounded-3xl mb-6"
          style={{
            background: 'color-mix(in srgb, var(--cks-text) 5%, transparent)',
            border: '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
          }}
        >
          <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
            <div>
              <div
                className="text-base font-medium"
                style={{ color: 'var(--cks-text)', fontFamily: 'var(--font-body)' }}
              >
                {plan.nome}
              </div>
              {plan.descricao && (
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
                  }}
                >
                  {plan.descricao}
                </div>
              )}
            </div>
            <div className="text-right">
              <div
                className="text-lg"
                style={{ color: 'var(--cks-primary)', fontWeight: 700 }}
              >
                {formatBRL(amountCents)}
              </div>
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
                }}
              >
                por {intervaloLabel(intervalo)}
              </div>
            </div>
          </div>
          {plan.beneficios.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {plan.beneficios.slice(0, 4).map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs"
                  style={{
                    color: 'color-mix(in srgb, var(--cks-text) 80%, transparent)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Check
                    className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                    style={{ color: 'var(--cks-primary)' }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Confirmação de pagamento */}
        {paid && (
          <section
            className="mb-6 p-5 rounded-3xl text-center"
            style={{
              background: 'color-mix(in srgb, #66BB6A 18%, transparent)',
              border: '1px solid #66BB6A',
            }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 bg-[#66BB6A]/20">
              <Check className="w-6 h-6" style={{ color: '#66BB6A' }} />
            </div>
            <div
              className="text-base"
              style={{ color: '#66BB6A', fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Pagamento confirmado
            </div>
            <div
              className="text-xs mt-1"
              style={{
                color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
              }}
            >
              Redirecionando pro seu perfil…
            </div>
          </section>
        )}

        {!paid && tabs.length > 1 && (
          <div
            className="grid grid-cols-2 gap-2 p-1 rounded-2xl mb-4"
            style={{
              background: 'color-mix(in srgb, var(--cks-text) 5%, transparent)',
              border: '1px solid color-mix(in srgb, var(--cks-text) 10%, transparent)',
            }}
          >
            {tabs.map(t => {
              const active = t === tab
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: active ? 'var(--cks-primary)' : 'transparent',
                    color: active ? 'var(--cks-accent)' : 'var(--cks-text)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t === 'pix' ? (
                    <>
                      <QrCode className="w-4 h-4" />
                      PIX
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Cartão
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-3 rounded-2xl text-sm"
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

        {/* PIX */}
        {!paid && tab === 'pix' && (
          <section
            className="p-6 rounded-3xl mb-6"
            style={{
              background: 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
              border: '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
            }}
          >
            {!pix ? (
              <button
                type="button"
                onClick={startPix}
                disabled={loading}
                className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
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
            ) : (
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
                  className="text-xs text-center"
                  style={{
                    color: 'color-mix(in srgb, var(--cks-text) 70%, transparent)',
                  }}
                >
                  Aponte a câmera do seu app de banco — ou copie o código abaixo.
                </div>
                <button
                  type="button"
                  onClick={copyPayload}
                  className="w-full px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
                  style={{
                    background: 'color-mix(in srgb, var(--cks-primary) 15%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--cks-primary) 35%, transparent)',
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
            )}
          </section>
        )}

        {/* Cartão */}
        {!paid && tab === 'credit_card' && (
          <section
            className="p-6 rounded-3xl mb-6"
            style={{
              background: 'color-mix(in srgb, var(--cks-text) 4%, transparent)',
              border: '1px solid color-mix(in srgb, var(--cks-text) 12%, transparent)',
            }}
          >
            {cardSubmitted ? (
              <div className="text-center py-6">
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
            ) : (
              <form onSubmit={submitCard} className="flex flex-col gap-3">
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
                    onChange={e => setCard(c => ({ ...c, holderName: e.target.value }))}
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
                      placeholder="AA"
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

                {settings.installmentsMax > 1 && (
                  <Field label="Parcelas">
                    <select
                      value={installments}
                      onChange={e => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={inputStyle()}
                    >
                      {Array.from({ length: settings.installmentsMax }).map((_, i) => {
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

                <div
                  className="text-[11px] uppercase tracking-wider mt-3 mb-1"
                  style={{
                    color: 'color-mix(in srgb, var(--cks-text) 50%, transparent)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Dados do titular
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="CPF/CNPJ">
                    <input
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={maskCpfCnpj(holder.cpfCnpj)}
                      onChange={e =>
                        setHolder(h => ({ ...h, cpfCnpj: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={inputStyle()}
                    />
                  </Field>
                  <Field label="CEP">
                    <input
                      inputMode="numeric"
                      placeholder="00000-000"
                      value={maskCep(holder.postalCode)}
                      onChange={e =>
                        setHolder(h => ({ ...h, postalCode: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={inputStyle()}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Número">
                    <input
                      placeholder="123"
                      value={holder.addressNumber}
                      onChange={e =>
                        setHolder(h => ({ ...h, addressNumber: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={inputStyle()}
                    />
                  </Field>
                  <Field label="Complemento (opcional)">
                    <input
                      value={holder.addressComplement}
                      onChange={e =>
                        setHolder(h => ({
                          ...h,
                          addressComplement: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-3 rounded-xl outline-none"
                      style={inputStyle()}
                    />
                  </Field>
                </div>

                <Field label="Telefone (opcional)">
                  <input
                    inputMode="tel"
                    placeholder="(11) 90000-0000"
                    value={holder.phone}
                    onChange={e => setHolder(h => ({ ...h, phone: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl outline-none"
                    style={inputStyle()}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 px-5 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
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
            )}
          </section>
        )}

        <div
          className="flex items-center justify-center gap-2 text-[11px] mb-3"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 60%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Pagamento processado pela Asaas — PCI Level 1.
        </div>
        <p
          className="text-[11px] text-center"
          style={{
            color: 'color-mix(in srgb, var(--cks-text) 55%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {settings.footerText}
        </p>
      </div>
    </main>
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
