'use client'

import { AlertTriangle, Heading2, List, Minus, Plus, Quote, Sparkles, Text } from 'lucide-react'
import { useState } from 'react'

import type { Block } from '../types'
import { labelForBlockType } from './factory'

const OPTIONS: Array<{
  type: Block['type']
  Icon: typeof Plus
}> = [
  { type: 'heading', Icon: Heading2 },
  { type: 'paragraph', Icon: Text },
  { type: 'verse', Icon: Sparkles },
  { type: 'list', Icon: List },
  { type: 'quote', Icon: Quote },
  { type: 'callout', Icon: AlertTriangle },
  { type: 'divider', Icon: Minus },
]

/**
 * Botão "+" que expande um pop-over com os tipos de bloco.
 * Usado entre blocos (passa `index` = onde inserir) ou no fim
 * (sem index → adiciona ao fim).
 */
export default function BlockInserter({
  onInsert,
}: {
  onInsert: (type: Block['type']) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Adicionar bloco"
        className="inline-flex items-center justify-center rounded-full transition-all active:scale-90"
        style={{
          width: 28,
          height: 28,
          background: open
            ? 'linear-gradient(135deg, #D9C077, #A88B3A)'
            : 'rgba(20,18,14,0.7)',
          border: `1px solid ${open ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.2)'}`,
          color: open ? '#0F0E0C' : '#C9A84C',
        }}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="absolute z-20 top-full mt-2 rounded-xl p-1 flex flex-col gap-0.5"
          style={{
            background: '#141210',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            minWidth: 180,
          }}
        >
          {OPTIONS.map(({ type, Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onInsert(type)
                setOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors text-sm active:scale-[0.98]"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#F2EDE4',
                background: 'transparent',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(201,168,76,0.08)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <Icon className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
              {labelForBlockType(type)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
