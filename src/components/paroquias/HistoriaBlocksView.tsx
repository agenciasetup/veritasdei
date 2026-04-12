'use client'

import { Quote } from 'lucide-react'
import type { HistoriaBlock } from '@/types/paroquia'

interface Props {
  blocks: HistoriaBlock[]
}

const DEFAULT_COLOR = '#C9A84C'

export default function HistoriaBlocksView({ blocks }: Props) {
  if (!blocks || blocks.length === 0) {
    return (
      <p
        className="text-sm italic text-center py-8"
        style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}
      >
        Esta igreja ainda não contou sua história.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {blocks.map(block => {
        const color = block.color || DEFAULT_COLOR
        switch (block.type) {
          case 'titulo':
            return (
              <h2
                key={block.id}
                className="text-2xl md:text-3xl font-bold tracking-wide mt-6"
                style={{
                  fontFamily: 'Cinzel, serif',
                  color,
                }}
              >
                {block.text}
              </h2>
            )
          case 'subtitulo':
            return (
              <h3
                key={block.id}
                className="text-lg md:text-xl font-semibold tracking-wide mt-4"
                style={{
                  fontFamily: 'Cinzel, serif',
                  color,
                }}
              >
                {block.text}
              </h3>
            )
          case 'paragrafo':
            return (
              <p
                key={block.id}
                className="text-base whitespace-pre-wrap"
                style={{
                  color: block.color || '#C9BFA8',
                  fontFamily: 'Cormorant Garamond, serif',
                  lineHeight: 1.75,
                  fontSize: '1.05rem',
                }}
              >
                {block.text}
              </p>
            )
          case 'citacao':
            return (
              <blockquote
                key={block.id}
                className="relative pl-8 pr-4 py-4 my-4 italic"
                style={{
                  borderLeft: `3px solid ${color}`,
                  background: 'rgba(201,168,76,0.04)',
                  borderRadius: '0 0.75rem 0.75rem 0',
                }}
              >
                <Quote
                  className="absolute left-2 top-3 w-4 h-4"
                  style={{ color, opacity: 0.6 }}
                />
                <p
                  className="text-base md:text-lg"
                  style={{
                    color: '#F2EDE4',
                    fontFamily: 'Cormorant Garamond, serif',
                    lineHeight: 1.6,
                  }}
                >
                  {block.text}
                </p>
                {block.author && (
                  <cite
                    className="block mt-2 text-xs not-italic tracking-wider uppercase"
                    style={{
                      color,
                      fontFamily: 'Cinzel, serif',
                    }}
                  >
                    — {block.author}
                  </cite>
                )}
              </blockquote>
            )
          case 'imagem':
            if (!block.url) return null
            return (
              <figure key={block.id} className="my-6">
                <div
                  className="w-full rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.12)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.url}
                    alt={block.caption ?? ''}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption
                    className="text-xs text-center mt-2 italic"
                    style={{
                      color: '#7A7368',
                      fontFamily: 'Cormorant Garamond, serif',
                    }}
                  >
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            )
          case 'divisor':
            return (
              <div key={block.id} className="flex items-center justify-center gap-4 my-6">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.3)]" />
                <span style={{ color, opacity: 0.6, fontSize: '0.85rem' }}>&#10022;</span>
                <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.3)]" />
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
