'use client'

import { Languages } from 'lucide-react'
import { useLatin } from './LatinContext'

/**
 * Botão pill que alterna PT ↔ LA no leitor de oração.
 * Não renderiza se a oração não tem versão latina (`hasLatin=false`).
 *
 * Uso dentro do header sticky da página individual. O estado real
 * mora em LatinContext — este componente só reflete e dispara toggle.
 */
export default function LatinToggle({ hasLatin }: { hasLatin: boolean }) {
  const { latin, toggle } = useLatin()
  if (!hasLatin) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={latin}
      aria-label={latin ? 'Desativar latim' : 'Ativar latim'}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors active:scale-95"
      style={{
        fontFamily: 'Poppins, sans-serif',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 500,
        background: latin ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${latin ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.15)'}`,
        color: latin ? 'var(--gold)' : 'var(--text-secondary)',
      }}
    >
      <Languages className="w-3.5 h-3.5" />
      <span>{latin ? 'Latim' : 'PT'}</span>
    </button>
  )
}
