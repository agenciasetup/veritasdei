'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

const THEME_CHIPS = [
  'Eucaristia',
  'Maria e os Santos',
  'Confissão',
  'Purgatório',
  'Papado',
  'Salvação',
]

interface SearchBoxProps {
  onSearch: (query: string) => void
  isLoading: boolean
}

export default function SearchBox({ onSearch, isLoading }: SearchBoxProps) {
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length >= 3 && !isLoading) {
      onSearch(query.trim())
    }
  }

  function handleChipClick(theme: string) {
    setQuery(theme)
    onSearch(theme)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="O que você quer entender sobre a fé?"
          disabled={isLoading}
          className="w-full px-5 py-4 pr-14 text-lg rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
          style={{
            fontFamily: 'Inter, sans-serif',
            // @ts-expect-error -- CSS custom property for focus ring color
            '--tw-ring-color': '#D4A96A',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || query.trim().length < 3}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-40"
          style={{ backgroundColor: '#5C2D0E', color: 'white' }}
          aria-label="Buscar"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </button>
      </form>

      {isLoading && (
        <p className="mt-3 text-center text-sm text-gray-500 animate-pulse">
          Consultando as fontes...
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {THEME_CHIPS.map((theme) => (
          <button
            key={theme}
            onClick={() => handleChipClick(theme)}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm rounded-full border border-gray-200 bg-white hover:border-gray-400 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  )
}
