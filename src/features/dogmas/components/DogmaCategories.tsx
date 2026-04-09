'use client'

import type { DogmaCategory } from '../data'

interface Props {
  categories: readonly DogmaCategory[]
  onSelect: (id: string) => void
}

export default function DogmaCategories({ categories, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-7xl mx-auto px-4">
      {categories.map((cat, i) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="glass-card p-6 text-left transition-all duration-300 hover:scale-[1.02] fade-in cursor-pointer"
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          {/* Icon */}
          <span
            className="text-3xl mb-4 block w-14 h-14 flex items-center justify-center rounded-xl"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.12)',
            }}
          >
            {cat.icon}
          </span>

          {/* Title */}
          <h3
            className="text-lg font-bold mb-2 leading-tight"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
          >
            {cat.title}
          </h3>

          {/* Description */}
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            {cat.description}
          </p>

          {/* Count */}
          <span
            className="text-xs tracking-wider uppercase"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            {cat.dogmas.length} dogma{cat.dogmas.length > 1 ? 's' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}
