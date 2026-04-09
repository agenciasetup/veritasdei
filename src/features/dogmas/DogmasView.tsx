'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { DOGMA_CATEGORIES } from './data'
import type { Dogma } from './data'
import DogmaCategories from './components/DogmaCategories'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide, VerseSlide } from '@/components/ui/SlideContent'

function buildDogmaSlides(dogma: Dogma): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  const firstSentence = dogma.explanation.split('. ')[0] + '.'
  slides.push({
    id: `${dogma.id}-title`,
    content: (
      <TitleSlide
        number={`Dogma ${dogma.id}`}
        title={dogma.title}
        description={firstSentence}
      />
    ),
  })

  slides.push({
    id: `${dogma.id}-explanation`,
    content: (
      <ExplanationSlide
        title="O que a Igreja ensina"
        text={dogma.explanation}
      />
    ),
  })

  dogma.verses.forEach((v, i) => {
    slides.push({
      id: `${dogma.id}-verse-${i}`,
      content: (
        <VerseSlide
          reference={v.reference}
          text={v.text}
          copyText={`${dogma.title}\n\n${v.reference}: "${v.text}"`}
        />
      ),
    })
  })

  return slides
}

export default function DogmasView() {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [selectedDogma, setSelectedDogma] = useState<Dogma | null>(null)

  const selectedCat = selectedCatId
    ? DOGMA_CATEGORIES.find(c => c.id === selectedCatId) ?? null
    : null

  function handleBack() {
    if (selectedDogma) {
      setSelectedDogma(null)
    } else {
      setSelectedCatId(null)
    }
  }

  const slides = selectedDogma ? buildDogmaSlides(selectedDogma) : []

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* Back button */}
      {(selectedCat || selectedDogma) && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{selectedDogma ? selectedCat?.title : 'Categorias'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Page header */}
      <section className="page-header relative z-10">
        <h1>
          {selectedDogma
            ? selectedDogma.title
            : selectedCat
              ? selectedCat.title
              : 'Dogmas da Igreja Católica'}
        </h1>
        {!selectedDogma && (
          <p className="subtitle">
            {selectedCat
              ? `${selectedCat.dogmas.length} dogma${selectedCat.dogmas.length > 1 ? 's' : ''} — toque para explorar`
              : 'Verdades de fé divinamente reveladas. Selecione uma categoria.'}
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 flex-1 pb-16">
        {/* Level 1: Category grid */}
        {!selectedCat && !selectedDogma && (
          <DogmaCategories
            categories={DOGMA_CATEGORIES}
            onSelect={setSelectedCatId}
          />
        )}

        {/* Level 2: Dogma list within category */}
        {selectedCat && !selectedDogma && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {selectedCat.dogmas.map((dogma, i) => (
              <button
                key={dogma.id}
                onClick={() => setSelectedDogma(dogma)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span
                  className="text-xs tracking-[0.15em] uppercase block mb-3"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  Dogma {dogma.id}
                </span>
                <h3
                  className="text-lg font-semibold leading-snug mb-3"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {dogma.title}
                </h3>
                <p
                  className="text-sm leading-relaxed line-clamp-2"
                  style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                >
                  {dogma.explanation.split('. ')[0]}.
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Level 3: Dogma carousel */}
        {selectedDogma && (
          <Carousel slides={slides} onClose={() => setSelectedDogma(null)} />
        )}
      </main>
    </div>
  )
}
