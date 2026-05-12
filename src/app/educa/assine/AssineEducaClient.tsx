'use client'

/**
 * Client de /educa/assine — captura email, valida, monta a URL final
 * com `?email=` e `?name=` e redireciona pro checkout Hubla.
 *
 * Regras de UX:
 *  - Se o usuário está logado, pré-preenchemos com o email da conta e
 *    avisamos: "Use este mesmo email — é assim que liberamos seu acesso."
 *  - Se não estiver logado, oferecemos um link pra criar conta antes.
 *    Permitimos pagar assim mesmo (o webhook ainda tenta resolver depois),
 *    mas com aviso de que é melhor criar conta primeiro.
 *  - O botão fica desabilitado se a URL base do checkout não estiver
 *    configurada (admin não terminou o setup).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Check, Loader2, ShieldCheck, Sparkles } from 'lucide-react'

type Props = {
  prefillEmail: string | null
  prefillName: string | null
  isAuthenticated: boolean
  checkoutBaseUrl: string | null
}

const BENEFICIOS = [
  'Trilhas de estudo: Bíblia, Magistério e Patrística',
  'Pergunte ao Magistério (IA com fontes oficiais da Igreja)',
  'Quizzes com XP, conquistas e relíquias',
  'Sequência diária e progresso visível',
  'Acesso completo ao app Veritas Dei',
]

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

export default function AssineEducaClient({
  prefillEmail,
  prefillName,
  isAuthenticated,
  checkoutBaseUrl,
}: Props) {
  const [email, setEmail] = useState(prefillEmail ?? '')
  const [name, setName] = useState(prefillName ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailLocked = isAuthenticated && !!prefillEmail
  const canSubmit = useMemo(
    () => !!checkoutBaseUrl && isValidEmail(email),
    [checkoutBaseUrl, email],
  )

  function handleContinue() {
    if (!checkoutBaseUrl) {
      setError(
        'Checkout ainda não configurado. Avise o admin: defina NEXT_PUBLIC_HUBLA_CHECKOUT_URL_VERITAS_EDUCA.',
      )
      return
    }
    if (!isValidEmail(email)) {
      setError('Informe um email válido.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = new URL(checkoutBaseUrl)
      url.searchParams.set('email', email.trim())
      if (name.trim()) url.searchParams.set('name', name.trim())
      window.location.href = url.toString()
    } catch {
      setError('URL de checkout inválida.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <BookOpen
              className="w-6 h-6"
              style={{ color: 'var(--accent)' }}
            />
          </div>
          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            Assine o Veritas Educa
          </h1>
          <p
            className="text-sm max-w-md mx-auto"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Aprofunde sua fé católica com trilhas guiadas, quizzes e IA católica
            — tudo no seu ritmo.
          </p>
        </header>

        <section
          className="p-6 md:p-7 rounded-3xl mb-6"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <ul className="flex flex-col gap-3 mb-7">
            {BENEFICIOS.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{
                  color: 'var(--text-1)',
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

          {!isAuthenticated && (
            <div
              className="mb-5 p-3 rounded-2xl text-xs"
              style={{
                background:
                  'color-mix(in srgb, var(--accent) 10%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Já tem conta?{' '}
              <Link
                href="/login?next=/educa/assine"
                className="underline"
                style={{ color: 'var(--accent)' }}
              >
                Entre antes de assinar
              </Link>{' '}
              — assim seu acesso é liberado automaticamente após o pagamento.
            </div>
          )}

          <div className="flex flex-col gap-3 mb-4">
            <label
              className="text-xs"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Seu email
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={emailLocked}
              placeholder="voce@exemplo.com"
              className="px-4 py-3 rounded-2xl outline-none disabled:opacity-70"
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-1)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            />
            <p
              className="text-[11px] flex items-center gap-1"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <ShieldCheck className="w-3 h-3" />
              Use o mesmo email da sua conta Veritas — é por ele que liberamos
              seu acesso após o pagamento.
            </p>
          </div>

          {!emailLocked && (
            <div className="flex flex-col gap-3 mb-5">
              <label
                className="text-xs"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Seu nome (opcional)
              </label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como devemos te chamar?"
                className="px-4 py-3 rounded-2xl outline-none"
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          )}

          {error && (
            <div
              className="mb-4 p-3 rounded-2xl text-sm"
              style={{
                background:
                  'color-mix(in srgb, var(--warning) 12%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
                color: 'var(--warning)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canSubmit || loading}
            className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
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
                <Sparkles className="w-4 h-4" />
                Continuar pra assinatura
              </>
            )}
          </button>

          <p
            className="text-[11px] text-center mt-3"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Pagamento processado pela Hubla. Cancele quando quiser.
          </p>
        </section>

        <p
          className="text-xs text-center"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Já assinou?{' '}
          <Link
            href="/educa"
            className="underline"
            style={{ color: 'var(--accent)' }}
          >
            Ir pra plataforma
          </Link>
        </p>
      </div>
    </main>
  )
}
