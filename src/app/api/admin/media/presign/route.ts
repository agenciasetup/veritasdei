/**
 * /api/admin/media/presign — gera URLs presigned R2 para uploads de admin.
 *
 * Difere do /api/comunidade/media/presign:
 *  - Não exige plano premium, exige `profile.role = 'admin'`.
 *  - Aceita um `prefix` (ex.: `educa/banners`, `educa/covers`) pra
 *    organizar os assets no bucket por seção administrativa.
 *  - Aceita uma `variant` (`web` | `mobile`) opcional, embutida na chave
 *    pra deixar o bucket auditável.
 *
 * O cliente recebe `upload_url` (PUT direto no R2) + `variants` com URLs
 * já transformadas pelo Cloudflare Image Resizing (thumb/feed/detail).
 */
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { buildMediaVariants, validateUploadCandidates } from '@/lib/community/media'
import { createR2PutUrl, getR2PublicBaseUrl, isR2Configured } from '@/lib/community/r2'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Variant = 'web' | 'mobile'

interface PresignBody {
  files: Array<{ filename: string; mime_type: string; bytes: number }>
  prefix?: string
  variant?: Variant
}

function sanitizePrefix(raw: string | undefined): string {
  if (!raw) return 'misc'
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 60) || 'misc'
}

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
}

function pickExtension(filename: string, mime: string): string {
  const fromName = filename.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,8}$/.test(fromName)) return fromName
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/avif') return 'avif'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/heic' || mime === 'image/heif') return 'heic'
  return 'bin'
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (!(await rateLimit(`admin:presign:${user.id}`, 60, 60_000))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  if (!isR2Configured()) {
    return NextResponse.json({
      error: 'r2_not_configured',
      detail: 'Configure CF_R2_* para habilitar upload de mídia.',
    }, { status: 503 })
  }

  let body: PresignBody
  try {
    body = (await req.json()) as PresignBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const validation = validateUploadCandidates(body.files ?? [])
  if (!validation.ok) {
    return NextResponse.json({ error: 'invalid_media', detail: validation.error }, { status: 400 })
  }

  const prefix = sanitizePrefix(body.prefix)
  const variant: Variant | null =
    body.variant === 'web' || body.variant === 'mobile' ? body.variant : null

  const publicBaseUrl = getR2PublicBaseUrl()
  const today = new Date().toISOString().slice(0, 10)

  const trimmedBase = publicBaseUrl.endsWith('/')
    ? publicBaseUrl.slice(0, -1)
    : publicBaseUrl

  const items = await Promise.all(validation.items.map(async (item) => {
    const safeName = sanitizeFilename(item.filename)
    const ext = pickExtension(safeName, item.mime_type)
    const variantTag = variant ? `${variant}-` : ''
    const objectKey = `${prefix}/${today}/${variantTag}${randomUUID()}.${ext}`
    const uploadUrl = await createR2PutUrl({ objectKey, mimeType: item.mime_type })

    // public_url é a URL crua do R2 (sem /cdn-cgi/image/transform). Usado
    // pelos uploads admin (capas/banners) onde não queremos o redimensiona-
    // mento da Cloudflare — a fonte é entregue como está. `variants` segue
    // disponível pra usos onde o transform faz sentido (posts da comunidade).
    return {
      upload_url: uploadUrl,
      object_key: objectKey,
      public_url: `${trimmedBase}/${objectKey}`,
      filename: item.filename,
      mime_type: item.mime_type,
      bytes: item.bytes,
      kind: item.kind,
      variant,
      variants: buildMediaVariants(publicBaseUrl, objectKey, item.kind),
    }
  }))

  return NextResponse.json({ items })
}
