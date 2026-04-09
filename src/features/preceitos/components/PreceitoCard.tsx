'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { Preceito } from '../data'

export default function PreceitoCard({ preceito }: { preceito: Preceito }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = `${preceito.id}º Preceito — ${preceito.title}\n\n${preceito.explanation}\n\n(${preceito.catechismRef})\n\n${preceito.verses.map(v => `${v.reference}: ${v.text}`).join('\n')}`
    try { await navigator.clipboard.writeText(text) } catch { /* fallback */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="verse-block fade-in relative">
      <button
        onClick={handleCopy}
        className={`copy-btn ${copied ? 'copied' : ''}`}
        title={copied ? 'Copiado!' : 'Copiar'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      {/* Number + Title */}
      <div className="verse-reference" style={{ color: '#C9A84C' }}>
        <span>{preceito.id}º Preceito</span>
      </div>
      <h3
        className="text-lg font-semibold mt-2 mb-1"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {preceito.title}
      </h3>

      <span
        className="text-xs tracking-wider"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        {preceito.catechismRef}
      </span>

      {/* Explanation */}
      <p className="verse-text mt-3" style={{ fontStyle: 'normal' }}>
        {preceito.explanation}
      </p>

      {/* Ornament */}
      <div className="ornament-divider mt-4 mb-3">
        <span style={{ fontSize: '0.7rem' }}>&#10022;</span>
      </div>

      {/* Bible verses */}
      <div className="space-y-3">
        {preceito.verses.map((v) => (
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
