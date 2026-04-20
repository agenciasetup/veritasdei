'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  X, Check, Clock, Cross, HandHeart, Church, Wheat,
  BookOpen, Sparkles, Star,
} from 'lucide-react'
import { usePropositos } from '@/contexts/PropositosContext'
import { cadenciaLabel } from '@/lib/propositos'
import { useHaptic } from '@/hooks/useHaptic'
import type { PropositoComProgresso } from '@/types/propositos'
import type { RespostaPrompt } from '@/lib/propositos-prompt'

/**
 * Modal de check-in inteligente — aparece na primeira abertura do app
 * dentro de um período (dia/semana/mês) para cada propósito ativo,
 * perguntando se a pessoa já cumpriu.
 *
 * Comportamento:
 *  - Lista vertical de propósitos pendentes.
 *  - Cada item tem 3 ações: "Fiz", "Ainda não", "Lembrar depois".
 *  - O modal só some quando a pessoa responde a TODOS (ou clica em fechar).
 *  - Suporta swipe-down e ESC.
 */

const ICONES: Record<string, ReactNode> = {
  rosario: <Cross className="w-5 h-5" strokeWidth={1.6} />,
  confissao: <HandHeart className="w-5 h-5" strokeWidth={1.6} />,
  missa: <Church className="w-5 h-5" strokeWidth={1.6} />,
  jejum: <Wheat className="w-5 h-5" strokeWidth={1.6} />,
  leitura: <BookOpen className="w-5 h-5" strokeWidth={1.6} />,
  adoracao: <Sparkles className="w-5 h-5" strokeWidth={1.6} />,
  custom: <Star className="w-5 h-5" strokeWidth={1.6} />,
}

interface Props {
  pendentes: PropositoComProgresso[]
  onResponder: (propositoId: string, resposta: RespostaPrompt) => void
  onClose: () => void
}

export default function PropositoCheckInModal({ pendentes, onResponder, onClose }: Props) {
  const { checkIn } = usePropositos()
  const haptic = useHaptic()
  const [respondidos, setRespondidos] = useState<Set<string>>(new Set())

  // ESC fecha
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Quando todos foram respondidos, fecha sozinho
  useEffect(() => {
    if (pendentes.length > 0 && respondidos.size === pendentes.length) {
      const t = setTimeout(onClose, 350)
      return () => clearTimeout(t)
    }
  }, [respondidos, pendentes.length, onClose])

  if (pendentes.length === 0) return null

  function responder(p: PropositoComProgresso, resposta: RespostaPrompt) {
    haptic.pulse(resposta === 'fiz' ? 'complete' : 'tap')
    if (resposta === 'fiz') {
      void checkIn(p.id)
    }
    onResponder(p.id, resposta)
    setRespondidos(prev => {
      const next = new Set(prev)
      next.add(p.id)
      return next
    })
  }

  const pluralPropositos = pendentes.length === 1 ? 'propósito' : 'propósitos'

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.65)' }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal
        aria-labelledby="checkin-modal-title"
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
          />
        </div>

        {/* Header */}
        <header className="flex items-start justify-between px-5 pt-3 pb-4 gap-3">
          <div className="flex-1 min-w-0">
            <h2
              id="checkin-modal-title"
              className="text-2xl leading-tight"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-elegant)',
                letterSpacing: '0.005em',
              }}
            >
              Como foi sua devoção?
            </h2>
            <p
              className="text-[12.5px] mt-1"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {pendentes.length} {pluralPropositos} esperando confirmação
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{
              background: 'var(--surface-3)',
              color: 'var(--text-3)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Lista */}
        <div className="px-5 pb-6 space-y-3">
          {pendentes.map((p) => {
            const respondido = respondidos.has(p.id)
            return (
              <div
                key={p.id}
                className="rounded-2xl p-4 transition-all duration-300"
                style={{
                  background: respondido
                    ? 'color-mix(in srgb, var(--success) 10%, var(--surface-2))'
                    : 'var(--surface-2)',
                  border: `1px solid ${
                    respondido
                      ? 'color-mix(in srgb, var(--success) 30%, transparent)'
                      : 'var(--border-1)'
                  }`,
                  opacity: respondido ? 0.7 : 1,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    {ICONES[p.tipo] ?? ICONES.custom}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-[15px] leading-tight"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                      }}
                    >
                      {p.titulo}
                    </h3>
                    <p
                      className="text-[12px] mt-0.5"
                      style={{
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {cadenciaLabel(p.cadencia, p.meta_por_periodo)}
                    </p>
                  </div>
                </div>

                {respondido ? (
                  <div
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px]"
                    style={{
                      background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                      color: 'var(--success)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                    }}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.4} />
                    Registrado
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => responder(p, 'fiz')}
                      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[12px] active:scale-95 transition-transform touch-target"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                      }}
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      Fiz
                    </button>
                    <button
                      type="button"
                      onClick={() => responder(p, 'ainda_nao')}
                      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[12px] active:scale-95 transition-transform touch-target"
                      style={{
                        background: 'var(--surface-3)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border-1)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                      }}
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                      Ainda não
                    </button>
                    <button
                      type="button"
                      onClick={() => responder(p, 'lembrar')}
                      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[12px] active:scale-95 transition-transform touch-target"
                      style={{
                        background: 'var(--surface-3)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border-1)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                      }}
                    >
                      <Clock className="w-4 h-4" strokeWidth={2} />
                      Depois
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer dismiss */}
        <div
          className="px-5 pb-6 pt-1 text-center"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] underline-offset-4 hover:underline"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Responder mais tarde
          </button>
        </div>
      </div>
    </div>
  )
}
