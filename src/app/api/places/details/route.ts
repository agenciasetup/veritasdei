import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

  const fields = 'addressComponents,location,formattedAddress'
  let url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`
  if (sessionToken) {
    url += `&sessionToken=${sessionToken}`
  }

  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fields,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[places/details] Google API error:', res.status, text)
    return NextResponse.json({ error: 'Erro ao buscar detalhes.' }, { status: 502 })
  }

  const data = await res.json()

  const get = (type: string, useShort = false): string => {
    const comp = data.addressComponents?.find(
      (c: { types: string[] }) => c.types.includes(type),
    )
    if (!comp) return ''
    return useShort ? (comp.shortText ?? '') : (comp.longText ?? '')
  }

  return NextResponse.json({
    rua: get('route'),
    numero: get('street_number'),
    bairro: get('sublocality_level_1') || get('sublocality') || get('neighborhood'),
    cidade: get('administrative_area_level_2') || get('locality'),
    estado: get('administrative_area_level_1', true),
    pais: get('country'),
    cep: get('postal_code'),
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    enderecoFormatado: data.formattedAddress ?? '',
  })
}
