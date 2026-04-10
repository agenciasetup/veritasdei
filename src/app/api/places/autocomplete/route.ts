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

  const { input, sessionToken } = await req.json()
  if (!input || typeof input !== 'string' || input.trim().length < 3) {
    return NextResponse.json({ suggestions: [] })
  }

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify({
      input: input.trim(),
      sessionToken,
      languageCode: 'pt-BR',
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise', 'route', 'church'],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[places/autocomplete] Google API error:', res.status, text)
    return NextResponse.json({ error: 'Erro na busca de endereço.' }, { status: 502 })
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
