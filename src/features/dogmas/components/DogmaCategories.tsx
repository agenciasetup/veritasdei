'use client'

import type { DogmaCategory } from '../data'

interface Props {
  categories: readonly DogmaCategory[]
  onSelect: (id: string) => void
}

export default function DogmaCategories({ categories, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 w-full max-w-7xl mx-auto px-4 md:px-8">
      {categories.map((cat, i) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="feature-card text-left fade-in"
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          {/* Icon */}
          <span
            className="text-3xl mb-5 block w-16 h-16 flex items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.12)',
            }}
          >
            {cat.icon}
          </span>

          {/* Title */}
          <h3
            className="text-lg font-bold mb-3 leading-tight"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
          >
            {cat.title}
          </h3>

          {/* Description */}
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            {cat.description}
          </p>

          {/* Count */}
          <span
            className="text-xs tracking-[0.1em] uppercase"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            {cat.dogmas.length} dogma{cat.dogmas.length > 1 ? 's' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}
