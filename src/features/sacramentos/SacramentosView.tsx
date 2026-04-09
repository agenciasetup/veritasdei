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

  slides.push({
    id: `${sac.id}-explanation`,
    content: (
      <ExplanationSlide title="O que é" text={sac.explanation} />
    ),
  })

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

  slides.push({
    id: `${sac.id}-effects`,
    content: (
      <ListSlide title="Efeitos" items={sac.effects} />
    ),
  })

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

      {selected && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sacramentos</span>
            </button>
          </div>
        </header>
      )}

      <section className="page-header relative z-10">
        <h1>
          {selected ? selected.name : 'Os Sete Sacramentos'}
        </h1>
        {!selected && (
          <p className="subtitle">
            Sinais eficazes da graça, instituídos por Cristo. Toque para explorar.
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {SACRAMENTOS.map((sac, i) => (
              <button
                key={sac.id}
                onClick={() => setSelected(sac)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span
                  className="text-xs tracking-[0.15em] uppercase block mb-3"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  {sac.id}º Sacramento
                </span>
                <h3
                  className="text-xl font-semibold leading-snug mb-2"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {sac.name}
                </h3>
                <p
                  className="text-sm italic mb-3"
                  style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {sac.latinName}
                </p>
                <p
                  className="text-sm leading-relaxed line-clamp-2"
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
