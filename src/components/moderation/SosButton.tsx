'use client'

import { useState } from 'react'
import { AlertOctagon, Loader2, CheckCircle2 } from 'lucide-react'

type Category = 'menor_em_risco' | 'nudez_nao_consensual' | 'violencia_grave' | 'ameaca_vida' | 'outro'

type Props = {
  targetUserId?: string
  targetPostId?: string
  compact?: boolean
  /** Quando true, abre o modal direto no mount e oculta o trigger interno. Útil para acionar via menu externo. */
  defaultOpen?: boolean
  /** Disparado quando o modal fecha (cancelar, sucesso ou clique fora). */
  onClose?: () => void
}

const CATEGORY_LABELS: Record<Category, string> = {
  menor_em_risco: 'Envolve menor de idade',
  nudez_nao_consensual: 'Nudez não consensual',
  violencia_grave: 'Violência grave / ameaça',
  ameaca_vida: 'Ameaça à vida',
  outro: 'Outro (urgente)',
}

export function SosButton({ targetUserId, targetPostId, compact = false, defaultOpen = false, onClose }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [category, setCategory] = useState<Category | ''>('')
  const [details, setDetails] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  function close() {
    setOpen(false)
    onClose?.()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) {
      setState('error')
      setMessage('Selecione a categoria.')
      return
    }
    setState('submitting')
    setMessage(null)
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: targetUserId,
          target_post_id: targetPostId,
          category,
          details: details.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState('error')
        setMessage(body?.detail ?? body?.error ?? 'Não foi possível enviar. Tente novamente.')
        return
      }
      setState('ok')
    } catch {
      setState('error')
      setMessage('Falha de rede. Tente novamente.')
    }
  }

  if (!open) {
    if (defaultOpen) return null
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg transition-all ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-xs'}`}
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444',
          fontFamily: 'Poppins, sans-serif',
        }}
        aria-label="Acionar SOS — denúncia urgente"
      >
        <AlertOctagon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        SOS
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-end justify-center md:items-center px-4 py-6"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={() => close()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-5"
        style={{
          background: '#0F0F0F',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertOctagon className="w-5 h-5" style={{ color: '#ef4444' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
            SOS — denúncia urgente (SLA 24h)
          </h3>
        </div>

        {state === 'ok' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: '#10b981' }} />
              <p className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                Denúncia registrada. Nossa equipe responderá em até 24 horas. Em caso de risco
                imediato, acione as autoridades diretamente.
              </p>
            </div>
            <ul className="space-y-1 text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              <li>
                SaferNet:{' '}
                <a href="https://new.safernet.org.br/denuncie" target="_blank" rel="noreferrer" style={{ color: '#C9A84C' }}>
                  safernet.org.br/denuncie
                </a>
              </li>
              <li>
                Disque 100 (Direitos Humanos):{' '}
                <a href="https://www.gov.br/mdh/pt-br/disque100" target="_blank" rel="noreferrer" style={{ color: '#C9A84C' }}>
                  gov.br/disque100
                </a>
              </li>
              <li>Polícia: 190 · Polícia Federal: 194</li>
            </ul>
            <button
              onClick={() => close()}
              className="px-4 py-2 rounded-xl text-sm w-full"
              style={{ background: '#C9A84C', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              Use o SOS somente para situações graves. Casos comuns (spam, ofensa leve) devem ir
              pelo botão de denúncia regular.
            </p>

            <label className="block text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
              Categoria
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category | '')}
                required
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              >
                <option value="">Selecione…</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
              Detalhes (opcional)
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="O que aconteceu? Inclua o máximo de contexto."
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </label>

            {message && state === 'error' && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                {message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={state === 'submitting'}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                style={{
                  background: '#ef4444',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  border: '1px solid rgba(239,68,68,0.5)',
                }}
              >
                {state === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
                Enviar SOS
              </button>
              <button
                type="button"
                onClick={() => close()}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'transparent', color: '#7A7368', fontFamily: 'Poppins, sans-serif', border: '1px solid rgba(201,168,76,0.15)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
