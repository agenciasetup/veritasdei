'use client'

/**
 * MagisterioView — UI da página /educa/magisterio.
 *
 * Visual sacro, hero com ícone + headline, search box grande, e resposta
 * rica em baixo (summary com markdown, key points, versículos, magistério,
 * padres da Igreja). Usa o mesmo endpoint /api/verbum/research.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Search, Sparkles } from 'lucide-react'
import GlassCard from '@/components/educa/GlassCard'
import SimpleMarkdown from '@/lib/markdown/simple'

type Verse = { reference: string; text: string; similarity?: number }
type Source = { reference: string; text: string }
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
  'Como refutar Sola Scriptura?',
  'O que é a Trindade?',
  'Por que confessar a um padre?',
  'A Igreja Católica é a verdadeira?',
  'O que é a Imaculada Conceição?',
  'Por que rezamos a Maria?',
  'O que diz o Magistério sobre o aborto?',
  'Por que existe o purgatório?',
]

export default function MagisterioView() {
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

  const canSubmit = useMemo(
    () => query.trim().length >= 3 && !loading,
    [query, loading],
  )

  async function submit(forcedQuery?: string) {
    const q = (forcedQuery ?? query).trim()
    if (q.length < 3 || loading) return
    setQuery(q)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/verbum/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
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
    <div
      className="relative min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 700px 500px at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%), radial-gradient(ellipse 500px 400px at 90% 100%, color-mix(in srgb, var(--wine) 12%, transparent), transparent 70%), var(--surface-1)',
      }}
    >
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-32 md:py-12">
        <Link
          href="/educa"
          className="inline-flex items-center gap-1 text-xs mb-6"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao painel
        </Link>

        <header className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl mb-4"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--accent) 35%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.6) 100%)',
              border:
                '1.5px solid color-mix(in srgb, var(--accent) 50%, transparent)',
              boxShadow:
                '0 12px 32px -12px color-mix(in srgb, var(--accent) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <Sparkles
              className="w-7 h-7 md:w-9 md:h-9"
              style={{ color: 'var(--accent)' }}
            />
          </div>
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            IA Católica
          </p>
          <h1
            className="text-3xl md:text-5xl mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            Pergunte ao Magistério
          </h1>
          <p
            className="text-sm md:text-base max-w-xl mx-auto"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Pesquise teologia, doutrina, moral, espiritualidade. As respostas
            vêm da Bíblia, Magistério (CIC, encíclicas, concílios) e dos
            Padres da Igreja.
          </p>
        </header>

        {/* Caixa de busca */}
        <GlassCard variant="default" padded>
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
                autoFocus
                className="w-full pl-9 pr-3 py-3 rounded-2xl outline-none text-base"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border:
                    '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
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

          {/* Sugestões — só quando sem resultado nem loading */}
          {!result && !loading && (
            <div className="mt-4">
              <p
                className="text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Sugestões
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p
              className="mt-3 text-sm px-3 py-2 rounded-xl"
              style={{
                background:
                  'color-mix(in srgb, var(--warning) 10%, transparent)',
                color: 'var(--warning)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </p>
          )}
        </GlassCard>

        {/* Resultado */}
        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: 'var(--accent)' }}
            />
            <p
              className="text-sm"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Consultando Bíblia, Magistério e Padres da Igreja...
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            {/* Tags */}
            {result.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.tags.slice(0, 6).map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Insight com markdown */}
            {result.insight?.summary && (
              <GlassCard variant="default" padded>
                <p
                  className="text-[10px] tracking-[0.2em] uppercase mb-2"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Resposta
                </p>
                <SimpleMarkdown text={result.insight.summary} />
              </GlassCard>
            )}

            {/* Key points */}
            {Array.isArray(result.insight?.keyPoints) &&
              result.insight!.keyPoints.length > 0 && (
                <GlassCard variant="inset" padded>
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase mb-2"
                    style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Pontos-chave
                  </p>
                  <ul className="space-y-2">
                    {result.insight!.keyPoints.slice(0, 6).map((pt, i) => (
                      <li
                        key={i}
                        className="text-sm md:text-base flex items-start gap-2"
                        style={{
                          color: 'var(--text-1)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ background: 'var(--accent)' }}
                        />
                        <SimpleMarkdown
                          text={pt}
                          className="flex-1"
                          style={{ display: 'inline' }}
                        />
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}

            {/* Curiosidade */}
            {result.insight?.curiosity && (
              <GlassCard variant="wine" padded>
                <p
                  className="text-[10px] tracking-[0.2em] uppercase mb-2"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Curiosidade
                </p>
                <SimpleMarkdown text={result.insight.curiosity} />
              </GlassCard>
            )}

            {result.verses.length > 0 && (
              <SourceBlock title="Bíblia" items={result.verses} />
            )}
            {result.magisterium.length > 0 && (
              <SourceBlock title="Magistério" items={result.magisterium} />
            )}
            {result.patristic.length > 0 && (
              <SourceBlock title="Padres da Igreja" items={result.patristic} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function SourceBlock({
  title,
  items,
}: {
  title: string
  items: Array<{ reference: string; text: string }>
}) {
  return (
    <GlassCard variant="default" padded>
      <p
        className="text-[10px] tracking-[0.2em] uppercase mb-3"
        style={{
          color: 'var(--accent)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {title}
      </p>
      <ul className="space-y-2.5">
        {items.slice(0, 5).map((s, i) => (
          <li
            key={i}
            className="rounded-xl p-3"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border:
                '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
            }}
          >
            <p
              className="text-[11px] tracking-wider uppercase mb-1"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {s.reference}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {s.text}
            </p>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
