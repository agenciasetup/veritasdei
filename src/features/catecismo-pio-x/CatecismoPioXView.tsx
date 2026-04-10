'use client'

import { useState, useMemo } from 'react'
import { Search, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { CATECISMO_PIO_X } from './data/catecismo'
import type { CatechismSection, CatechismQuestion } from './data/types'
import SectionAccordion from './components/SectionAccordion'
import QuestionCard from './components/QuestionCard'

interface FlatQuestion {
  sectionPath: string[]
  question: CatechismQuestion
}

/** Achata recursivamente todas as perguntas com seus caminhos de seção */
function flattenQuestions(sections: CatechismSection[], path: string[] = []): FlatQuestion[] {
  const results: FlatQuestion[] = []
  for (const section of sections) {
    const currentPath = [...path, section.title]
    if (section.questions) {
      for (const q of section.questions) {
        results.push({ sectionPath: currentPath, question: q })
      }
    }
    if (section.subsections) {
      results.push(...flattenQuestions(section.subsections, currentPath))
    }
  }
  return results
}

export default function CatecismoPioXView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [allExpanded, setAllExpanded] = useState(false)

  const allQuestions = useMemo(
    () => flattenQuestions(CATECISMO_PIO_X.sections),
    []
  )

  const filtered = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return null
    const term = searchTerm.toLowerCase()
    return allQuestions.filter(
      fq =>
        fq.question.question.toLowerCase().includes(term) ||
        fq.question.answer.toLowerCase().includes(term)
    )
  }, [searchTerm, allQuestions])

  const isSearching = filtered !== null

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* ── Header ── */}
      <section className="page-header relative z-10">
        <h1>Catecismo de São Pio X</h1>
        <p className="subtitle">
          A doutrina cristã em perguntas e respostas
        </p>
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      {/* ── Search & controls ── */}
      <div className="relative z-10 w-full px-4 md:px-8 mb-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Search */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(20,18,14,0.6)',
              border: '1px solid rgba(201,168,76,0.1)',
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#7A7368' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no Catecismo..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-xs" style={{ color: '#7A7368' }}>
                Limpar
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <p className="text-[11px]" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              {isSearching
                ? `${filtered!.length} resultado${filtered!.length !== 1 ? 's' : ''} encontrado${filtered!.length !== 1 ? 's' : ''}`
                : `${allQuestions.length} perguntas em ${CATECISMO_PIO_X.sections.length} seções`}
            </p>
            {!isSearching && (
              <button
                onClick={() => setAllExpanded(!allExpanded)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  color: '#C9A84C',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {allExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="relative z-10 flex-1 pb-28 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          {isSearching ? (
            /* Search results */
            <div className="space-y-3">
              {filtered!.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#7A736840' }} />
                  <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    Nenhum resultado para "{searchTerm}"
                  </p>
                </div>
              ) : (
                filtered!.map((fq, i) => (
                  <div key={i}>
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase mb-1.5 px-1"
                      style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {fq.sectionPath.join(' › ')}
                    </p>
                    <QuestionCard question={fq.question} index={i} highlighted={searchTerm} />
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Full catechism */
            <div className="space-y-4">
              {CATECISMO_PIO_X.sections.map((section, i) => (
                <SectionAccordion
                  key={i}
                  section={section}
                  defaultOpen={i === 0}
                  forceOpen={allExpanded}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
