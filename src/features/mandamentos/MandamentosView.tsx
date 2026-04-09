'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { MANDAMENTOS } from './data'
import type { Mandamento } from './data'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide, VerseSlide } from '@/components/ui/SlideContent'

function buildSlides(m: Mandamento): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  slides.push({
    id: `${m.id}-title`,
    content: (
      <TitleSlide
        number={`${m.id}º Mandamento`}
        title={m.title}
        description={m.explanation.split('. ')[0] + '.'}
      />
    ),
  })

  slides.push({
    id: `${m.id}-explanation`,
    content: <ExplanationSlide title="O que Deus ordena" text={m.explanation} />,
  })

  m.verses.forEach((v, i) => {
    slides.push({
      id: `${m.id}-verse-${i}`,
      content: (
        <VerseSlide
          reference={v.reference}
          text={v.text}
          copyText={`${m.title}\n\n${v.reference}: "${v.text}"`}
        />
      ),
    })
  })

  return slides
}

export default function MandamentosView() {
  const [selected, setSelected] = useState<Mandamento | null>(null)
  const slides = selected ? buildSlides(selected) : []

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {selected && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mandamentos</span>
            </button>
          </div>
        </header>
      )}

      <section className="page-header relative z-10">
        <h1>
          {selected ? selected.title : 'Os Dez Mandamentos'}
        </h1>
        {!selected && (
          <p className="subtitle">
            A Lei de Deus, entregue a Moisés no Sinai. Toque para explorar.
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {MANDAMENTOS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-5">
                  <span
                    className="text-3xl font-bold flex-shrink-0 w-12 text-center"
                    style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.4 }}
                  >
                    {m.id}
                  </span>
                  <h3
                    className="text-lg font-semibold leading-snug"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {m.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Carousel slides={slides} onClose={() => setSelected(null)} />
        )}
      </main>
    </div>
  )
}
