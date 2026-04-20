'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, X, BookOpen, ChevronDown, Sparkles } from 'lucide-react'
import { SUMA_PARTS } from './data/suma'
import type { FlatArticle } from './data/types'
import ArticleView from './components/ArticleView'
import Divider from '@/components/ui/Divider'

/** Flatten all articles into a searchable index */
function buildIndex(): FlatArticle[] {
  const result: FlatArticle[] = []
  for (const part of SUMA_PARTS) {
    for (const theme of part.themes) {
      for (const question of theme.questions) {
        for (const article of question.articles) {
          result.push({
            article,
            partAbbr: part.abbreviation,
            partName: part.name,
            themeName: theme.title,
            questionTitle: question.title,
            path: `${part.name} › ${theme.title} › q.${question.number}, a.${article.article}`,
          })
        }
      }
    }
  }
  return result
}

export default function SaoTomasView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openParts, setOpenParts] = useState<Set<string>>(new Set(SUMA_PARTS.map(p => p.id)))
  const [showSynthesis, setShowSynthesis] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  const allArticles = useMemo(() => buildIndex(), [])

  const filtered = useMemo(() => {
    if (searchTerm.length < 2) return null
    const term = searchTerm.toLowerCase()
    return allArticles.filter(fa =>
      fa.article.title.toLowerCase().includes(term) ||
      fa.article.respondeo.toLowerCase().includes(term) ||
      fa.article.sedContra.toLowerCase().includes(term) ||
      fa.article.objections.some(o => o.toLowerCase().includes(term)) ||
      fa.article.replies.some(r => r.toLowerCase().includes(term))
    )
  }, [searchTerm, allArticles])

  const isSearching = filtered !== null

  function togglePart(id: string) {
    setOpenParts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSynthesis(key: string) {
    setShowSynthesis(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function clearSearch() {
    setSearchTerm('')
    searchRef.current?.focus()
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Header */}
      <section className="relative z-10 text-center px-5 pt-8 pb-4">
        <h1
          className="text-2xl md:text-3xl tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          São Tomás de Aquino
        </h1>
        <p
          className="mt-2 text-sm max-w-md mx-auto"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Estude a Suma Teológica — a obra-prima do Doutor Angélico
        </p>
        <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
      </section>

      {/* Search bar */}
      <div className="relative z-10 w-full px-4 md:px-8 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-3)' }}
            />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar na Suma... (ex: existência de Deus, felicidade, Encarnação)"
              className="w-full pl-11 pr-10 py-3.5 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-1)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
                style={{ color: 'var(--text-3)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSearching && (
            <p
              className="text-xs mt-2 ml-1"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {filtered.length === 0
                ? 'Nenhum artigo encontrado.'
                : `${filtered.length} ${filtered.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}`}
            </p>
          )}
        </div>
      </div>

      <main className="relative z-10 flex-1 pb-28 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* ════════════════════════════════
              SEARCH RESULTS
              ════════════════════════════════ */}
          {isSearching ? (
            <div className="space-y-5">
              {filtered.map(fa => (
                <div key={fa.article.id} className="fade-in">
                  {/* Breadcrumb */}
                  <p
                    className="text-[10px] tracking-[0.12em] uppercase mb-2 ml-1"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {fa.path}
                  </p>
                  <ArticleView
                    article={fa.article}
                    partAbbr={fa.partAbbr}
                    highlight={searchTerm}
                    expandAll
                  />
                </div>
              ))}
            </div>
          ) : (
            /* ════════════════════════════════
               SCROLLABLE BOOK VIEW
               ════════════════════════════════ */
            <div className="space-y-8">
              {SUMA_PARTS.map(part => {
                const isPartOpen = openParts.has(part.id)
                const partSynthKey = `part-${part.id}`
                const showPartSynth = showSynthesis.has(partSynthKey)

                return (
                  <section key={part.id} className="fade-in">
                    {/* ── Part Header ── */}
                    <button
                      onClick={() => togglePart(part.id)}
                      className="w-full text-left group"
                    >
                      <div
                        className="p-5 md:p-6 rounded-2xl transition-all duration-300"
                        style={{
                          background: isPartOpen
                            ? 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(107,29,42,0.05) 100%)'
                            : 'rgba(20,18,14,0.4)',
                          border: `1px solid ${isPartOpen ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)'}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{
                                background: 'rgba(201,168,76,0.1)',
                                border: '1px solid rgba(201,168,76,0.2)',
                              }}
                            >
                              <span
                                className="text-xs font-bold"
                                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
                              >
                                {part.abbreviation}
                              </span>
                            </div>
                            <div>
                              <h2
                                className="text-lg font-bold"
                                style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                              >
                                {part.name}
                              </h2>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                              >
                                {part.description}
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            className="w-5 h-5 transition-transform duration-300 flex-shrink-0"
                            style={{
                              color: '#7A7368',
                              transform: isPartOpen ? 'rotate(180deg)' : 'rotate(0)',
                            }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* ── Part Content ── */}
                    <div
                      className="overflow-hidden transition-all duration-500"
                      style={{
                        maxHeight: isPartOpen ? '100000px' : '0',
                        opacity: isPartOpen ? 1 : 0,
                      }}
                    >
                      {/* Part synthesis */}
                      {part.synthesis && (
                        <div className="mt-3 ml-2 md:ml-4">
                          <button
                            onClick={() => toggleSynthesis(partSynthKey)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                            style={{
                              background: showPartSynth ? 'rgba(201,168,76,0.06)' : 'transparent',
                              border: '1px solid rgba(201,168,76,0.08)',
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                            <span
                              className="text-xs"
                              style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                            >
                              {showPartSynth ? 'Ocultar síntese' : 'Ver síntese'}
                            </span>
                          </button>
                          {showPartSynth && (
                            <div
                              className="mt-2 p-4 rounded-xl fade-in"
                              style={{
                                background: 'rgba(201,168,76,0.03)',
                                border: '1px solid rgba(201,168,76,0.08)',
                                borderLeft: '3px solid rgba(201,168,76,0.3)',
                              }}
                            >
                              <p
                                className="text-sm leading-[1.9]"
                                style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
                              >
                                {part.synthesis}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Themes */}
                      <div className="mt-4 space-y-6 ml-2 md:ml-4">
                        {part.themes.map((theme, ti) => {
                          const themeSynthKey = `theme-${part.id}-${ti}`
                          const showThemeSynth = showSynthesis.has(themeSynthKey)

                          return (
                            <div key={ti}>
                              {/* Theme header */}
                              <div className="mb-3">
                                <h3
                                  className="text-base font-semibold"
                                  style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
                                >
                                  {theme.title}
                                </h3>
                                <p
                                  className="text-xs mt-1"
                                  style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                                >
                                  {theme.description}
                                </p>

                                {/* Theme synthesis */}
                                {theme.synthesis && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => toggleSynthesis(themeSynthKey)}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                                      style={{
                                        background: showThemeSynth ? 'rgba(201,168,76,0.06)' : 'transparent',
                                        border: '1px solid rgba(201,168,76,0.06)',
                                      }}
                                    >
                                      <Sparkles className="w-3 h-3" style={{ color: '#C9A84C' }} />
                                      <span
                                        className="text-[11px]"
                                        style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                                      >
                                        {showThemeSynth ? 'Ocultar síntese' : 'Síntese do tema'}
                                      </span>
                                    </button>
                                    {showThemeSynth && (
                                      <div
                                        className="mt-2 p-4 rounded-xl fade-in"
                                        style={{
                                          background: 'rgba(201,168,76,0.03)',
                                          border: '1px solid rgba(201,168,76,0.08)',
                                          borderLeft: '3px solid rgba(201,168,76,0.2)',
                                        }}
                                      >
                                        <p
                                          className="text-sm leading-[1.9]"
                                          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
                                        >
                                          {theme.synthesis}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Questions & Articles inline */}
                              <div className="space-y-4">
                                {theme.questions.map(question => (
                                  <div key={question.number}>
                                    {/* Question header */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#7A7368' }} />
                                      <h4
                                        className="text-sm font-semibold"
                                        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                                      >
                                        Questão {question.number} — {question.title}
                                      </h4>
                                    </div>

                                    {/* All articles inline */}
                                    <div className="space-y-3">
                                      {question.articles.map(article => (
                                        <ArticleView
                                          key={article.id}
                                          article={article}
                                          partAbbr={part.abbreviation}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Theme divider */}
                              {ti < part.themes.length - 1 && (
                                <div className="ornament-divider max-w-xs mx-auto mt-6">
                                  <span style={{ fontSize: '0.6rem' }}>&#10022;</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
