'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ORACOES } from './data'
import type { Oracao } from './data'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide } from '@/components/ui/SlideContent'

function PrayerTextSlide({ oracao }: { oracao: Oracao }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try { await navigator.clipboard.writeText(`${oracao.name}\n\n${oracao.text}`) } catch { /* ok */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col justify-center min-h-[45vh]">
      <h3
        className="text-sm tracking-wider uppercase mb-6 flex items-center gap-3"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        Texto da Oração
      </h3>
      <div
        className="text-lg leading-[2.1] whitespace-pre-line"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#E8E2D8', fontWeight: 500 }}
      >
        {oracao.text}
      </div>
      <button
        onClick={handleCopy}
        className="mt-6 self-start flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider transition-all duration-200"
        style={{
          background: copied ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
          color: copied ? '#C9A84C' : '#7A7368',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {copied ? 'Copiado!' : 'Copiar oração'}
      </button>
    </div>
  )
}

function buildSlides(o: Oracao): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  slides.push({
    id: `${o.id}-title`,
    content: (
      <TitleSlide
        number={o.latinName || o.category}
        title={o.name}
        subtitle={o.origin}
        description={o.explanation.split('. ')[0] + '.'}
      />
    ),
  })

  slides.push({
    id: `${o.id}-explanation`,
    content: <ExplanationSlide title="Sobre esta oração" text={o.explanation} />,
  })

  slides.push({
    id: `${o.id}-text`,
    content: <PrayerTextSlide oracao={o} />,
  })

  return slides
}

const CATEGORY_LABELS: Record<string, string> = {
  principal: 'Orações Principais',
  credo: 'Profissões de Fé',
  ato: 'Atos de Virtude',
  devocional: 'Devoções',
}

export default function OracoesView() {
  const [selected, setSelected] = useState<Oracao | null>(null)
  const slides = selected ? buildSlides(selected) : []

  const categories = ['principal', 'credo', 'ato', 'devocional']

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {selected && (
        <header className="relative z-10 w-full pt-6 pb-2 px-4">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="theme-chip inline-flex items-center gap-2 !px-4 !py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Orações</span>
            </button>
          </div>
        </header>
      )}

      <section className="relative z-10 text-center px-4 pt-6 pb-6">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {selected ? selected.name : 'Orações da Igreja'}
        </h1>
        {!selected && (
          <p
            className="text-sm max-w-2xl mx-auto"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            As orações fundamentais da vida cristã católica.
          </p>
        )}
        <div className="ornament-divider max-w-xs mx-auto mt-3">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-3xl mx-auto px-4 space-y-8">
            {categories.map((cat) => {
              const items = ORACOES.filter(o => o.category === cat)
              if (!items.length) return null
              return (
                <div key={cat}>
                  <h2
                    className="text-xs tracking-widest uppercase mb-3 px-1"
                    style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.7 }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((o, i) => (
                      <button
                        key={o.id}
                        onClick={() => setSelected(o)}
                        className="glass-card p-5 text-left transition-all duration-300 hover:scale-[1.02] fade-in cursor-pointer"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <h3
                          className="text-base font-semibold leading-snug"
                          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                        >
                          {o.name}
                        </h3>
                        {o.latinName && (
                          <p className="text-xs mt-1 italic" style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}>
                            {o.latinName}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Carousel slides={slides} onClose={() => setSelected(null)} />
        )}
      </main>
    </div>
  )
}
