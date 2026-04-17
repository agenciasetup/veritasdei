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

export async function POST(req: NextRequest) {
  // Gate: endpoint billable (Google Geocoding API). Exige auth + rate limit.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  if (!(await rateLimit(`places-rev:${user.id}`, 20, 60_000))) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const apiKey = process.env.API_PLACES_NEW
  if (!apiKey) {
    return NextResponse.json({ error: 'API key não configurada.' }, { status: 500 })
  }

  const { latitude, longitude } = (await req.json()) as {
    latitude?: number
    longitude?: number
  }

  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90  || latitude > 90  ||
    typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return NextResponse.json({ error: 'latitude/longitude inválidos.' }, { status: 400 })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${latitude},${longitude}`)
  url.searchParams.set('language', 'pt-BR')
  url.searchParams.set('result_type', 'locality|administrative_area_level_2|administrative_area_level_1')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const txt = await res.text()
    console.error('[reverse-geocode] erro:', res.status, txt)
    return NextResponse.json({ error: 'Erro no geocoding.' }, { status: 502 })
  }

  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) {
    return NextResponse.json({ cidade: null, estado: null })
  }

  // Procura o melhor resultado (prioriza locality/adm_level_2)
  let cidade: string | null = null
  let estado: string | null = null

  for (const result of data.results as { address_components: AddressComponent[] }[]) {
    const comps = result.address_components
    if (!cidade) {
      cidade = pickComponent(comps, ['administrative_area_level_2', 'locality'])
    }
    if (!estado) {
      estado = pickComponent(comps, ['administrative_area_level_1'], true)
    }
    if (cidade && estado) break
  }

  return NextResponse.json({ cidade, estado, latitude, longitude })
}
