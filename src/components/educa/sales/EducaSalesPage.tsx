'use client'

/**
 * Página de venda do Veritas Educa.
 *
 * Estética de landing page: surface-velvet/parchment, btn-gold, mockups
 * SVG simulando o app, animações framer-motion. Mobile e desktop ambos
 * cuidados.
 *
 * Renderiza em:
 *   - app/educa/page.tsx  (visitante deslogado na raiz do subdomínio)
 *   - app/educa/assine    (logado sem assinatura, mandado pelo middleware)
 *
 * Fluxo:
 *   deslogado: escolhe plano → cadastra (e-mail+senha ou Google) → CPF/telefone
 *   vão pro profile → /api/payments/checkout → checkout Asaas.
 *
 *   logado: aparece direto "Assinar — {plano}" → mesmo checkout.
 *
 * O cadastro instantâneo depende da confirmação de e-mail desativada no
 * Supabase. Se estiver ativa, o checkout responde 401 e mostramos a
 * mensagem "confirme seu e-mail" — sem quebrar.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type {
  EducaSalesIntervalo,
  EducaSalesPrice,
} from '@/lib/educa/server-data'

import Hero from './Hero'
import EstudarSection from './EstudarSection'
import Features from './Features'
import Pricing from './Pricing'
import Signup from './Signup'

// ──────────────────────────────────────────────────────────────────────────
// Helpers — máscaras e validações
// ──────────────────────────────────────────────────────────────────────────

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

function traduzirErro(error: string): string {
  if (error.includes('User already registered') || error.includes('already been registered'))
    return 'Este e-mail já tem conta. Clique em "Entrar" pra acessar.'
  if (error.includes('Password should be at least'))
    return 'A senha precisa de pelo menos 8 caracteres.'
  if (error.includes('rate limit') || error.includes('Email rate limit'))
    return 'Muitas tentativas. Aguarde um momento e tente de novo.'
  if (error.includes('invalid') && error.includes('email'))
    return 'E-mail inválido. Confira o endereço digitado.'
  return error
}

// ──────────────────────────────────────────────────────────────────────────
// Página
// ──────────────────────────────────────────────────────────────────────────

type Props = {
  prices: EducaSalesPrice[]
  isAuthenticated: boolean
  prefillEmail: string | null
  prefillName: string | null
  /** Plano vindo de ?plan= — usado pra retomar o checkout após login Google. */
  autoPlan: EducaSalesIntervalo | null
}

