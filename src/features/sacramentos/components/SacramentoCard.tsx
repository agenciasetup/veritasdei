'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { Sacramento } from '../data'

export default function SacramentoCard({ sacramento }: { sacramento: Sacramento }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleCopy() {
    const text = `${sacramento.name} (${sacramento.latinName})\n\n${sacramento.explanation}\n\nMatéria: ${sacramento.matter}\nForma: ${sacramento.form}\nMinistro: ${sacramento.minister}\n\nEfeitos:\n${sacramento.effects.map(e => `• ${e}`).join('\n')}\n\n${sacramento.verses.map(v => `${v.reference}: ${v.text}`).join('\n')}`
    try { await navigator.clipboard.writeText(text) } catch { /* fallback */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="glass-card p-6 md:p-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="verse-reference" style={{ color: '#C9A84C' }}>
            <span>{sacramento.id}. {sacramento.name}</span>
          </div>
          <p
            className="text-xs mt-1 italic"
            style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}
          >
            {sacramento.latinName}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className={`copy-btn !relative !top-0 !right-0 ${copied ? 'copied' : ''}`}
          title={copied ? 'Copiado!' : 'Copiar'}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Explanation */}
      <p className="verse-text mt-4" style={{ fontStyle: 'normal' }}>
        {sacramento.explanation}
      </p>

      {/* Expand/Collapse details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="theme-chip mt-5 flex items-center gap-2 !text-xs"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Ocultar detalhes' : 'Ver matéria, forma, ministro e efeitos'}
      </button>

      {expanded && (
        <div className="mt-5 space-y-4 fade-in">
          {/* Matter, Form, Minister */}
          {[
            { label: 'Matéria', value: sacramento.matter },
            { label: 'Forma', value: sacramento.form },
            { label: 'Ministro', value: sacramento.minister },
          ].map((item) => (
            <div key={item.label}>
              <span
                className="text-xs font-semibold tracking-wider uppercase block mb-1"
                style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
              >
                {item.label}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                {item.value}
              </p>
            </div>
          ))}

          {/* Effects */}
          <div>
            <span
              className="text-xs font-semibold tracking-wider uppercase block mb-2"
              style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
            >
              Efeitos
            </span>
            <ul className="space-y-1.5">
              {sacramento.effects.map((e, i) => (
                <li
                  key={i}
                  className="text-sm leading-relaxed flex items-start gap-2"
                  style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
                >
                  <span style={{ color: '#C9A84C' }}>&#8226;</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ornament */}
      <div className="ornament-divider mt-5">
        <span>&#10022;</span>
      </div>

      {/* Bible verses */}
      <div className="space-y-3">
        {sacramento.verses.map((v) => (
          <div
            key={v.reference}
            className="pl-4"
            style={{ borderLeft: '2px solid rgba(107,29,42,0.4)' }}
          >
            <span
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: '#8B3145', fontFamily: 'Cinzel, serif' }}
            >
              {v.reference}
            </span>
            <p
              className="mt-1 text-sm leading-relaxed italic"
              style={{ color: '#B8AFA2', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem' }}
            >
              &ldquo;{v.text}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
