'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'

export interface AddressData {
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  cep: string
  latitude: number | null
  longitude: number | null
  enderecoFormatado: string
}

interface Suggestion {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface Props {
  onSelect: (data: AddressData) => void
}

function generateSessionToken() {
  return crypto.randomUUID()
}

export default function GooglePlacesAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const sessionTokenRef = useRef(generateSessionToken())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('[GooglePlacesAutocomplete]', res.status, errData)
        setSuggestions([])
        return
      }

      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      setOpen((data.suggestions ?? []).length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
  }

  const handleSelect = async (suggestion: Suggestion) => {
    setQuery(suggestion.description)
    setOpen(false)
    setSuggestions([])
    setFetching(true)

    try {
      const res = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: suggestion.placeId,
          sessionToken: sessionTokenRef.current,
        }),
      })

      if (res.ok) {
        const data: AddressData = await res.json()
        onSelect(data)
      }
    } catch {
      // silently fail — user can fill fields manually
    } finally {
      setFetching(false)
      sessionTokenRef.current = generateSessionToken()
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {(loading || fetching) ? (
          <Loader2
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
            style={{ color: '#C9A84C' }}
          />
        ) : (
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#C9A84C' }}
          />
        )}
        <input
          type="text"
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder="Digite o endereço para buscar..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
          }}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: '#141210',
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
              style={{
                borderBottom: '1px solid rgba(201,168,76,0.08)',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <MapPin
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: '#C9A84C' }}
              />
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: '#F2EDE4' }}>
                  {s.mainText}
                </p>
                <p className="text-xs truncate" style={{ color: '#7A7368' }}>
                  {s.secondaryText}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