export default function EducaSalesPage({
  prices,
  isAuthenticated,
  prefillEmail,
  prefillName,
  autoPlan,
}: Props) {
  const { signUp, signInWithOAuth } = useAuth()

  // Plano selecionado: prioriza ?plan= (volta do Google), senão anual, senão
  // o primeiro disponível.
  const defaultIntervalo: EducaSalesIntervalo = useMemo(() => {
    if (autoPlan && prices.some(p => p.intervalo === autoPlan)) return autoPlan
    if (prices.some(p => p.intervalo === 'anual')) return 'anual'
    return prices[0]?.intervalo ?? 'anual'
  }, [autoPlan, prices])

  const [intervalo, setIntervalo] = useState<EducaSalesIntervalo>(defaultIntervalo)

  const [name, setName] = useState(prefillName ?? '')
  const [email, setEmail] = useState(prefillEmail ?? '')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const signupRef = useRef<HTMLElement>(null)
  const autoFiredRef = useRef(false)

  const selectedPrice = useMemo(
    () => prices.find(p => p.intervalo === intervalo) ?? null,
    [prices, intervalo],
  )

  function scrollToSignup() {
    signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function startCheckout(planIntervalo: EducaSalesIntervalo) {
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCodigo: 'veritas-educa', intervalo: planIntervalo }),
      })
      if (res.status === 401) {
        // Confirmação de e-mail ainda ativa no Supabase — sessão pendente.
        setInfo(
          'Conta criada! Enviamos um e-mail de confirmação — confirme o endereço e volte aqui pra finalizar a assinatura.',
        )
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

  // Retoma o checkout automaticamente quando volta do login Google.
  useEffect(() => {
    if (isAuthenticated && autoPlan && !autoFiredRef.current) {
      autoFiredRef.current = true
      startCheckout(autoPlan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!name.trim()) return setError('Informe seu nome completo.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('E-mail inválido.')
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase())
      return setError('Os e-mails não conferem.')
    if (digits(telefone).length < 10)
      return setError('Telefone inválido. Inclua o DDD, ex: (11) 99999-9999.')
    if (!isValidCPF(cpf)) return setError('CPF inválido. Confira os números.')
    if (password.length < 8)
      return setError('A senha precisa de pelo menos 8 caracteres.')
    if (password !== passwordConfirm) return setError('As senhas não conferem.')
    if (!acceptedLegal || !ageConfirmed)
      return setError('Pra criar a conta, aceite os termos e confirme sua idade.')

    setLoading(true)
    const { error: signUpError } = await signUp(email.trim(), password, name.trim())
    if (signUpError) {
      setError(traduzirErro(signUpError))
      setLoading(false)
      return
    }

    // Salva CPF + telefone no profile pra pré-preencher o checkout.
    await fetch('/api/educa/signup-billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: digits(cpf), telefone: digits(telefone) }),
    }).catch(() => {})

    await startCheckout(intervalo)
  }

  async function handleGoogle() {
    // Google não exige os checkboxes: a aceitação dos termos é coberta pelo
    // disclaimer abaixo do botão e o consentimento de idade já é coletado
    // no fluxo de OAuth do Google (Google só libera conta pra ≥ 13 anos
    // automaticamente). Mantemos os checkboxes só pro caminho de e-mail.
    setError(null)
    setInfo(null)
    setLoading(true)
    const { error: oauthError } = await signInWithOAuth(
      'google',
      `/educa/assine?plan=${intervalo}`,
    )
    if (oauthError) {
      setError(traduzirErro(oauthError))
      setLoading(false)
    }
  }

  return (
    <>
      <Hero isAuthenticated={isAuthenticated} onPrimaryClick={scrollToSignup} />

      <EstudarSection />

      <Features />

      <Pricing
        prices={prices}
        selected={intervalo}
        onSelect={setIntervalo}
        onAssinar={scrollToSignup}
      />

      <Signup
        ref={signupRef}
        isAuthenticated={isAuthenticated}
        prefillName={prefillName}
        prefillEmail={prefillEmail}
        intervalo={intervalo}
        selectedPrice={selectedPrice}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        emailConfirm={emailConfirm}
        setEmailConfirm={setEmailConfirm}
        telefoneMasked={maskPhone(telefone)}
        setTelefone={setTelefone}
        cpfMasked={maskCPF(cpf)}
        setCpf={setCpf}
        password={password}
        setPassword={setPassword}
        passwordConfirm={passwordConfirm}
        setPasswordConfirm={setPasswordConfirm}
        showPassword={showPassword}
        togglePassword={() => setShowPassword(s => !s)}
        acceptedLegal={acceptedLegal}
        setAcceptedLegal={setAcceptedLegal}
        ageConfirmed={ageConfirmed}
        setAgeConfirmed={setAgeConfirmed}
        loading={loading}
        error={error}
        info={info}
        onSubmit={handleSubmitForm}
        onGoogle={handleGoogle}
        onSubscribe={() => startCheckout(intervalo)}
      />

      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer className="surface-velvet relative py-12 md:py-16 overflow-hidden">
      <div className="max-w-4xl mx-auto px-5 md:px-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-5 opacity-70">
          <span
            className="w-12 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.8))' }}
          />
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <g stroke="#C9A84C" fill="none" strokeWidth="1">
              <path d="M7 1 L7 13 M1 7 L13 7" />
              <circle cx="7" cy="7" r="2" />
            </g>
          </svg>
          <span
            className="w-12 h-px"
            style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.8))' }}
          />
        </div>
        <p
          className="text-lg md:text-xl mb-2"
          style={{
            color: '#E6D9B5',
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
          }}
        >
          Ad maiorem Dei gloriam.
        </p>
        <p
          className="text-xs mb-6"
          style={{
            color: 'rgba(242,237,228,0.55)',
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.18em',
          }}
        >
          FIEL AO MAGISTÉRIO DA IGREJA CATÓLICA
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Link href="/privacidade" className="underline-offset-4 hover:underline" style={{ color: 'rgba(242,237,228,0.65)' }}>
            Privacidade
          </Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
          <Link href="/termos" className="underline-offset-4 hover:underline" style={{ color: 'rgba(242,237,228,0.65)' }}>
            Termos
          </Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
          <Link href="/login?next=/educa" className="underline-offset-4 hover:underline" style={{ color: '#D9C077' }}>
            Já tenho conta
          </Link>
        </div>
      </div>
    </footer>
  )
}
