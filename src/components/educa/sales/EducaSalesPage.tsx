'use client'

/**
 * Página de venda do Veritas Educa.
 *
 * Renderizada em dois lugares:
 *   - raiz do subdomínio educa (app/educa/page.tsx) p/ visitante deslogado;
 *   - /educa/assine, onde o middleware joga o usuário logado sem assinatura.
 *
 * Fluxo da venda (deslogado):
 *   escolhe plano → preenche cadastro (ou Google) → cria conta → CPF/telefone
 *   vão pro profile → /api/payments/checkout → redireciona pro checkout Asaas.
 *
 * O cadastro instantâneo só funciona com a confirmação de e-mail DESATIVADA
 * no Supabase (Auth → Providers → Email → "Confirm email" off). Se estiver
 * ativa, o checkout responde 401 e mostramos a mensagem de confirmação.
 *
 * Fluxo da venda (logado sem assinatura): some o cadastro, fica só o botão
 * "Assinar" que chama o checkout direto.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  ShieldCheck,
  Swords,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import CrossIcon from '@/components/icons/CrossIcon'
import type { EducaSalesIntervalo, EducaSalesPrice } from '@/lib/educa/server-data'

// ──────────────────────────────────────────────────────────────────────────
// Conteúdo
// ──────────────────────────────────────────────────────────────────────────

const FEATURES: {
  n: number
  icon: typeof BookOpen
  title: string
  desc: string
  bullets?: string[]
}[] = [
  {
    n: 1,
    icon: BookOpen,
    title: 'Estudar',
    desc: 'Trilhas guiadas pelos três pilares da fé: Bíblia, Magistério e Patrística. Cada módulo tem leitura, explicação e uma avaliação no fim.',
    bullets: [
      'Anote dentro do app — suas notas ficam salvas em cada lição.',
      'Estude em grupo: convide alguém e acompanhem o progresso lado a lado.',
      'Avaliações ao fim de cada módulo, com XP e conquistas pra marcar o que você já dominou.',
    ],
  },
  {
    n: 2,
    icon: Heart,
    title: 'Terço em grupo',
    desc: 'Reze o terço com outras pessoas ao mesmo tempo, cada um no seu lugar. Entre por um código e rezem juntos, mistério por mistério.',
  },
  {
    n: 3,
    icon: Swords,
    title: 'Modo debate',
    desc: 'Treine apologética contra uma IA que defende posições protestantes — Sola Scriptura, Maria, Eucaristia, papado. Você responde e recebe uma avaliação do seu argumento.',
  },
  {
    n: 4,
    icon: UsersRound,
    title: 'Grupo de estudos',
    desc: 'Crie ou entre num grupo de estudos. Definam metas em comum, vejam quem está em dia e mantenham a constância juntos.',
  },
  {
    n: 5,
    icon: Trophy,
    title: 'Colecionar conquistas',
    desc: 'Cada lição concluída e cada sequência mantida desbloqueia cartas — santos, documentos e marcos da Igreja. Um acervo que cresce conforme você estuda.',
  },
]

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function formatBRL(cents: number): string {
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

/** Validação de CPF com dígitos verificadores — evita atrito no checkout. */
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

function intervaloNome(i: EducaSalesIntervalo): string {
  return { mensal: 'Mensal', semestral: 'Semestral', anual: 'Anual', unico: 'Único' }[i]
}

function intervaloSufixo(i: EducaSalesIntervalo): string {
  return {
    mensal: 'por mês',
    semestral: 'a cada 6 meses',
    anual: 'por ano',
    unico: 'pagamento único',
  }[i]
}

function mesesDoIntervalo(i: EducaSalesIntervalo): number {
  return { mensal: 1, semestral: 6, anual: 12, unico: 1 }[i]
}

function traduzirErro(error: string): string {
  if (error.includes('User already registered') || error.includes('already been registered'))
    return 'Este e-mail já tem conta. Use "Já tenho conta" pra entrar.'
  if (error.includes('Password should be at least'))
    return 'A senha precisa de pelo menos 8 caracteres.'
  if (error.includes('rate limit') || error.includes('Email rate limit'))
    return 'Muitas tentativas. Aguarde um momento e tente de novo.'
  if (error.includes('invalid') && error.includes('email'))
    return 'E-mail inválido. Confira o endereço digitado.'
  return error
}

