'use client'

import { useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { SUMA_PARTS } from './data/suma'
import type { SumaPart, SumaTheme, SumaQuestion, SumaArticle } from './data/types'
import ArticleView from './components/ArticleView'

type View = 'parts' | 'themes' | 'questions' | 'articles' | 'article'

export default function SaoTomasView() {
  const [view, setView] = useState<View>('parts')
  const [selectedPart, setSelectedPart] = useState<SumaPart | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<SumaTheme | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<SumaQuestion | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<SumaArticle | null>(null)

  function goBack() {
    if (view === 'article') { setView('articles'); setSelectedArticle(null) }
    else if (view === 'articles') { setView('questions'); setSelectedQuestion(null) }
    else if (view === 'questions') { setView('themes'); setSelectedTheme(null) }
    else if (view === 'themes') { setView('parts'); setSelectedPart(null) }
  }

  function selectPart(p: SumaPart) { setSelectedPart(p); setView('themes') }
  function selectTheme(t: SumaTheme) { setSelectedTheme(t); setView('questions') }
  function selectQuestion(q: SumaQuestion) { setSelectedQuestion(q); setView('articles') }
  function selectArticle(a: SumaArticle) { setSelectedArticle(a); setView('article') }

  const breadcrumb = [
    selectedPart?.name,
    selectedTheme?.title,
    selectedQuestion ? `q.${selectedQuestion.number}` : null,
    selectedArticle ? `a.${selectedArticle.article}` : null,
  ].filter(Boolean).join(' › ')

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* Back button */}
      {view !== 'parts' && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <button onClick={goBack} className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>
        </header>
      )}

      {/* Header */}
      <section className="page-header relative z-10">
        <h1>{view === 'parts' ? 'São Tomás de Aquino' : breadcrumb}</h1>
        <p className="subtitle">
          {view === 'parts'
            ? 'Estude a Suma Teológica — a obra-prima do Doutor Angélico'
            : selectedArticle?.title
              ?? selectedQuestion?.title
              ?? selectedTheme?.description
              ?? selectedPart?.description}
        </p>
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-28 md:pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* Parts grid */}
          {view === 'parts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUMA_PARTS.map((part, i) => (
                <button
                  key={part.id}
                  onClick={() => selectPart(part)}
                  className="feature-card text-left fade-in"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span
                    className="text-xs tracking-[0.15em] uppercase block mb-2"
                    style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {part.abbreviation} — {part.name}
                  </span>
                  <h3
                    className="text-lg font-semibold leading-snug mb-2"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {part.name}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {part.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                    <span className="text-[11px]" style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                      {part.themes.length} {part.themes.length === 1 ? 'tema' : 'temas'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Themes */}
          {view === 'themes' && selectedPart && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPart.themes.map((theme, i) => (
                <button
                  key={i}
                  onClick={() => selectTheme(theme)}
                  className="feature-card text-left fade-in"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <h3
                    className="text-base font-semibold leading-snug mb-2"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {theme.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {theme.description}
                  </p>
                  <span className="text-[11px] mt-2 block" style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                    {theme.questions.length} {theme.questions.length === 1 ? 'questão' : 'questões'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Questions */}
          {view === 'questions' && selectedTheme && (
            <div className="space-y-3">
              {selectedTheme.questions.map((q, i) => (
                <button
                  key={q.number}
                  onClick={() => selectQuestion(q)}
                  className="w-full text-left p-5 rounded-2xl transition-all duration-300 fade-in"
                  style={{
                    background: 'rgba(20,18,14,0.5)',
                    border: '1px solid rgba(201,168,76,0.08)',
                    animationDelay: `${i * 0.06}s`,
                  }}
                >
                  <span
                    className="text-[10px] tracking-[0.2em] uppercase block mb-1"
                    style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Questão {q.number}
                  </span>
                  <h3
                    className="text-base font-semibold leading-snug"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {q.title}
                  </h3>
                  <span className="text-[11px] mt-2 block" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    {q.articles.length} {q.articles.length === 1 ? 'artigo' : 'artigos'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Articles list */}
          {view === 'articles' && selectedQuestion && (
            <div className="space-y-3">
              {selectedQuestion.articles.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => selectArticle(a)}
                  className="w-full text-left p-5 rounded-2xl transition-all duration-300 fade-in"
                  style={{
                    background: 'rgba(20,18,14,0.5)',
                    border: '1px solid rgba(201,168,76,0.08)',
                    animationDelay: `${i * 0.06}s`,
                  }}
                >
                  <span
                    className="text-[10px] tracking-[0.2em] uppercase block mb-1"
                    style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Artigo {a.article}
                  </span>
                  <h3
                    className="text-base font-semibold leading-snug"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {a.title}
                  </h3>
                </button>
              ))}
            </div>
          )}

          {/* Single article */}
          {view === 'article' && selectedArticle && selectedPart && (
            <ArticleView article={selectedArticle} partAbbr={selectedPart.abbreviation} />
          )}
        </div>
      </main>
    </div>
  )
}
