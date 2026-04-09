'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { SACRAMENTOS } from './data'
import type { Sacramento } from './data'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide, DetailSlide, ListSlide, VerseSlide } from '@/components/ui/SlideContent'

function buildSacramentoSlides(sac: Sacramento): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  // Slide 1: Title
  slides.push({
    id: `${sac.id}-title`,
    content: (
      <TitleSlide
        number={`${sac.id}º Sacramento`}
        title={sac.name}
        subtitle={sac.latinName}
        description={sac.explanation.split('. ')[0] + '.'}
      />
    ),
  })

  // Slide 2: Full explanation
  slides.push({
    id: `${sac.id}-explanation`,
    content: (
      <ExplanationSlide title="O que é" text={sac.explanation} />
    ),
  })

  // Slide 3: Matter, Form, Minister
  slides.push({
    id: `${sac.id}-details`,
    content: (
      <DetailSlide
        title="Elementos Essenciais"
        items={[
          { label: 'Matéria', value: sac.matter },
          { label: 'Forma', value: sac.form },
          { label: 'Ministro', value: sac.minister },
        ]}
      />
    ),
  })

  // Slide 4: Effects
  slides.push({
    id: `${sac.id}-effects`,
    content: (
      <ListSlide title="Efeitos" items={sac.effects} />
    ),
  })

  // Slides 5+: Verses
  sac.verses.forEach((v, i) => {
    slides.push({
      id: `${sac.id}-verse-${i}`,
      content: (
        <VerseSlide
          reference={v.reference}
          text={v.text}
          copyText={`${sac.name}\n\n${v.reference}: "${v.text}"`}
        />
      ),
    })
  })

  return slides
}

export default function SacramentosView() {
  const [selected, setSelected] = useState<Sacramento | null>(null)

  const slides = selected ? buildSacramentoSlides(selected) : []

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* Back */}
      {selected && (
        <header className="relative z-10 w-full pt-6 pb-2 px-4">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="theme-chip inline-flex items-center gap-2 !px-4 !py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sacramentos</span>
            </button>
          </div>
        </header>
      )}

      {/* Title */}
      <section className="relative z-10 text-center px-4 pt-6 pb-6">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {selected ? selected.name : 'Os Sete Sacramentos'}
        </h1>
        {!selected && (
          <p
            className="text-sm max-w-2xl mx-auto"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Sinais eficazes da graça, instituídos por Cristo. Toque para explorar.
          </p>
        )}
        <div className="ornament-divider max-w-xs mx-auto mt-3">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-3xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SACRAMENTOS.map((sac, i) => (
              <button
                key={sac.id}
                onClick={() => setSelected(sac)}
                className="glass-card p-6 text-left transition-all duration-300 hover:scale-[1.02] fade-in cursor-pointer"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span
                  className="text-xs tracking-widest uppercase block mb-2"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  {sac.id}º Sacramento
                </span>
                <h3
                  className="text-lg font-semibold leading-snug"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {sac.name}
                </h3>
                <p
                  className="text-xs mt-1 italic"
                  style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {sac.latinName}
                </p>
                <p
                  className="text-sm mt-2 line-clamp-2"
                  style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                >
                  {sac.explanation.split('. ')[0]}.
                </p>
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
