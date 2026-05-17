'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Check, MessageCircle, Trash2 } from 'lucide-react'
import type { SelectionInfo } from './HighlightableText'
import type {
  HighlightColor,
  LessonHighlight,
} from '@/lib/study/useLessonHighlights'

interface Props {
  selection: SelectionInfo | null
  /** Highlight existente sob o cursor — quando definido, mostra "trash"
   *  em vez do picker de cor pra criar. */
  existingHighlight?: LessonHighlight | null
  onPickColor: (color: HighlightColor, selection: SelectionInfo) => void
  onRemove?: (highlight: LessonHighlight) => void
  onComment?: (selection: SelectionInfo) => void
  onDismiss: () => void
}

const COLOR_OPTIONS: Array<{ value: HighlightColor; label: string; bg: string }> = [
  { value: 'gold', label: 'Dourado', bg: '#C9A84C' },
  { value: 'wine', label: 'Vinho', bg: '#8B3145' },
  { value: 'sage', label: 'Verde', bg: '#8BB58B' },
  { value: 'sky', label: 'Céu', bg: '#8FB4D9' },
  { value: 'plain', label: 'Sutil', bg: '#938B80' },
]

/**
 * Mini-toolbar que aparece logo acima da seleção do usuário. Mostra:
 *  - 5 cores pra marcar
 *  - botão "Anotar" (cria highlight + abre painel de notas atrelado)
 *  - botão "Copiar" (copia o texto selecionado)
 *
 * Em mobile, ajusta posição pra dentro do viewport.
 * Some quando o usuário clica fora ou desfaz a seleção.
 */
export default function SelectionPopover({
  selection,
  existingHighlight,
  onPickColor,
  onRemove,
  onComment,
  onDismiss,
}: Props) {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  // Dismiss on outside click / scroll / resize.
  useEffect(() => {
    if (!selection) return
    function onScroll() {
      onDismiss()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [selection, onDismiss])

  if (!selection || !mounted) return null

  const rect = selection.rect
  const POPOVER_WIDTH = existingHighlight ? 220 : 280
  const POPOVER_HEIGHT = 44
  const GAP = 8

  // Posiciona acima da seleção quando há espaço; caso contrário, abaixo.
  const aboveTop = rect.top - POPOVER_HEIGHT - GAP
  const placeAbove = aboveTop > 8
  const top = placeAbove ? aboveTop : rect.bottom + GAP

  // Centraliza horizontalmente na seleção, mas mantém dentro do viewport.
  const idealLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2
  const left = Math.max(
    8,
    Math.min(idealLeft, window.innerWidth - POPOVER_WIDTH - 8),
  )

  async function handleCopy() {
    if (!selection) return
    try {
      await navigator.clipboard.writeText(selection.text)
      setCopied(true)
    } catch {
      /* ok */
    }
  }

  const popover = (
    <div
      role="toolbar"
      aria-label="Ações do texto selecionado"
      className="fixed z-[300] flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${POPOVER_WIDTH}px`,
        background: 'rgba(20,18,16,0.98)',
        border: '1px solid rgba(201,168,76,0.28)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)',
      }}
      onMouseDown={(e) => e.preventDefault() /* preserve selection */}
    >
      {existingHighlight ? (
        <>
          <span
            className="flex-1 text-[11px] tracking-wider uppercase px-2"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Marcador
          </span>
          {onComment ? (
            <ActionButton
              label="Anotar"
              onClick={() => onComment(selection)}
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </ActionButton>
          ) : null}
          {onRemove ? (
            <ActionButton
              label="Remover marcador"
              onClick={() => onRemove(existingHighlight)}
              danger
            >
              <Trash2 className="w-3.5 h-3.5" />
            </ActionButton>
          ) : null}
        </>
      ) : (
        <>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={`Marcar com ${c.label.toLowerCase()}`}
              title={c.label}
              onClick={() => onPickColor(c.value, selection)}
              className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: c.bg,
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
          ))}
          <span
            aria-hidden
            className="w-px h-6"
            style={{ background: 'rgba(201,168,76,0.18)' }}
          />
          <ActionButton label="Copiar" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </ActionButton>
        </>
      )}
    </div>
  )

  return createPortal(popover, document.body)
}

function ActionButton({
  label,
  onClick,
  children,
  danger,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center active:scale-90 transition-transform"
      style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.18)',
        color: danger ? '#E89B9B' : 'var(--accent)',
      }}
    >
      {children}
    </button>
  )
}
