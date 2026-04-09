'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PRECEITOS } from './data'
import type { Preceito } from './data'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide, VerseSlide } from '@/components/ui/SlideContent'

function buildPreceitoSlides(p: Preceito): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  slides.push({
    id: `${p.id}-title`,
    content: (
      <TitleSlide
        number={`${p.id}º Preceito`}
        title={p.title}
        subtitle={p.catechismRef}
        description={p.explanation.split('. ')[0] + '.'}
      />
    ),
  })

  slides.push({
    id: `${p.id}-explanation`,
    content: (
      <ExplanationSlide title="O que a Igreja prescreve" text={p.explanation} />
    ),
  })

  p.verses.forEach((v, i) => {
    slides.push({
      id: `${p.id}-verse-${i}`,
      content: (
        <VerseSlide
          reference={v.reference}
          text={v.text}
          copyText={`${p.title}\n\n${v.reference}: "${v.text}"`}
        />
      ),
    })
  })

  return slides
}

export default function PreceitosView() {
  const [selected, setSelected] = useState<Preceito | null>(null)

  const slides = selected ? buildPreceitoSlides(selected) : []

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
              <span>Preceitos</span>
            </button>
          </div>
        </header>
      )}

      <section className="relative z-10 text-center px-4 pt-6 pb-6">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {selected ? selected.title : 'Os Cinco Preceitos da Igreja'}
        </h1>
        {!selected && (
          <p
            className="text-sm max-w-2xl mx-auto"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            O mínimo indispensável de oração e esforço moral. Toque para explorar.
          </p>
        )}
        <div className="ornament-divider max-w-xs mx-auto mt-3">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-3xl mx-auto px-4 space-y-4">
            {PRECEITOS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="glass-card p-6 w-full text-left transition-all duration-300 hover:scale-[1.01] fade-in cursor-pointer"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-start gap-5">
                  <span
                    className="text-3xl font-bold flex-shrink-0"
                    style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.6 }}
                  >
                    {p.id}
                  </span>
                  <div>
                    <h3
                      className="text-base font-semibold leading-snug"
                      style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                    >
                      {p.title}
                    </h3>
                    <p
                      className="text-xs mt-1"
                      style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {p.catechismRef}
                    </p>
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
