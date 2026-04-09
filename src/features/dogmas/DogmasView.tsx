'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DOGMA_CATEGORIES } from './data'
import DogmaCategories from './components/DogmaCategories'
import DogmaCard from './components/DogmaCard'

export default function DogmasView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = selectedId
    ? DOGMA_CATEGORIES.find(c => c.id === selectedId) ?? null
    : null

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* Header */}
      <header className="relative z-10 w-full pt-8 pb-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {selected ? (
            <button
              onClick={() => setSelectedId(null)}
              className="theme-chip flex items-center gap-2 !px-4 !py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <Link href="/" className="theme-chip flex items-center gap-2 !px-4 !py-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Início</span>
            </Link>
          )}
        </div>
      </header>

      {/* Title section */}
      <section className="relative z-10 text-center px-4 pt-4 pb-8">
        <h1
          className="text-3xl md:text-4xl font-bold tracking-wider uppercase mb-3"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {selected ? selected.title : 'Dogmas da Igreja Católica'}
        </h1>
        <p
          className="text-sm max-w-2xl mx-auto"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          {selected
            ? selected.description
            : 'Os 44 dogmas são verdades de fé divinamente reveladas, definidas pela Igreja como infalíveis e imutáveis. Selecione uma categoria.'}
        </p>
        <div className="ornament-divider max-w-xs mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 flex-1 pb-16">
        {!selected ? (
          <DogmaCategories
            categories={DOGMA_CATEGORIES}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            {selected.dogmas.map((dogma, i) => (
              <div key={dogma.id} className="fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <DogmaCard dogma={dogma} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p
          className="text-xs tracking-wider"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.1em' }}
        >
          Veritas Dei — Fonte: Magistério da Igreja Católica
        </p>
      </footer>
    </div>
  )
}
