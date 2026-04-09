'use client'

import { Fragment } from 'react'

interface RichTextProps {
  text: string
  accentColor?: string
  onCitationClick?: (reference: string, rect: DOMRect) => void
}

/**
 * Renders text with:
 * - \n\n → paragraph breaks
 * - **bold** → <strong>
 * - *italic* → <em>
 * - [CIC § xxx] → clickable citation badge
 * - [Other Ref] → gold citation badge
 * - Numbered lists (1. 2. 3.) → styled list
 */
export default function RichText({ text, accentColor = '#C9A84C', onCitationClick }: RichTextProps) {
  const paragraphs = text.split(/\\n\\n|\n\n/)

  return (
    <div className="space-y-5">
      {paragraphs.map((para, pi) => {
        const trimmed = para.trim()
        if (!trimmed) return null

        // Check if paragraph is a numbered list item (e.g., "1. **Bíblia** — ...")
        const isNumberedItem = /^\d+\.\s/.test(trimmed)

        return (
          <p
            key={pi}
            className={`leading-[2] ${isNumberedItem ? 'pl-2' : ''}`}
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
          >
            {renderInline(trimmed, accentColor, onCitationClick)}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(
  text: string,
  accentColor: string,
  onCitationClick?: (reference: string, rect: DOMRect) => void
): React.ReactNode[] {
  // Split by: **bold**, *italic*, [citations]
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/)

  return parts.map((part, i) => {
    // **bold**
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 600, color: '#F2EDE4' }}>
          {part.slice(2, -2)}
        </strong>
      )
    }

    // *italic*
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={i} style={{ fontStyle: 'italic', color: '#B8AFA2' }}>
          {part.slice(1, -1)}
        </em>
      )
    }

    // [Citation] — clickable if CIC
    if (part.startsWith('[') && part.endsWith(']')) {
      const ref = part.slice(1, -1)
      const isCIC = ref.toLowerCase().includes('cic')

      if (isCIC && onCitationClick) {
        return (
          <button
            key={i}
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect()
              onCitationClick(ref, rect)
            }}
            className="inline text-sm font-medium px-1.5 py-0.5 rounded mx-0.5 transition-all duration-200 cursor-pointer"
            style={{
              color: accentColor,
              background: `${accentColor}12`,
              border: `1px solid ${accentColor}25`,
              fontFamily: 'Cinzel, serif',
              fontSize: '0.72em',
            }}
            title={`Clique para ver ${ref}`}
          >
            {ref}
          </button>
        )
      }

      return (
        <span
          key={i}
          className="text-sm font-medium px-1 py-0.5 rounded mx-0.5"
          style={{
            color: accentColor,
            background: `${accentColor}08`,
            fontFamily: 'Cinzel, serif',
            fontSize: '0.72em',
          }}
        >
          {part}
        </span>
      )
    }

    return <Fragment key={i}>{part}</Fragment>
  })
}
