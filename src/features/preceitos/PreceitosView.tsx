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
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Preceitos</span>
            </button>
          </div>
        </header>
      )}

      <section className="page-header relative z-10">
        <h1>
          {selected ? selected.title : 'Os Cinco Preceitos da Igreja'}
        </h1>
        {!selected && (
          <p className="subtitle">
            O mínimo indispensável de oração e esforço moral. Toque para explorar.
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-5">
            {PRECEITOS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="feature-card w-full text-left fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-start gap-6">
                  <span
                    className="text-4xl font-bold flex-shrink-0 w-14 text-center pt-1"
                    style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.5 }}
                  >
                    {p.id}
                  </span>
                  <div className="flex-1">
                    <h3
                      className="text-lg font-semibold leading-snug mb-2"
                      style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                    >
                      {p.title}
                    </h3>
                    <p
                      className="text-sm"
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
