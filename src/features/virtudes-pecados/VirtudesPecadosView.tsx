'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { GROUPS } from './data'
import type { Item, ItemGroup } from './data'
import Carousel from '@/components/ui/Carousel'
import type { CarouselSlide } from '@/components/ui/Carousel'
import { TitleSlide, ExplanationSlide, VerseSlide } from '@/components/ui/SlideContent'

function buildSlides(item: Item, groupTitle: string): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  slides.push({
    id: `${item.id}-title`,
    content: (
      <TitleSlide
        number={groupTitle}
        title={item.name}
        subtitle={item.opposite ? `Oposto: ${item.opposite}` : undefined}
        description={item.explanation.split('. ')[0] + '.'}
      />
    ),
  })

  slides.push({
    id: `${item.id}-explanation`,
    content: <ExplanationSlide title="O que é" text={item.explanation} />,
  })

  item.verses.forEach((v, i) => {
    slides.push({
      id: `${item.id}-verse-${i}`,
      content: (
        <VerseSlide
          reference={v.reference}
          text={v.text}
          copyText={`${item.name}\n\n${v.reference}: "${v.text}"`}
        />
      ),
    })
  })

  return slides
}

export default function VirtudesPecadosView() {
  const [selectedGroup, setSelectedGroup] = useState<ItemGroup | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const slides = selectedItem && selectedGroup ? buildSlides(selectedItem, selectedGroup.title) : []

  function handleBack() {
    if (selectedItem) setSelectedItem(null)
    else setSelectedGroup(null)
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {(selectedGroup || selectedItem) && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{selectedItem ? selectedGroup?.title : 'Categorias'}</span>
            </button>
          </div>
        </header>
      )}

      <section className="page-header relative z-10">
        <h1>
          {selectedItem
            ? selectedItem.name
            : selectedGroup
              ? selectedGroup.title
              : 'Virtudes e Pecados'}
        </h1>
        {!selectedItem && (
          <p className="subtitle">
            {selectedGroup ? selectedGroup.description : 'As virtudes que nos aproximam de Deus e os vícios que nos afastam.'}
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16">
        {!selectedGroup && !selectedItem && (
          <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
            {GROUPS.map((g, i) => (
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
                <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                  {g.items.length} itens
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedGroup && !selectedItem && (
          <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {selectedGroup.items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                  {item.name}
                </h3>
                {item.opposite && (
                  <p className="text-sm mb-3" style={{ color: '#8B3145', fontFamily: 'Poppins, sans-serif' }}>
                    Oposto: {item.opposite}
                  </p>
                )}
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                  {item.explanation.split('. ')[0]}.
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedItem && (
          <Carousel slides={slides} onClose={() => setSelectedItem(null)} />
        )}
      </main>
    </div>
  )
}
