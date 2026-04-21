import { NextResponse, type NextRequest } from 'next/server'
import { getR2PublicBaseUrl } from '@/lib/community/r2'

/**
 * Proxy same-origin pras imagens do CDN. Necessário porque o
 * `/cdn-cgi/image/` da Cloudflare não retorna
 * `Access-Control-Allow-Origin`, então o canvas do compartilhamento
 * não consegue desenhar a imagem sem taint (e `toBlob` falha em
 * canvas tainted). Buscando via este proxy, a resposta vem do mesmo
 * origin da app e o CORS deixa de ser um problema.
 *
 * Só aceita URLs que começam com `CF_R2_PUBLIC_BASE_URL` pra evitar
 * abuso como SSRF.
 */

export const runtime = 'nodejs'
// Permite cache da CDN da Vercel pro mesmo URL de origem.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const srcUrl = request.nextUrl.searchParams.get('url')
  if (!srcUrl) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 })
  }

  // Normaliza e valida pra evitar SSRF.
  let parsed: URL
  try {
    parsed = new URL(srcUrl)
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  // Monta allowlist: R2 público (variants das mídias do feed) +
  // Supabase Storage (profile_image_url, covers, reliquias).
  const allowedOrigins = new Set<string>()
  try { allowedOrigins.add(new URL(getR2PublicBaseUrl()).origin) } catch { /* noop */ }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try { allowedOrigins.add(new URL(supabaseUrl).origin) } catch { /* noop */ }
  }
  if (allowedOrigins.size === 0) {
    return NextResponse.json({ error: 'cdn_not_configured' }, { status: 503 })
  }

  if (!allowedOrigins.has(parsed.origin)) {
    return NextResponse.json({ error: 'forbidden_host' }, { status: 403 })
  }

  let upstream: Response
  try {
    upstream = await fetch(parsed.toString(), {
      // Sem credenciais; respeita CDN como viewer anônimo.
      redirect: 'follow',
    })
  } catch {
    return NextResponse.json({ error: 'upstream_fetch_failed' }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: 'upstream_error', status: upstream.status },
      { status: 502 },
    )
  }

  const headers = new Headers()
  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  headers.set('content-type', contentType)
  const contentLength = upstream.headers.get('content-length')
  if (contentLength) headers.set('content-length', contentLength)
  // Cache-control curto: as imagens do CDN já são versionadas por object_key.
  headers.set('cache-control', 'public, max-age=3600, stale-while-revalidate=86400')

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  })
}
