'use client'

/**
 * Cliente do checkout focado. Renderiza:
 *   - selo dourado da marca
 *   - chip do usuário logado com botão "Trocar conta"
 *   - selo de plano selecionado + grade pra trocar
 *   - form pequeno com só o que falta (CPF/telefone)
 *   - botão "Pagar agora" grande
 *
 * O flow é sempre o mesmo: salva CPF/telefone se preenchido, posta no
 * /api/payments/checkout e redireciona pro Asaas. Não duplica a landing
 * inteira.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Loader2, Lock, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import CrossIcon from '@/components/icons/CrossIcon'
import type {
  EducaSalesIntervalo,
  EducaSalesPrice,
} from '@/lib/educa/server-data'

type Props = {
  prices: EducaSalesPrice[]
  autoPlan: EducaSalesIntervalo | null
  name: string | null
  email: string | null
  cpf: string | null
  telefone: string | null
}

const NOMES: Record<EducaSalesIntervalo, string> = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
  unico: 'Único',
}

const SUFIXOS: Record<EducaSalesIntervalo, string> = {
  mensal: 'por mês',
  semestral: 'a cada 6 meses',
  anual: 'por ano',
  unico: 'pagamento único',
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function digits(v: string): string {
  return v.replace(/\D/g, '')
}

function maskCPF(v: string): string {
  return digits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(v: string): string {
  const d = digits(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3').trim()
  return d.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3').trim()
}

function isValidCPF(raw: string): boolean {
  const cpf = digits(raw)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10) check = 0
  if (check !== Number(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i)
  check = (sum * 10) % 11
  if (check === 10) check = 0
  return check === Number(cpf[10])
}

export default function EducaCheckoutClient({
  prices,
  autoPlan,
  name,
  email,
  cpf: initialCpf,
  telefone: initialTelefone,
}: Props) {
  const router = useRouter()
  const { signOut } = useAuth()

  const defaultIntervalo: EducaSalesIntervalo = useMemo(() => {
    if (autoPlan && prices.some(p => p.intervalo === autoPlan)) return autoPlan
    if (prices.some(p => p.intervalo === 'anual')) return 'anual'
    return prices[0]?.intervalo ?? 'anual'
  }, [autoPlan, prices])

  const [intervalo, setIntervalo] = useState<EducaSalesIntervalo>(defaultIntervalo)
  const [cpf, setCpf] = useState(initialCpf ?? '')
  const [telefone, setTelefone] = useState(initialTelefone ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const autoFiredRef = useRef(false)

  const selectedPrice = useMemo(
    () => prices.find(p => p.intervalo === intervalo) ?? null,
    [prices, intervalo],
  )

  async function startCheckout(planIntervalo: EducaSalesIntervalo) {
    setError(null)
    setInfo(null)
    setLoading(true)

    // Salva CPF/telefone primeiro. Se signup-billing retornar 409
    // (CPF de outra conta), aborta o checkout e mostra erro pro usuário
    // corrigir — não dá pra emitir cobrança com CPF de terceiro.
    const cpfDigits = digits(cpf)
    const telefoneDigits = digits(telefone)
    if (cpfDigits.length === 11 || telefoneDigits.length >= 10) {
      try {
        const billingRes = await fetch('/api/educa/signup-billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: cpfDigits, telefone: telefoneDigits }),
        })
        if (billingRes.status === 409) {
          const data = await billingRes.json().catch(() => ({}))
          setError(
            data?.cpf_conflict
              ? 'Este CPF já está cadastrado em outra conta. Confira os números ou entre com a outra conta.'
              : (data?.error ?? 'Não foi possível salvar seus dados.'),
          )
          setLoading(false)
          return
        }
      } catch {
        /* erro de rede não bloqueia — o checkout coleta os dados de novo */
      }
    }

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCodigo: 'veritas-educa', intervalo: planIntervalo }),
      })
      if (res.status === 401) {
        setInfo('Sessão expirada. Faça login novamente.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Não foi possível iniciar o pagamento.')
      }
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  // Quando o usuário volta do Google OAuth com ?plan=, dispara o
  // checkout direto. Sem o autoFiredRef o useEffect podia repetir.
  useEffect(() => {
    if (autoPlan && !autoFiredRef.current) {
      // Só dispara automático se já tiver CPF + telefone — senão o
      // usuário precisa preencher e clicar manualmente.
      const hasCpf = digits(initialCpf ?? '').length === 11
      const hasTelefone = digits(initialTelefone ?? '').length >= 10
      if (hasCpf && hasTelefone) {
        autoFiredRef.current = true
        void startCheckout(autoPlan)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePay() {
    setError(null)

    if (digits(telefone).length < 10) {
      setError('Telefone inválido. Inclua o DDD, ex: (11) 99999-9999.')
      return
    }
    if (!isValidCPF(cpf)) {
      setError('CPF inválido. Confira os números.')
      return
    }
    await startCheckout(intervalo)
  }

  async function handleSwitchAccount() {
    setLoading(true)
    try {
      await signOut()
    } catch {
      /* mesmo com erro segue pro login */
    }
    router.push('/login?next=/educa/checkout')
  }

  return (
    <div
      className="theme-lock-dark min-h-screen"
      style={{ background: 'var(--surface-1)' }}
    >
      {/* Topo: marca + logout */}
      <header className="border-b" style={{ borderColor: 'rgba(201,168,76,0.18)' }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link
            href="/educa"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <CrossIcon size="xs" />
            <span
              className="text-[10px] uppercase"
              style={{
                color: '#D9C077',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.28em',
              }}
            >
              Veritas Educa
            </span>
          </Link>
          <button
            type="button"
            onClick={handleSwitchAccount}
            disabled={loading}
            className="inline-flex items-center gap-2 text-[11px] uppercase hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{
              color: 'rgba(242,237,228,0.65)',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.18em',
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Trocar conta
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 md:px-8 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <p
            className="eyebrow-label inline-flex items-center gap-2"
            style={{ color: '#D9C077' }}
          >
            <span className="inline-block w-1 h-1 rounded-full" style={{ background: '#C9A84C' }} />
            Falta só o pagamento
          </p>
          <h1
            className="display-cormorant text-3xl sm:text-4xl md:text-5xl leading-[1.05] mt-3"
            style={{ color: '#F5EFE6', textWrap: 'balance', fontWeight: 600 }}
          >
            Finalize sua assinatura{' '}
            <span className="italic" style={{ color: '#E6D9B5' }}>
              do Veritas Educa.
            </span>
          </h1>
          {name && (
            <p
              className="text-sm mt-4"
              style={{ color: 'rgba(242,237,228,0.7)', fontFamily: 'var(--font-body)' }}
            >
              Conta:{' '}
              <strong style={{ color: '#F5EFE6' }}>{name}</strong>
              {email && (
                <>
                  {' '}<span style={{ color: 'rgba(242,237,228,0.5)' }}>· {email}</span>
                </>
              )}
            </p>
          )}
        </div>

        {error && (
          <div
            className="mb-5 p-3 rounded-2xl text-sm"
            style={{
              background: 'rgba(217,79,92,0.12)',
              border: '1px solid rgba(217,79,92,0.35)',
              color: '#F5C6CB',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {error}
          </div>
        )}
        {info && (
          <div
            className="mb-5 p-3 rounded-2xl text-sm"
            style={{
              background: 'rgba(201,168,76,0.10)',
              border: '1px solid rgba(201,168,76,0.35)',
              color: '#E6D9B5',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {info}
          </div>
        )}

        {/* Seletor de plano */}
        <section className="mb-6">
          <h2
            className="eyebrow-label mb-3"
            style={{ color: 'rgba(242,237,228,0.6)' }}
          >
            ◆ Escolha o plano
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {prices
              .filter(p => p.intervalo !== 'unico')
              .map(p => {
                const isSelected = p.intervalo === intervalo
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIntervalo(p.intervalo)}
                    className="text-left p-4 rounded-2xl transition-all"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(160deg, rgba(28,22,16,0.96), rgba(12,10,8,0.98))'
                        : 'rgba(20,18,14,0.6)',
                      border: isSelected
                        ? '1.5px solid #C9A84C'
                        : '1px solid var(--border-1)',
                    }}
                  >
                    <p
                      className="eyebrow-label mb-2"
                      style={{
                        color: isSelected ? '#D9C077' : 'rgba(242,237,228,0.55)',
                      }}
                    >
                      {NOMES[p.intervalo]}
                    </p>
                    <p
                      className="display-cinzel tabular-nums leading-none"
                      style={{
                        color: '#F5EFE6',
                        fontSize: 24,
                        fontWeight: 600,
                      }}
                    >
                      {formatBRL(p.amountCents)}
                    </p>
                    <p
                      className="text-[11px] mt-1"
                      style={{
                        color: 'rgba(242,237,228,0.55)',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {SUFIXOS[p.intervalo]}
                    </p>
                  </button>
                )
              })}
          </div>
        </section>

        {/* Form */}
        <section className="mb-6">
          <h2
            className="eyebrow-label mb-3"
            style={{ color: 'rgba(242,237,228,0.6)' }}
          >
            ◆ Pra emitir o pagamento
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="CPF"
              value={maskCPF(cpf)}
              onChange={setCpf}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            <Field
              label="Telefone (com DDD)"
              value={maskPhone(telefone)}
              onChange={setTelefone}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
          </div>
        </section>

        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="w-full px-5 py-4 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 14px 34px rgba(201,168,76,0.3)',
          }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pagar agora{selectedPrice ? ` · ${formatBRL(selectedPrice.amountCents)}` : ''}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p
          className="text-[11px] text-center mt-4 flex items-center justify-center gap-1.5"
          style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'Poppins, sans-serif' }}
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
          Pagamento seguro pela Asaas · Pix, cartão ou boleto · Cancele quando quiser
        </p>
      </main>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div>
      <label
        className="block text-[11px] mb-1.5 uppercase"
        style={{
          color: 'rgba(242,237,228,0.6)',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.16em',
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(201,168,76,0.25)',
          color: '#F5EFE6',
          fontFamily: 'Poppins, sans-serif',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#C9A84C'
          e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.16)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(201,168,76,0.25)'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}
