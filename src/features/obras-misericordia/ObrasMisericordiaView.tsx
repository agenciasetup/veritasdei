'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { OBRA_GROUPS } from './data'
import type { Obra, ObraGroup } from './data'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide, VerseSlide } from '@/components/ui/SlideContent'

function buildSlides(obra: Obra, groupTitle: string): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  slides.push({
    id: `${obra.id}-title`,
    content: (
      <TitleSlide
        number={groupTitle}
        title={obra.name}
        description={obra.explanation.split('. ')[0] + '.'}
      />
    ),
  })

  slides.push({
    id: `${obra.id}-explanation`,
    content: <ExplanationSlide title="O que significa" text={obra.explanation} />,
  })

  obra.verses.forEach((v, i) => {
    slides.push({
      id: `${obra.id}-verse-${i}`,
      content: (
        <VerseSlide
          reference={v.reference}
          text={v.text}
          copyText={`${obra.name}\n\n${v.reference}: "${v.text}"`}
        />
      ),
    })
  })

  return slides
}

export default function ObrasMisericordiaView() {
  const [selectedGroup, setSelectedGroup] = useState<ObraGroup | null>(null)
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)

  const slides = selectedObra && selectedGroup ? buildSlides(selectedObra, selectedGroup.title) : []

  function handleBack() {
    if (selectedObra) setSelectedObra(null)
    else setSelectedGroup(null)
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {(selectedGroup || selectedObra) && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{selectedObra ? selectedGroup?.title : 'Categorias'}</span>
            </button>
          </div>
        </header>
      )}

      <section className="page-header relative z-10">
        <h1>
          {selectedObra
            ? selectedObra.name
            : selectedGroup
              ? selectedGroup.title
              : 'Obras de Misericórdia'}
        </h1>
        {!selectedObra && (
          <p className="subtitle">
            {selectedGroup ? selectedGroup.description : '14 ações de caridade — 7 corporais e 7 espirituais — pelas quais socorremos o próximo.'}
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selectedGroup && !selectedObra && (
          <div className="max-w-4xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {OBRA_GROUPS.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g)}
                className="feature-card text-center flex flex-col items-center fade-in"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span className="text-4xl block mb-5">{g.icon}</span>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                  {g.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                  {g.obras.length} obras
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedGroup && !selectedObra && (
          <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {selectedGroup.obras.map((obra, i) => (
              <button
                key={obra.id}
                onClick={() => setSelectedObra(obra)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-5">
                  <span
                    className="text-3xl font-bold flex-shrink-0 w-12 text-center"
                    style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.4 }}
                  >
                    {obra.id > 7 ? obra.id - 7 : obra.id}
                  </span>
                  <h3 className="text-lg font-semibold leading-snug" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                    {obra.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedObra && (
          <Carousel slides={slides} onClose={() => setSelectedObra(null)} />
        )}
      </main>
    </div>
  )
}
