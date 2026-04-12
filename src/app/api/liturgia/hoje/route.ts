import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { LiturgiaDia } from '@/types/liturgia'

/**
 * GET /api/liturgia/hoje?data=YYYY-MM-DD
 *
 * Fluxo:
 *  1. Lê `public.liturgia_dia` (RLS público, qualquer usuário lê).
 *  2. Se existir e < 24h de idade → devolve.
 *  3. Se não → chama a Edge Function `liturgia-scrape` que cacheia e devolve.
 *  4. Se o scrape também falhar → 503 com dica de usar fallback local.
 *
 * O front-end sempre tem o tempo/cor calculado localmente como fallback,
 * então "sem conexão" nunca quebra o card.
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const data = url.searchParams.get('data') ?? todayInBrazil()

  const supabase = await createServerSupabaseClient()

  // 1. Cache read (RLS public select policy applied in migration)
  const { data: cached } = await supabase
    .from('liturgia_dia')
    .select('*')
    .eq('data', data)
    .maybeSingle()

  if (cached) {
    const ageMs = Date.now() - new Date(cached.coletado_em).getTime()
    if (ageMs < CACHE_TTL_MS) {
      return NextResponse.json({ ...cached, cached: true } satisfies LiturgiaDia, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      })
    }
  }

  // 2. Trigger scrape via Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    if (cached) {
      return NextResponse.json({ ...cached, cached: true, stale: true } satisfies LiturgiaDia)
    }
    return NextResponse.json({ error: 'supabase_url_missing' }, { status: 500 })
  }

  try {
    const fnRes = await fetch(`${supabaseUrl}/functions/v1/liturgia-scrape?data=${data}`, {
      headers: {
        // Anon key is enough: function has verify_jwt: false
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      },
      // Revalidate on the server cache each hour.
      next: { revalidate: 3600 },
    })
    if (!fnRes.ok) throw new Error(`scrape_status_${fnRes.status}`)
    const fresh = (await fnRes.json()) as LiturgiaDia
    return NextResponse.json(fresh, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    if (cached) {
      return NextResponse.json({ ...cached, cached: true, stale: true } satisfies LiturgiaDia)
    }
    return NextResponse.json(
      { error: 'liturgia_indisponivel', detail: String(err) },
      { status: 503 },
    )
  }
}
