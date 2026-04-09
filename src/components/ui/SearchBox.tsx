'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

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
    <div className="w-full max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: '#7A7368' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você quer entender sobre a fé?"
            disabled={isLoading}
            className="search-input w-full pl-14 pr-16 py-5 text-lg rounded-2xl"
          />
          <button
            type="submit"
            disabled={isLoading || query.trim().length < 3}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all duration-300 disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              color: '#0A0A0A',
            }}
            aria-label="Buscar"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="mt-5 text-center">
          <p
            className="text-sm animate-pulse"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            Consultando as fontes sagradas...
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        {THEME_CHIPS.map((theme) => (
          <button
            key={theme}
            onClick={() => handleChipClick(theme)}
            disabled={isLoading}
            className="theme-chip"
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  )
}
