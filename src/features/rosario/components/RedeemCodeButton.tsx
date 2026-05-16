'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, X, Check, AlertCircle, Loader2 } from 'lucide-react'

/**
 * Botão "Resgatar código" + modal pra digitar.
 *
 * Quando o usuário compra o terço físico, recebe um código (ex.: "BENEDITO2026A4")
 * impresso no certificado/embalagem. Esse modal aciona POST /api/rosario/skins/redimir,
 * que delega pra fn_redimir_rosary_code no banco.
 */
export function RedeemCodeButton({ authenticated }: { authenticated: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ nome: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authenticated) {
      router.push('/login?redirectTo=/rosario/loja')
      return
    }
    const c = codigo.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,16}$/.test(c)) {
      setError('Código inválido. Deve ter entre 6 e 16 caracteres (letras e números).')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/rosario/skins/redimir', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ codigo: c }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const map: Record<string, string> = {
          code_not_found: 'Código não encontrado.',
          code_already_used: 'Este código já foi resgatado.',
          unauthenticated: 'Faça login pra resgatar.',
          invalid_code_format: 'Formato inválido.',
        }
        setError(map[data.error as string] ?? data.error ?? 'Erro ao resgatar.')
        return
      }
      setSuccess({ nome: data.skin?.nome ?? 'Terço' })
      setCodigo('')
      // Refresh server data (catalog status) after a moment
      setTimeout(() => {
        router.refresh()
        setOpen(false)
        setSuccess(null)
      }, 2200)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition active:scale-[0.97]"
        style={{
          borderColor: 'var(--accent-soft)',
          color: 'var(--accent)',
          fontFamily: 'var(--font-display)',
        }}
      >
        <KeyRound className="h-3.5 w-3.5" />
        Resgatar código
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Resgatar código"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setOpen(false)
              setError(null)
            }
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border p-6"
            style={{
              borderColor: 'var(--accent-soft)',
              background: 'var(--surface-2)',
            }}
          >
            <button
              type="button"
              onClick={() => !submitting && setOpen(false)}
              className="absolute right-4 top-4 transition"
              style={{ color: 'var(--text-3)' }}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            {success ? (
              <div className="py-4 text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <Check className="h-6 w-6" strokeWidth={2.4} />
                </div>
                <p
                  className="mb-1 text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
                >
                  Resgatado
                </p>
                <h2
                  className="text-xl"
                  style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
                >
                  {success.nome}
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
                  Adicionado à sua coleção.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p
                  className="mb-3 text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
                >
                  Código do terço físico
                </p>
                <h2
                  className="mb-1 text-2xl"
                  style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
                >
                  Resgatar
                </h2>
                <p className="mb-5 text-sm" style={{ color: 'var(--text-3)' }}>
                  Digite o código impresso no certificado do seu terço.
                </p>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 16),
                    )
                  }
                  placeholder="EX.: BENEDITO2026A4"
                  className="w-full rounded-xl px-4 py-3 text-center font-mono text-base uppercase tracking-[0.18em] outline-none transition"
                  style={{
                    background: 'rgba(20, 18, 14, 0.6)',
                    border: '1px solid rgba(201, 168, 76, 0.22)',
                    color: 'var(--text-1)',
                  }}
                  aria-label="Código"
                  autoFocus
                  disabled={submitting}
                />
                {error && (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
                    role="alert"
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--danger) 45%, transparent)',
                      color: 'var(--text-1)',
                      backgroundColor: 'rgba(70, 20, 20, 0.35)',
                    }}
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || codigo.length < 6}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                    color: 'var(--accent-contrast)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Resgatando…' : 'Resgatar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