// ──────────────────────────────────────────────────────────────────────────
// Componente
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

  const mensal = prices.find(p => p.intervalo === 'mensal')
  const defaultIntervalo: EducaSalesIntervalo =
    (autoPlan && prices.some(p => p.intervalo === autoPlan) ? autoPlan : null) ??
    (prices.some(p => p.intervalo === 'anual') ? 'anual' : prices[0]?.intervalo) ??
    'anual'

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

  const formRef = useRef<HTMLElement>(null)
  const autoFiredRef = useRef(false)

  const selectedPrice = prices.find(p => p.intervalo === intervalo) ?? null

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        // Sessão ainda não vale (confirmação de e-mail está ativa no Supabase).
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

  // Retoma o checkout automaticamente quando o usuário volta do login Google
  // (educa/assine?plan=...).
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
    // Best-effort: se falhar, o checkout coleta de novo.
    await fetch('/api/educa/signup-billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: digits(cpf), telefone: digits(telefone) }),
    }).catch(() => {})

    await startCheckout(intervalo)
  }

  async function handleGoogle() {
    setError(null)
    setInfo(null)
    if (!acceptedLegal || !ageConfirmed) {
      setError('Pra criar a conta com o Google, aceite os termos e confirme sua idade.')
      scrollToForm()
      return
    }
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
    <main className="min-h-screen" style={{ background: 'var(--surface-1)' }}>
      {/* ─── HERO ─── */}
      <section className="px-5 pt-12 pb-10 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-5">
            <CrossIcon size="lg" />
          </div>
          <p
            className="text-[11px] uppercase tracking-[0.28em] mb-3"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Veritas Educa
          </p>
          <h1
            className="text-3xl sm:text-4xl leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            Estude a fé católica com método.
          </h1>
          <p
            className="text-[15px] leading-relaxed mb-7"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            Trilhas de Bíblia, Magistério e Patrística, terço em grupo, modo
            debate e conquistas pra colecionar. Tudo em um app, no seu ritmo.
          </p>
          <button
            type="button"
            onClick={scrollToForm}
            className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {isAuthenticated ? 'Escolher meu plano' : 'Criar conta e assinar'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {!isAuthenticated && (
            <Link
              href="/login?next=/educa"
              className="inline-block mt-4 text-sm underline"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Já tenho conta
            </Link>
          )}
        </div>
      </section>

      {/* ─── FUNÇÕES ─── */}
      <section className="px-5 py-10" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-md mx-auto">
          <h2
            className="text-2xl mb-2 text-center"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            O que você usa por dentro
          </h2>
          <p
            className="text-sm text-center mb-8"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Cinco funções, todas inclusas no plano.
          </p>

          <div className="flex flex-col gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div
                  key={f.n}
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                      style={{
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--border-1)',
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h3
                      className="text-lg"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-1)',
                      }}
                    >
                      <span style={{ color: 'var(--accent)' }}>{f.n}.</span>{' '}
                      {f.title}
                    </h3>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    {f.desc}
                  </p>
                  {f.bullets && (
                    <ul className="flex flex-col gap-2 mt-3">
                      {f.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[13px]"
                          style={{
                            color: 'var(--text-2)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          <Check
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--accent)' }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── PLANOS ─── */}
      <section className="px-5 py-10">
        <div className="max-w-md mx-auto">
          <h2
            className="text-2xl mb-2 text-center"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            Escolha seu plano
          </h2>
          <p
            className="text-sm text-center mb-8"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Mesmo acesso a tudo. A diferença é só quanto tempo você assina de
            uma vez. Cancele quando quiser.
          </p>

          {prices.length === 0 ? (
            <p
              className="text-sm text-center"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Planos indisponíveis no momento. Tente novamente em instantes.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {prices.map(p => {
                const selected = p.intervalo === intervalo
                const meses = mesesDoIntervalo(p.intervalo)
                const porMes = p.amountCents / meses
                const economia =
                  mensal && p.intervalo !== 'mensal' && p.intervalo !== 'unico'
                    ? Math.round(
                        ((mensal.amountCents * meses - p.amountCents) /
                          (mensal.amountCents * meses)) *
                          100,
                      )
                    : 0
                const destaque = p.intervalo === 'anual'
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIntervalo(p.intervalo)}
                    className="w-full p-4 rounded-2xl flex items-center gap-3 text-left transition-all"
                    style={{
                      background: selected
                        ? 'var(--accent-soft)'
                        : 'var(--surface-2)',
                      border: selected
                        ? '1.5px solid var(--accent)'
                        : '1px solid var(--border-1)',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: selected ? 'var(--accent)' : 'transparent',
                        border: selected
                          ? '1px solid var(--accent)'
                          : '1.5px solid var(--border-1)',
                      }}
                    >
                      {selected && (
                        <Check
                          className="w-3 h-3"
                          style={{ color: 'var(--accent-contrast)' }}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium"
                          style={{
                            color: 'var(--text-1)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {intervaloNome(p.intervalo)}
                        </span>
                        {destaque && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{
                              background: 'var(--accent)',
                              color: 'var(--accent-contrast)',
                              fontWeight: 700,
                            }}
                          >
                            Recomendado
                          </span>
                        )}
                        {economia > 0 && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background:
                                'color-mix(in srgb, var(--success) 18%, transparent)',
                              color: 'var(--success)',
                            }}
                          >
                            economize {economia}%
                          </span>
                        )}
                      </div>
                      {p.intervalo !== 'mensal' && p.intervalo !== 'unico' && (
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--text-3)' }}
                        >
                          equivale a {formatBRL(Math.round(porMes))} por mês
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className="text-lg tabular-nums"
                        style={{
                          color: 'var(--text-1)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {formatBRL(p.amountCents)}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--text-3)' }}
                      >
                        {intervaloSufixo(p.intervalo)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── CADASTRO / ASSINAR ─── */}
      <section
        ref={formRef}
        id="cadastro"
        className="px-5 py-10 scroll-mt-4"
        style={{ background: 'var(--surface-2)' }}
      >
        <div className="max-w-md mx-auto">
          <h2
            className="text-2xl mb-2 text-center"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            {isAuthenticated ? 'Finalize sua assinatura' : 'Crie sua conta'}
          </h2>
          <p
            className="text-sm text-center mb-7"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {isAuthenticated
              ? 'Sua conta já está pronta. Confirme o plano e siga pro pagamento.'
              : `Plano selecionado: ${intervaloNome(intervalo)}${
                  selectedPrice ? ` — ${formatBRL(selectedPrice.amountCents)}` : ''
                }. Você cria a conta e já assina, sem voltar depois.`}
          </p>

          {error && (
            <div
              className="mb-4 p-3 rounded-2xl text-sm"
              style={{
                background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                color: 'var(--danger)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </div>
          )}

          {info && (
            <div
              className="mb-4 p-3 rounded-2xl text-sm flex items-start gap-2"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-1)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Check
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--accent)' }}
              />
              {info}
            </div>
          )}

          {isAuthenticated ? (
            <div
              className="p-6 rounded-3xl"
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border-1)',
              }}
            >
              <p
                className="text-sm mb-5 flex items-start gap-2"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
              >
                <ShieldCheck
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: 'var(--accent)' }}
                />
                <span>
                  Você está logado
                  {prefillName || prefillEmail ? (
                    <>
                      {' '}como{' '}
                      <strong style={{ color: 'var(--text-1)' }}>
                        {prefillName ?? prefillEmail}
                      </strong>
                    </>
                  ) : null}
                  . A assinatura fica vinculada a esta conta.
                </span>
              </p>
              <button
                type="button"
                onClick={() => startCheckout(intervalo)}
                disabled={loading}
                className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Assinar — {intervaloNome(intervalo)}
                    {selectedPrice ? ` (${formatBRL(selectedPrice.amountCents)})` : ''}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div
              className="p-6 rounded-3xl"
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border-1)',
              }}
            >
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#ffffff', color: '#1f1f1f', fontFamily: 'var(--font-body)' }}
              >
                <GoogleIcon />
                Continuar com Google
              </button>
              <p
                className="text-[11px] text-center mt-2"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                Mais rápido — preenche seu nome e e-mail automaticamente.
              </p>

              <div className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px" style={{ background: 'var(--border-1)' }} />
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  ou preencha seus dados
                </span>
                <span className="flex-1 h-px" style={{ background: 'var(--border-1)' }} />
              </div>

              <form onSubmit={handleSubmitForm} className="flex flex-col gap-3">
                <Field
                  label="Nome completo"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={setName}
                  placeholder="Seu nome"
                />
                <Field
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="seu@email.com"
                />
                <Field
                  label="Confirme o e-mail"
                  type="email"
                  autoComplete="off"
                  value={emailConfirm}
                  onChange={setEmailConfirm}
                  placeholder="Digite o e-mail de novo"
                />
                <Field
                  label="Telefone (com DDD)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={maskPhone(telefone)}
                  onChange={v => setTelefone(v)}
                  placeholder="(11) 99999-9999"
                />
                <Field
                  label="CPF"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={maskCPF(cpf)}
                  onChange={v => setCpf(v)}
                  placeholder="000.000.000-00"
                  hint="Necessário pra emitir o pagamento."
                />
                <PasswordField
                  label="Senha"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  toggle={() => setShowPassword(s => !s)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirme a senha"
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  show={showPassword}
                  toggle={() => setShowPassword(s => !s)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />

                <LegalBlock
                  acceptedLegal={acceptedLegal}
                  setAcceptedLegal={setAcceptedLegal}
                  ageConfirmed={ageConfirmed}
                  setAgeConfirmed={setAgeConfirmed}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 px-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Criar conta e ir pro pagamento
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <p
            className="text-[11px] text-center mt-4 flex items-center justify-center gap-1.5"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            Pagamento processado com segurança. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* ─── RODAPÉ ─── */}
      <footer
        className="px-5 py-8 text-center"
        style={{ background: 'var(--surface-1)' }}
      >
        <p
          className="text-sm mb-2"
          style={{
            color: 'var(--text-2)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Ad maiorem Dei gloriam.
        </p>
        <p
          className="text-xs mb-4"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Fiel ao Magistério da Igreja Católica.
        </p>
        <div
          className="flex items-center justify-center gap-4 text-xs"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <Link href="/privacidade" className="underline" style={{ color: 'var(--text-3)' }}>
            Privacidade
          </Link>
          <Link href="/termos" className="underline" style={{ color: 'var(--text-3)' }}>
            Termos
          </Link>
        </div>
      </footer>

      {/* ─── CTA fixo (mobile) ─── */}
      {!isAuthenticated && (
        <div
          className="fixed bottom-0 inset-x-0 px-4 py-3 z-40"
          style={{
            background: 'var(--surface-2)',
            borderTop: '1px solid var(--border-1)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
          }}
        >
          <button
            type="button"
            onClick={scrollToForm}
            className="w-full max-w-md mx-auto px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            Criar conta e assinar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {!isAuthenticated && <div className="h-20" aria-hidden />}
    </main>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  hint,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  hint?: string
}) {
  return (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{
          background: 'var(--surface-inset)',
          border: '1px solid var(--border-1)',
          color: 'var(--text-1)',
          fontFamily: 'var(--font-body)',
        }}
      />
      {hint && (
        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  toggle: () => void
  placeholder: string
  autoComplete?: string
}) {
  return (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={8}
          required
          className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid var(--border-1)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5"
          style={{ color: 'var(--text-3)' }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function LegalBlock({
  acceptedLegal,
  setAcceptedLegal,
  ageConfirmed,
  setAgeConfirmed,
}: {
  acceptedLegal: boolean
  setAcceptedLegal: (v: boolean) => void
  ageConfirmed: boolean
  setAgeConfirmed: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      <label
        className="flex items-start gap-2 text-xs cursor-pointer"
        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
      >
        <input
          type="checkbox"
          checked={acceptedLegal}
          onChange={e => setAcceptedLegal(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Li e concordo com os{' '}
          <Link
            href="/termos"
            target="_blank"
            className="underline"
            style={{ color: 'var(--accent)' }}
          >
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link
            href="/privacidade"
            target="_blank"
            className="underline"
            style={{ color: 'var(--accent)' }}
          >
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      <label
        className="flex items-start gap-2 text-xs cursor-pointer"
        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
      >
        <input
          type="checkbox"
          checked={ageConfirmed}
          onChange={e => setAgeConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span>Declaro ter 14 anos completos ou mais.</span>
      </label>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
