import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { COMMUNITY_EVENTS } from '@/lib/community/events'
import { getCommunityFlags } from '@/lib/community/config'
import { buildMediaVariants, validateUploadCandidates } from '@/lib/community/media'
import { createR2PutUrl, getR2PublicBaseUrl, isR2Configured } from '@/lib/community/r2'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

interface PresignRequestBody {
  files: Array<{
    filename: string
    mime_type: string
    bytes: number
  }>
}

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
}

function pickFileExtension(filename: string, mimeType: string): string {
  const fromName = filename.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,8}$/.test(fromName)) return fromName

  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/avif') return 'avif'
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'heic'

  return 'bin'
}

export async function POST(req: NextRequest) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { user } = access.context

  if (!rateLimit(`community:presign:${user.id}`, 25, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const flags = getCommunityFlags()
  if (!flags.communityEnabled) {
    return NextResponse.json({ error: 'community_disabled' }, { status: 503 })
  }

  if (!isR2Configured()) {
    return NextResponse.json({
      error: 'r2_not_configured',
      detail: 'Configure CF_R2_* no ambiente para habilitar upload de mídia.',
    }, { status: 503 })
  }

  let body: PresignRequestBody
  try {
    body = await req.json() as PresignRequestBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const validation = validateUploadCandidates(body.files ?? [])
  if (!validation.ok) {
    return NextResponse.json({ error: 'invalid_media', detail: validation.error }, { status: 400 })
  }

  const publicBaseUrl = getR2PublicBaseUrl()

  const items = await Promise.all(validation.items.map(async (item) => {
    const safeName = sanitizeFilename(item.filename)
    const extension = pickFileExtension(safeName, item.mime_type)
    const objectKey = `vd/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`
    const uploadUrl = await createR2PutUrl({ objectKey, mimeType: item.mime_type })

    return {
      upload_url: uploadUrl,
      object_key: objectKey,
      filename: item.filename,
      mime_type: item.mime_type,
      bytes: item.bytes,
      kind: item.kind,
      variants: buildMediaVariants(publicBaseUrl, objectKey, item.kind),
    }
  }))

  return NextResponse.json({
    event: COMMUNITY_EVENTS.mediaPresigned,
    items,
  })
}
