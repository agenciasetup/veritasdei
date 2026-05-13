'use client'

/**
 * Client de /educa/assine.
 *
 * Não autenticado → "Entrar pra assinar" leva pro /login?next=/educa/assine.
 *   (Asaas precisa do user_id como externalReference; sem conta não dá pra
 *    associar a assinatura ao usuário.)
 * Autenticado → clique no CTA chama /api/payments/checkout com
 *   planCodigo=veritas-educa → redireciona pra /checkout/[sessionId].
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type Props = {
  prefillEmail: string | null
  prefillName: string | null
  isAuthenticated: boolean
}

const BENEFICIOS = [
  'Trilhas de estudo: Bíblia, Magistério e Patrística',
  'Pergunte ao Magistério (IA com fontes oficiais da Igreja)',
  'Quizzes com XP, conquistas e relíquias',
  'Sequência diária e progresso visível',
  'Acesso completo ao app Veritas Dei',
]

export default function AssineEducaClient({
  prefillEmail,
  prefillName,
  isAuthenticated,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAssinar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCodigo: 'veritas-educa',
          intervalo: 'mensal',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao iniciar checkout')
      if (!data.url) throw new Error('URL de checkout ausente')
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
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
            <BookOpen className="w-6 h-6" style={{ color: 'var(--accent)' }} />
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

          {isAuthenticated && prefillEmail && (
            <div
              className="mb-5 p-3 rounded-2xl text-xs flex items-start gap-2"
              style={{
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <ShieldCheck
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--accent)' }}
              />
              <span>
                Você está logado como{' '}
                <strong style={{ color: 'var(--text-1)' }}>
                  {prefillName ?? prefillEmail}
                </strong>
                . A assinatura será vinculada à sua conta automaticamente.
              </span>
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

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleAssinar}
              disabled={loading}
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
          ) : (
            <Link
              href="/login?next=/educa/assine"
              className="w-full px-5 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              <Sparkles className="w-4 h-4" />
              Entrar pra assinar
            </Link>
          )}

          <p
            className="text-[11px] text-center mt-3"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Pagamento processado com segurança. Cancele quando quiser.
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
