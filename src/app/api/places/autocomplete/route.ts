import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Gate: só usuário autenticado. Endpoint faz chamada billable ao Google Maps.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  // 30 sugestões/min por usuário cobre digitação normal sem abrir espaço para
  // abuso serial da API billable do Google.
  if (!(await rateLimit(`places-ac:${user.id}`, 30, 60_000))) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const apiKey = process.env.API_PLACES_NEW
  if (!apiKey) {
    return NextResponse.json({ error: 'API key não configurada.' }, { status: 500 })
  }

  const { input, sessionToken } = await req.json()
  if (!input || typeof input !== 'string' || input.trim().length < 3) {
    return NextResponse.json({ suggestions: [] })
  }
  if (input.length > 200) {
    return NextResponse.json({ error: 'Input muito longo.' }, { status: 400 })
  }
  if (typeof sessionToken !== 'undefined' && (typeof sessionToken !== 'string' || sessionToken.length > 128)) {
    return NextResponse.json({ error: 'sessionToken inválido.' }, { status: 400 })
  }

  // Try Places API (New) first, fallback to legacy
  const body: Record<string, unknown> = {
    input: input.trim(),
    languageCode: 'pt-BR',
  }
  if (sessionToken) {
    body.sessionToken = sessionToken
  }

  let res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  })

  // If New API fails, try legacy Places Autocomplete
  if (!res.ok) {
    const errText = await res.text()
    console.error('[places/autocomplete] New API error:', res.status, errText)

    const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    legacyUrl.searchParams.set('input', input.trim())
    legacyUrl.searchParams.set('key', apiKey)
    legacyUrl.searchParams.set('language', 'pt-BR')
    if (sessionToken) legacyUrl.searchParams.set('sessiontoken', sessionToken)

    res = await fetch(legacyUrl.toString())

    if (!res.ok) {
      const legacyErr = await res.text()
      console.error('[places/autocomplete] Legacy API error:', res.status, legacyErr)
      return NextResponse.json({ error: 'Erro na busca de endereço.' }, { status: 502 })
    }

    // Legacy API response format is different
    const legacyData = await res.json()
    if (legacyData.status !== 'OK' && legacyData.status !== 'ZERO_RESULTS') {
      console.error('[places/autocomplete] Legacy API status:', legacyData.status, legacyData.error_message)
      return NextResponse.json({ error: 'Erro na busca.' }, { status: 502 })
    }

    const legacySuggestions = (legacyData.predictions ?? []).map(
      (p: { place_id: string; description: string; structured_formatting?: { main_text?: string; secondary_text?: string } }) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text ?? '',
        secondaryText: p.structured_formatting?.secondary_text ?? '',
      }),
    )

    return NextResponse.json({ suggestions: legacySuggestions, api: 'legacy' })
  }

  const data = await res.json()

  const suggestions = (data.suggestions ?? [])
    .filter((s: Record<string, unknown>) => s.placePrediction)
    .map((s: { placePrediction: { placeId: string; text: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }) => ({
      placeId: s.placePrediction.placeId,
      description: s.placePrediction.text.text,
      mainText: s.placePrediction.structuredFormat?.mainText?.text ?? '',
      secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
    }))

  return NextResponse.json({ suggestions })
}
