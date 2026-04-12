'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, BookOpen, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'

interface VerseResult {
  reference: string
  text: string
  similarity: number
}

interface SourceResult {
  reference: string
  text: string
}

interface AIInsight {
  summary: string
  keyPoints: string[]
  relatedTopics: string[]
  sourceContext: Record<string, string>
  isControversial: boolean
  curiosity: string | null
}

interface ResearchResult {
  query: string
  insight: AIInsight | null
  verses: VerseResult[]
  magisterium: SourceResult[]
  patristic: SourceResult[]
  tags: string[]
}

interface AISearchPanelProps {
  visible: boolean
  onClose: () => void
  onAddVerse: (reference: string, text: string) => void
}

export default function AISearchPanel({ visible, onClose, onAddVerse }: AISearchPanelProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insight: true,
    verses: true,
    magisterium: false,
    patristic: false,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q || q.length < 3) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsSearching(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/verbum/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao pesquisar')
      }

      const data: ResearchResult = await res.json()
      if (!controller.signal.aborted) {
        setResult(data)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError((err as Error).message || 'Erro ao pesquisar')
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [query])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[300] bg-black/40" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[301] w-full sm:w-[420px] flex flex-col overflow-hidden"
            style={{
              background: VERBUM_COLORS.ui_bg,
              borderLeft: `1px solid ${VERBUM_COLORS.ui_border}`,
              boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: VERBUM_COLORS.ui_gold }} />
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold, letterSpacing: '0.05em' }}
                >
                  Pesquisa Teologica
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: VERBUM_COLORS.text_muted }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearch() }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Paralelos de Maria no AT..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${VERBUM_COLORS.ui_border}`,
                    color: VERBUM_COLORS.text_primary,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={isSearching || query.trim().length < 3}
                  className="px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
                  style={{
                    background: 'rgba(201,168,76,0.15)',
                    border: `1px solid rgba(201,168,76,0.4)`,
                    color: VERBUM_COLORS.ui_gold,
                  }}
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </form>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {error && (
                <div className="text-xs text-center py-4" style={{ color: '#E07070' }}>
                  {error}
                </div>
              )}

              {isSearching && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: VERBUM_COLORS.ui_gold }} />
                  <span className="text-xs" style={{ color: VERBUM_COLORS.text_muted }}>
                    Pesquisando nas fontes...
                  </span>
                </div>
              )}

              {result && !isSearching && (
                <>
                  {/* AI Insight */}
                  {result.insight && (
                    <Section
                      title="Sintese Teologica"
                      expanded={expandedSections.insight}
                      onToggle={() => toggleSection('insight')}
                    >
                      <div
                        className="text-xs leading-relaxed whitespace-pre-line"
                        style={{ color: VERBUM_COLORS.text_secondary }}
                      >
                        {result.insight.summary}
                      </div>

                      {result.insight.keyPoints.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {result.insight.keyPoints.map((point, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-[11px]"
                              style={{ color: VERBUM_COLORS.text_primary }}
                            >
                              <span style={{ color: VERBUM_COLORS.ui_gold }}>*</span>
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.insight.curiosity && (
                        <div
                          className="mt-3 px-3 py-2 rounded-lg text-[11px] italic"
                          style={{
                            background: 'rgba(201,168,76,0.06)',
                            border: `1px solid rgba(201,168,76,0.15)`,
                            color: VERBUM_COLORS.text_secondary,
                          }}
                        >
                          {result.insight.curiosity}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Verses */}
                  {result.verses.length > 0 && (
                    <Section
                      title={`Versiculos (${result.verses.length})`}
                      expanded={expandedSections.verses}
                      onToggle={() => toggleSection('verses')}
                    >
                      <div className="space-y-2">
                        {result.verses.map((verse, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: `1px solid ${VERBUM_COLORS.ui_border}`,
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-[11px] font-semibold"
                                style={{ color: VERBUM_COLORS.ui_gold }}
                              >
                                {verse.reference}
                              </div>
                              <div
                                className="text-[11px] mt-0.5 italic leading-relaxed"
                                style={{
                                  color: VERBUM_COLORS.text_secondary,
                                  fontFamily: 'Cormorant Garamond, serif',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                &ldquo;{verse.text}&rdquo;
                              </div>
                            </div>
                            <button
                              onClick={() => onAddVerse(verse.reference, verse.text)}
                              className="shrink-0 p-1 rounded transition-colors"
                              style={{ color: VERBUM_COLORS.ui_gold }}
                              title="Adicionar ao canvas"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Magisterium */}
                  {result.magisterium.length > 0 && (
                    <Section
                      title={`Magisterio (${result.magisterium.length})`}
                      expanded={expandedSections.magisterium}
                      onToggle={() => toggleSection('magisterium')}
                    >
                      <div className="space-y-2">
                        {result.magisterium.map((src, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="font-semibold" style={{ color: VERBUM_COLORS.edge_doutrina }}>
                              {src.reference}
                            </span>
                            <span className="ml-1.5" style={{ color: VERBUM_COLORS.text_secondary }}>
                              {src.text.slice(0, 200)}{src.text.length > 200 ? '...' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Patristic */}
                  {result.patristic.length > 0 && (
                    <Section
                      title={`Patristica (${result.patristic.length})`}
                      expanded={expandedSections.patristic}
                      onToggle={() => toggleSection('patristic')}
                    >
                      <div className="space-y-2">
                        {result.patristic.map((src, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="font-semibold" style={{ color: VERBUM_COLORS.edge_patristica }}>
                              {src.reference}
                            </span>
                            <span className="ml-1.5" style={{ color: VERBUM_COLORS.text_secondary }}>
                              {src.text.slice(0, 200)}{src.text.length > 200 ? '...' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Related Topics */}
                  {result.insight && result.insight.relatedTopics.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: VERBUM_COLORS.text_muted }}>
                        Topicos Relacionados
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.insight.relatedTopics.map((topic, i) => (
                          <button
                            key={i}
                            onClick={() => { setQuery(topic); }}
                            className="px-2 py-0.5 rounded text-[10px] transition-colors"
                            style={{
                              background: 'rgba(201,168,76,0.08)',
                              border: `1px solid rgba(201,168,76,0.2)`,
                              color: VERBUM_COLORS.ui_gold,
                            }}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {result.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[9px]"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            color: VERBUM_COLORS.text_muted,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Empty state */}
              {!result && !isSearching && !error && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Search className="w-8 h-8 opacity-20" style={{ color: VERBUM_COLORS.ui_gold }} />
                  <div className="text-xs max-w-[240px]" style={{ color: VERBUM_COLORS.text_muted }}>
                    Faca uma pergunta teologica e a IA pesquisara nas Escrituras, Magisterio e Patristica.
                  </div>
                  <div className="space-y-1 text-[10px]" style={{ color: VERBUM_COLORS.text_muted }}>
                    <div>&ldquo;Paralelos de Maria no Antigo Testamento&rdquo;</div>
                    <div>&ldquo;Fundamento biblico da Eucaristia&rdquo;</div>
                    <div>&ldquo;Tipologias do Batismo&rdquo;</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Collapsible section helper
function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${VERBUM_COLORS.ui_border}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: VERBUM_COLORS.text_primary }}
        >
          {title}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.text_muted }} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.text_muted }} />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
