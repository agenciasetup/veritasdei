'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search } from 'lucide-react'

export interface CityResult {
  cidade: string
  estado: string
  latitude: number | null
  longitude: number | null
}

interface Suggestion {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface Props {
  value: string
  onChange: (v: string) => void
  onSelect: (city: CityResult) => void
  placeholder?: string
  biasLatitude?: number | null
  biasLongitude?: number | null
}

function generateSessionToken() {
  return crypto.randomUUID()
}

export default function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Cidade',
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const sessionTokenRef = useRef(generateSessionToken())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2) {
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
          input: input.trim(),
          sessionToken: sessionTokenRef.current,
          // The API route doesn't currently use types, but we pass it in
          // case we extend the server later. Also the server already passes
          // language pt-BR.
          includedPrimaryTypes: ['locality', 'administrative_area_level_2'],
        }),
      })
      if (!res.ok) {
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, fetchSuggestions])

  const handleSelect = async (s: Suggestion) => {
    onChange(s.mainText || s.description)
    setOpen(false)
    setSuggestions([])
    setFetching(true)
    try {
      const res = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: s.placeId,
          sessionToken: sessionTokenRef.current,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onSelect({
          cidade: data.cidade ?? s.mainText ?? '',
          estado: data.estado ?? '',
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        })
      }
    } catch {
      /* ignore */
    } finally {
      setFetching(false)
      sessionTokenRef.current = generateSessionToken()
    }
  }

  // Fecha ao clicar fora
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
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder={placeholder}
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
          {suggestions.map(s => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
              style={{
                borderBottom: '1px solid rgba(201,168,76,0.08)',
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
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
