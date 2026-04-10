import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function extractFromNew(data: Record<string, unknown>) {
  const get = (type: string, useShort = false): string => {
    const comps = data.addressComponents as Array<{ types: string[]; longText?: string; shortText?: string }> | undefined
    const comp = comps?.find(c => c.types.includes(type))
    if (!comp) return ''
    return useShort ? (comp.shortText ?? '') : (comp.longText ?? '')
  }

  const loc = data.location as { latitude?: number; longitude?: number } | undefined

  return {
    rua: get('route'),
    numero: get('street_number'),
    bairro: get('sublocality_level_1') || get('sublocality') || get('neighborhood'),
    cidade: get('administrative_area_level_2') || get('locality'),
    estado: get('administrative_area_level_1', true),
    pais: get('country'),
    cep: get('postal_code'),
    latitude: loc?.latitude ?? null,
    longitude: loc?.longitude ?? null,
    enderecoFormatado: (data.formattedAddress as string) ?? '',
  }
}

function extractFromLegacy(result: Record<string, unknown>) {
  const comps = result.address_components as Array<{ types: string[]; long_name?: string; short_name?: string }> | undefined
  const geo = result.geometry as { location?: { lat?: number; lng?: number } } | undefined

  const get = (type: string, useShort = false): string => {
    const comp = comps?.find(c => c.types.includes(type))
    if (!comp) return ''
    return useShort ? (comp.short_name ?? '') : (comp.long_name ?? '')
  }

  return {
    rua: get('route'),
    numero: get('street_number'),
    bairro: get('sublocality_level_1') || get('sublocality') || get('neighborhood'),
    cidade: get('administrative_area_level_2') || get('locality'),
    estado: get('administrative_area_level_1', true),
    pais: get('country'),
    cep: get('postal_code'),
    latitude: geo?.location?.lat ?? null,
    longitude: geo?.location?.lng ?? null,
    enderecoFormatado: (result.formatted_address as string) ?? '',
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const apiKey = process.env.API_PLACES_NEW
  if (!apiKey) {
    return NextResponse.json({ error: 'API key não configurada.' }, { status: 500 })
  }

  const { placeId, sessionToken } = await req.json()
  if (!placeId) {
    return NextResponse.json({ error: 'placeId é obrigatório.' }, { status: 400 })
  }

  // Try Places API (New) first
  const fields = 'addressComponents,location,formattedAddress'
  let url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`
  if (sessionToken) {
    url += `&sessionToken=${sessionToken}`
  }

  let res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fields,
    },
  })

  if (res.ok) {
    const data = await res.json()
    return NextResponse.json(extractFromNew(data))
  }

  // Fallback to legacy Place Details
  const errText = await res.text()
  console.error('[places/details] New API error:', res.status, errText)

  const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  legacyUrl.searchParams.set('place_id', placeId)
  legacyUrl.searchParams.set('key', apiKey)
  legacyUrl.searchParams.set('language', 'pt-BR')
  legacyUrl.searchParams.set('fields', 'address_components,geometry,formatted_address')
  if (sessionToken) legacyUrl.searchParams.set('sessiontoken', sessionToken)

  res = await fetch(legacyUrl.toString())

  if (!res.ok) {
    const legacyErr = await res.text()
    console.error('[places/details] Legacy API error:', res.status, legacyErr)
    return NextResponse.json({ error: 'Erro ao buscar detalhes.' }, { status: 502 })
  }

  const legacyData = await res.json()
  if (legacyData.status !== 'OK') {
    console.error('[places/details] Legacy status:', legacyData.status, legacyData.error_message)
    return NextResponse.json({ error: legacyData.error_message ?? 'Erro ao buscar detalhes.' }, { status: 502 })
  }

  return NextResponse.json(extractFromLegacy(legacyData.result))
}
