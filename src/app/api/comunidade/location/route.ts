import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

interface AddressComponent {
  types: string[]
  long_name?: string
  short_name?: string
  longText?: string
  shortText?: string
}

function pickComponent(
  components: AddressComponent[] | undefined,
  types: string[],
  useShort = false,
): string | null {
  if (!components) return null
  for (const t of types) {
    const comp = components.find(c => c.types.includes(t))
    if (comp) {
      if (useShort) return comp.short_name ?? comp.shortText ?? null
      return comp.long_name ?? comp.longText ?? null
    }
  }
  return null
}

async function reverseGeocodeGoogle(lat: number, lng: number): Promise<{ city: string | null; state: string | null } | null> {
  const apiKey = process.env.API_PLACES_NEW
  if (!apiKey) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${lat},${lng}`)
  url.searchParams.set('language', 'pt-BR')
  url.searchParams.set('result_type', 'locality|administrative_area_level_2|administrative_area_level_1')
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = await res.json() as { status?: string; results?: Array<{ address_components: AddressComponent[] }> }
    if (data.status !== 'OK' || !data.results?.length) return null
    let city: string | null = null
    let state: string | null = null
    for (const result of data.results) {
      const comps = result.address_components
      if (!city) city = pickComponent(comps, ['administrative_area_level_2', 'locality'])
      if (!state) state = pickComponent(comps, ['administrative_area_level_1'], true)
      if (city && state) break
    }
    return { city, state }
  } catch {
    return null
  }
}

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<{ city: string | null; state: string | null } | null> {
  // Fallback grátis via OpenStreetMap. Limite ~1 req/s, já temos rate limit
  // upstream. User-Agent é obrigatório pela política do Nominatim.
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('format', 'json')
    url.searchParams.set('accept-language', 'pt-BR')
    url.searchParams.set('zoom', '10')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'VeritasDei/1.0 (contato@veritasdei.com.br)' },
    })
    if (!res.ok) return null

    const data = await res.json() as {
      address?: {
        city?: string
        town?: string
        village?: string
        municipality?: string
        county?: string
        state?: string
        'ISO3166-2-lvl4'?: string
      }
    }
    const addr = data.address ?? {}
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? null
    const stateIso = addr['ISO3166-2-lvl4'] ?? ''
    // Ex: "BR-SP" → "SP"
    const stateShort = stateIso.includes('-') ? stateIso.split('-').pop() ?? null : null
    return { city, state: stateShort ?? addr.state ?? null }
  } catch {
    return null
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string | null; state: string | null }> {
  const google = await reverseGeocodeGoogle(lat, lng)
  if (google && (google.city || google.state)) return google
  const osm = await reverseGeocodeNominatim(lat, lng)
  if (osm) return osm
  return { city: null, state: null }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  if (!rateLimit(`community:location:${user.id}`, 12, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let payload: { latitude?: number; longitude?: number; city?: string | null; state?: string | null } = {}
  try {
    payload = await req.json() as typeof payload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const lat = payload.latitude
  const lng = payload.longitude

  if (
    typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90
    || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    return NextResponse.json({ error: 'invalid_coords' }, { status: 400 })
  }

  // Client pode mandar city/state já resolvidos (do próprio geocoder do browser
  // quando disponível). Senão o servidor resolve.
  const clientCity = typeof payload.city === 'string' && payload.city.trim() ? payload.city.trim().slice(0, 120) : null
  const clientState = typeof payload.state === 'string' && payload.state.trim() ? payload.state.trim().slice(0, 60) : null

  let city = clientCity
  let state = clientState
  if (!city || !state) {
    const resolved = await reverseGeocode(lat, lng)
    city = city ?? resolved.city
    state = state ?? resolved.state
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      location_lat: lat,
      location_lng: lng,
      location_city: city,
      location_state: state,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({
    latitude: lat,
    longitude: lng,
    city,
    state,
  })
}

export async function DELETE() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      location_lat: null,
      location_lng: null,
      location_city: null,
      location_state: null,
      location_updated_at: null,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
