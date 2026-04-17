'use client'

import type { RefObject } from 'react'
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'

type Wrap = '**' | '*' | '__' | '~~'

interface Action {
  key: 'bold' | 'italic' | 'underline' | 'strike'
  wrap: Wrap
  icon: typeof Bold
  label: string
  placeholder: string
}

const ACTIONS: Action[] = [
  { key: 'bold',      wrap: '**', icon: Bold,           label: 'Negrito',    placeholder: 'texto' },
  { key: 'italic',    wrap: '*',  icon: Italic,         label: 'Itálico',    placeholder: 'texto' },
  { key: 'underline', wrap: '__', icon: Underline,      label: 'Sublinhado', placeholder: 'texto' },
  { key: 'strike',    wrap: '~~', icon: Strikethrough,  label: 'Tachado',    placeholder: 'texto' },
]

interface Props {
  inputRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
  /** Limite opcional — se fornecido, ignora inserção que extrapolaria. */
  maxLength?: number
  /** Classe extra para customizar spacing do container. */
  className?: string
}

/**
 * Barra fina com 4 atalhos de formatação (B/I/U/S). Insere a sintaxe
 * markdown ao redor da seleção atual do textarea; se não há seleção,
 * insere um placeholder e deixa o caret dentro.
 *
 * Mantém o foco no textarea após inserir (sem roubar atenção). Também
 * aceita Cmd/Ctrl+B/I/U via keydown no textarea — mas essa integração
 * fica por conta do componente pai para não duplicar listeners.
 */
export default function FormattingToolbar({
  inputRef,
  value,
  onChange,
  maxLength,
  className = '',
}: Props) {
  function applyWrap(wrap: Wrap, placeholder: string) {
    const el = inputRef.current
    if (!el) return

    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const selected = value.slice(start, end) || placeholder

    const before = value.slice(0, start)
    const after = value.slice(end)
    const next = `${before}${wrap}${selected}${wrap}${after}`

    if (maxLength && next.length > maxLength) return

    onChange(next)

    // Restaura foco e posiciona seleção na parte de dentro dos wraps.
    requestAnimationFrame(() => {
      el.focus()
      const innerStart = start + wrap.length
      const innerEnd = innerStart + selected.length
      el.setSelectionRange(innerStart, innerEnd)
    })
  }

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="toolbar"
      aria-label="Formatação"
    >
      {ACTIONS.map(action => {
        const Icon = action.icon
        return (
          <button
            key={action.key}
            type="button"
            onMouseDown={(e) => {
              // Preserva seleção do textarea — onClick rouba o foco.
              e.preventDefault()
              applyWrap(action.wrap, action.placeholder)
            }}
            aria-label={action.label}
            title={action.label}
            className="inline-flex items-center justify-center rounded-md transition-colors"
            style={{
              width: 32,
              height: 32,
              color: '#8A8378',
              background: 'transparent',
            }}
          >
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
