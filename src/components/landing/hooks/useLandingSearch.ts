'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useGeolocation } from '@/hooks/useGeolocation'
import { createClient } from '@/lib/supabase/client'
import { formatDistance } from '@/lib/utils/geo'
import { sanitizeIlike } from '@/lib/utils/sanitize'
import type { Paroquia, ParoquiaNearby } from '@/types/paroquia'

const SEARCH_SELECT = 'id, nome, diocese, cidade, estado, verificado, status'

interface Stats {
  catolicos: number
  convertidos: number
  igrejas: number
}

export type SearchPhase = 'idle' | 'loading' | 'success' | 'empty'

export interface UseLandingSearchReturn {
  geo: ReturnType<typeof useGeolocation>
  stats: Stats
  searchCity: string
  setSearchCity: (v: string) => void
  handleSearch: () => Promise<void>
  searching: boolean
  searched: boolean
  phase: SearchPhase
  geoResults: ParoquiaNearby[]
  searchResults: Paroquia[]
  nearbyResults: Paroquia[]
  heroChips: Array<{ id: string; label: string; meta: string; href: string }>
  clearGeo: () => void
}

export function useLandingSearch(): UseLandingSearchReturn {
  const geo = useGeolocation()

  const [stats, setStats] = useState<Stats>({ catolicos: 0, convertidos: 0, igrejas: 0 })
  const [searchCity, setSearchCity] = useState('')
  const [searchResults, setSearchResults] = useState<Paroquia[]>([])
  const [nearbyResults, setNearbyResults] = useState<Paroquia[]>([])
  const [geoResults, setGeoResults] = useState<ParoquiaNearby[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    supabase
      .rpc('get_landing_stats')
      .then((res: { data: Stats[] | null; error: unknown }) => {
        if (res.error || !res.data || res.data.length === 0) return
        const row = res.data[0]
        setStats({
          catolicos: Number(row.catolicos) || 0,
          convertidos: Number(row.convertidos) || 0,
          igrejas: Number(row.igrejas) || 0,
        })
      })
      .catch(() => {
        // Stats são opcionais.
      })
  }, [])

  const handleSearch = useCallback(async () => {
    const supabase = createClient()
    if (!supabase || !searchCity.trim()) return

    setSearching(true)
    setSearched(true)
    setGeoResults([])

    const termo = searchCity.trim()

    const { data } = await supabase
      .from('paroquias')
      .select(SEARCH_SELECT)
      .eq('status', 'aprovada')
      .ilike('cidade', `%${sanitizeIlike(termo)}%`)
      .order('verificado', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)

    const exact = (data as Paroquia[]) ?? []
    setSearchResults(exact)

    if (exact.length > 0) {
      const uf = exact[0].estado
      const cidadesDigitadas = new Set(exact.map(p => p.cidade.toLowerCase()))
      const { data: nearby } = await supabase
        .from('paroquias')
        .select(SEARCH_SELECT)
        .eq('status', 'aprovada')
        .eq('estado', uf)
        .order('verificado', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      const filtered = ((nearby as Paroquia[]) ?? [])
        .filter(p => !cidadesDigitadas.has(p.cidade.toLowerCase()))
        .slice(0, 8)
      setNearbyResults(filtered)
    } else {
      setNearbyResults([])
    }

    setSearching(false)
  }, [searchCity])

  useEffect(() => {
    if (geo.status !== 'granted' || !geo.coords) return

    const supabase = createClient()
    if (!supabase) return

    let cancelled = false
    setSearching(true)
    setSearched(true)
    setSearchResults([])
    setNearbyResults([])

    supabase
      .rpc('paroquias_nearby', {
        p_lat: geo.coords.latitude,
        p_lng: geo.coords.longitude,
        p_radius_km: 60,
        p_limit: 12,
      })
      .then((res: { data: ParoquiaNearby[] | null; error: unknown }) => {
        if (cancelled) return
        setGeoResults(res.data ?? [])
        if (geo.coords?.cidade && !searchCity) {
          setSearchCity(geo.coords.cidade)
        }
        setSearching(false)
      })
      .catch(() => {
        if (!cancelled) setSearching(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.coords?.latitude, geo.coords?.longitude])

  const clearGeo = useCallback(() => {
    geo.clear()
    setGeoResults([])
    setSearched(false)
  }, [geo])

  const phase: SearchPhase = useMemo(() => {
    if (searching) return 'loading'
    if (!searched) return 'idle'
    if (geoResults.length > 0 || searchResults.length > 0 || nearbyResults.length > 0) return 'success'
    return 'empty'
  }, [searching, searched, geoResults, searchResults, nearbyResults])

  const heroChips = useMemo(() => {
    const fromGeo = geoResults.slice(0, 4).map(p => ({
      id: p.id,
      label: p.nome,
      meta: formatDistance(p.distancia_km),
      href: `/paroquias/${p.id}`,
    }))
    return fromGeo
  }, [geoResults])

  return {
    geo,
    stats,
    searchCity,
    setSearchCity,
    handleSearch,
    searching,
    searched,
    phase,
    geoResults,
    searchResults,
    nearbyResults,
    heroChips,
    clearGeo,
  }
}
