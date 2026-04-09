'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { Dogma } from '../data'

export default function DogmaCard({ dogma }: { dogma: Dogma }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const verseTexts = dogma.verses.map(v => `${v.reference}: ${v.text}`).join('\n')
    const text = `Dogma ${dogma.id} — ${dogma.title}\n\n${dogma.explanation}\n\n${verseTexts}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="verse-block fade-in relative">
      {/* Copy */}
      <button
        onClick={handleCopy}
        className={`copy-btn ${copied ? 'copied' : ''}`}
        title={copied ? 'Copiado!' : 'Copiar'}
        aria-label={copied ? 'Copiado' : 'Copiar dogma'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      {/* Number + Title */}
      <div className="verse-reference" style={{ color: '#C9A84C' }}>
        <span>Dogma {dogma.id} — {dogma.title}</span>
      </div>

      {/* Explanation */}
      <p className="verse-text" style={{ fontStyle: 'normal' }}>
        {dogma.explanation}
      </p>

      {/* Bible verses */}
      {dogma.verses.length > 0 && (
        <div className="mt-5 space-y-3">
          {dogma.verses.map((v) => (
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
      )}
    </article>
  )
}
