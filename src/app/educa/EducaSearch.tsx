'use client'

/**
 * Caixa "Qual sua dúvida?" — chama o endpoint /api/verbum/research e
 * renderiza um insight + versículos/Magistério/Pais. É o "Pergunte ao
 * Magistério" do subproduto Veritas Educa.
 *
 * Comportamento:
 *  - Input com placeholder rotativo (ex.: "O que é a Trindade?",
 *    "Como refutar Sola Scriptura?", "Por que confessar a um padre?").
 *  - Resultado expande inline (sem navegar pra outra rota).
 *  - Erros de rate-limit (429) viram aviso amigável.
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, Sparkles } from 'lucide-react'
import GlassCard from '@/components/educa/GlassCard'

type Verse = { reference: string; text: string; similarity?: number }
type Source = { reference: string; text: string }

// O endpoint /api/verbum/research devolve `insight` como objeto AIInsight,
// não como string. Aqui modelamos só os campos que renderizamos.
type Insight = {
  summary?: string
  keyPoints?: string[]
  relatedTopics?: string[]
  curiosity?: string | null
} | null

type ResearchResponse = {
  query: string
  insight: Insight
  verses: Verse[]
  magisterium: Source[]
  patristic: Source[]
  tags: string[]
}

const SUGGESTIONS = [
  'O que é a Trindade?',
  'Como refutar Sola Scriptura?',
  'Por que confessar a um padre?',
  'A Igreja Católica é a verdadeira?',
  'O que é a Imaculada Conceição?',
  'Por que rezamos a Maria?',
]

export default function EducaSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResearchResponse | null>(null)
  const [placeholder, setPlaceholder] = useState(SUGGESTIONS[0])

  useEffect(() => {
    if (query.length > 0) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SUGGESTIONS.length
      setPlaceholder(SUGGESTIONS[i])
    }, 3000)
    return () => clearInterval(id)
  }, [query])

  const canSubmit = useMemo(() => query.trim().length >= 3 && !loading, [query, loading])

  async function submit() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/verbum/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            'Você usou seu limite de pesquisas por agora. Tente novamente em alguns minutos.',
          )
        }
        throw new Error(data?.error || 'Não consegui pesquisar. Tenta de novo?')
      }
      setResult(data as ResearchResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard variant="default" padded as="section">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <h2
          className="text-sm tracking-[0.15em] uppercase"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Pergunte ao Magistério
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="flex-1 relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-3)' }}
          />
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-3 rounded-2xl outline-none text-base"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-1)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pesquisar'}
        </button>
      </form>

      {error && (
        <p
          className="mt-3 text-sm px-3 py-2 rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
            color: 'var(--warning)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          {result.insight?.summary && (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              {result.insight.summary}
            </p>
          )}

          {Array.isArray(result.insight?.keyPoints) &&
            result.insight!.keyPoints.length > 0 && (
              <ul className="space-y-1.5">
                {result.insight!.keyPoints.slice(0, 5).map((pt, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{
                      color: 'var(--text-2)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span
                      className="inline-block w-1 h-1 rounded-full mt-2 flex-shrink-0"
                      style={{ background: 'var(--accent)' }}
                    />
                    {pt}
                  </li>
                ))}
              </ul>
            )}

          {result.verses.length > 0 && (
            <SourceList title="Bíblia" items={result.verses} />
          )}
          {result.magisterium.length > 0 && (
            <SourceList title="Magistério" items={result.magisterium} />
          )}
          {result.patristic.length > 0 && (
            <SourceList title="Padres da Igreja" items={result.patristic} />
          )}
        </div>
      )}
    </GlassCard>
  )
}

function SourceList({
  title,
  items,
}: {
  title: string
  items: Array<{ reference: string; text: string }>
}) {
  return (
    <div>
      <h3
        className="text-[11px] tracking-[0.2em] uppercase mb-2"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 3).map((s, i) => (
          <li
            key={i}
            className="rounded-xl p-3 text-sm"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-1)',
            }}
          >
            <p
              className="text-[11px] mb-1"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              {s.reference}
            </p>
            <p
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              {s.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
