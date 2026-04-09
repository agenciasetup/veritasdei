'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { Pillar, SearchResult } from '@/types'

const PILLAR_CONFIG: Record<Pillar, { icon: string; title: string; subtitle: string; accentColor: string }> = {
  biblia: {
    icon: '✝',
    title: 'Bíblia Sagrada',
    subtitle: 'Escritura Sagrada',
    accentColor: '#C9A84C',
  },
  magisterio: {
    icon: '⛪',
    title: 'Catecismo e Magistério',
    subtitle: 'Ensinamento da Igreja',
    accentColor: '#8B3145',
  },
  patristica: {
    icon: '🏛️',
    title: 'Patrística',
    subtitle: 'Padres e Doutores',
    accentColor: '#7A7368',
  },
}

interface PillarCardProps {
  pillar: Pillar
  results: SearchResult[]
  isLoading: boolean
}

function SkeletonBlock() {
  return (
    <div className="space-y-3 p-5">
      <div className="skeleton h-4 w-2/5" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
      <div className="skeleton h-3 w-3/5" />
    </div>
  )
}

function VerseBlock({ result, accentColor }: { result: SearchResult; accentColor: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const textToCopy = `${result.reference}\n\n${result.text}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="verse-block fade-in" style={{ borderLeftColor: accentColor }}>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`copy-btn ${copied ? 'copied' : ''}`}
        title={copied ? 'Copiado!' : 'Copiar versículo'}
        aria-label={copied ? 'Copiado' : 'Copiar versículo'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      {/* Context note — why this source matters */}
      {result.context && (
        <p
          className="text-xs mb-3 leading-relaxed"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontStyle: 'italic' }}
        >
          {result.context}
        </p>
      )}

      {/* Reference */}
      <div className="verse-reference" style={{ color: accentColor }}>
        <span>{result.reference}</span>
      </div>

      {/* Verse text */}
      <p className="verse-text">
        &ldquo;{result.text}&rdquo;
      </p>
    </div>
  )
}

export default function PillarCard({ pillar, results, isLoading }: PillarCardProps) {
  const config = PILLAR_CONFIG[pillar]

  return (
    <div className="glass-card p-6 md:p-8 fade-in">
      {/* Pillar Header */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-2xl flex items-center justify-center w-12 h-12 rounded-xl"
          style={{
            background: `rgba(201, 168, 76, 0.08)`,
            border: `1px solid rgba(201, 168, 76, 0.12)`,
          }}
          role="img"
          aria-label={config.title}
        >
          {config.icon}
        </span>
        <div>
          <h2 className="pillar-title text-xl md:text-2xl">
            {config.title}
          </h2>
          <p className="pillar-subtitle mt-0.5">{config.subtitle}</p>
        </div>
      </div>

      {/* Ornamental divider */}
      <div className="ornament-divider" style={{ margin: '1rem 0' }}>
        <span>&#10022;</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : results.length === 0 ? (
        <p
          className="text-center py-8 italic"
          style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem' }}
        >
          Nenhuma fonte encontrada para este tema neste pilar.
        </p>
      ) : (
        <div className="space-y-5">
          {results.map((result) => (
            <VerseBlock
              key={result.id}
              result={result}
              accentColor={config.accentColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}
