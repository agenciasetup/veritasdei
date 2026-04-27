'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'vd_geo_v1'

export interface GeoCoords {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

export interface GeoLocation extends GeoCoords {
  cidade?: string | null
  estado?: string | null
  label?: string | null
}

export type GeoStatus =
  | 'idle'
  | 'prompting'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error'

interface UseGeolocationReturn {
  coords: GeoLocation | null
  status: GeoStatus
  error: string | null
  request: () => void
  clear: () => void
}

function loadCached(): GeoLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GeoLocation
    // Expira após 24h
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function saveCached(loc: GeoLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
  } catch {
    /* ignore */
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<{ cidade: string | null; estado: string | null }> {
  try {
    const res = await fetch('/api/places/reverse-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    if (!res.ok) return { cidade: null, estado: null }
    const data = await res.json()
    return { cidade: data.cidade ?? null, estado: data.estado ?? null }
  } catch {
    return { cidade: null, estado: null }
  }
}

export function useGeolocation(): UseGeolocationReturn {
  // Hidrata do cache via lazy initializer para evitar setState síncrono num effect.
  // (loadCached é SSR-safe: retorna null quando `window` não existe.)
  const [coords, setCoords] = useState<GeoLocation | null>(() => loadCached())
  const [status, setStatus] = useState<GeoStatus>(() => (loadCached() ? 'granted' : 'idle'))
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable')
      setError('Geolocalização não disponível neste dispositivo.')
      return
    }

    setStatus('prompting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async pos => {
        setStatus('loading')
        const base: GeoCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        }
        const { cidade, estado } = await reverseGeocode(base.latitude, base.longitude)
        const loc: GeoLocation = {
          ...base,
          cidade,
          estado,
          label: cidade && estado ? `${cidade}, ${estado}` : cidade ?? null,
        }
        setCoords(loc)
        setStatus('granted')
        saveCached(loc)
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Você negou a permissão de localização.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('unavailable')
          setError('Não foi possível obter sua localização.')
        } else {
          setStatus('error')
          setError(err.message || 'Erro ao obter localização.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    )
  }, [])

  const clear = useCallback(() => {
    setCoords(null)
    setStatus('idle')
    setError(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return { coords, status, error, request, clear }
}
