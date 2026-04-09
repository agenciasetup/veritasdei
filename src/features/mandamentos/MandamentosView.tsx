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
        <header className="relative z-10 w-full pt-6 pb-2 px-4">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="theme-chip inline-flex items-center gap-2 !px-4 !py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mandamentos</span>
            </button>
          </div>
        </header>
      )}

      <section className="relative z-10 text-center px-4 pt-6 pb-6">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {selected ? selected.title : 'Os Dez Mandamentos'}
        </h1>
        {!selected && (
          <p
            className="text-sm max-w-2xl mx-auto"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            A Lei de Deus, entregue a Moisés no Sinai. Toque para explorar.
          </p>
        )}
        <div className="ornament-divider max-w-xs mx-auto mt-3">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-3xl mx-auto px-4 space-y-3">
            {MANDAMENTOS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="glass-card p-5 w-full text-left transition-all duration-300 hover:scale-[1.01] fade-in cursor-pointer"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-5">
                  <span
                    className="text-2xl font-bold flex-shrink-0 w-10 text-center"
                    style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.6 }}
                  >
                    {m.id}
                  </span>
                  <div>
                    <h3
                      className="text-base font-semibold leading-snug"
                      style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                    >
                      {m.title}
                    </h3>
                  </div>
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
