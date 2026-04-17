import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

interface UpdateProfilePayload {
  name?: string | null
  public_handle?: string | null
  bio_short?: string | null
  cover_image_url?: string | null
  profile_image_url?: string | null
  external_links?: Array<{ label: string; url: string }>
}

function sanitizeExternalLinks(input: unknown): Array<{ label: string; url: string }> | null {
  if (!Array.isArray(input)) return null
  if (input.length > 5) return null

  const result: Array<{ label: string; url: string }> = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return null
    const label = (raw as { label?: unknown }).label
    const url = (raw as { url?: unknown }).url
    if (typeof label !== 'string' || typeof url !== 'string') return null
    const trimmedLabel = label.trim().slice(0, 40)
    const trimmedUrl = url.trim().slice(0, 200)
    if (!trimmedLabel || !trimmedUrl) continue
    // URL precisa ser http/https.
    try {
      const u = new URL(trimmedUrl)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    } catch {
      return null
    }
    result.push({ label: trimmedLabel, url: trimmedUrl })
  }
  return result
}

export async function GET() {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, public_handle, user_number, bio_short, cover_image_url, profile_image_url, external_links, community_role, verified, verified_at, cidade, estado, diocese, paroquia, comunidade, vocacao')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: 'profile_not_found', detail: error?.message },
      { status: 404 },
    )
  }

  return NextResponse.json({ profile: data })
}

export async function PUT(req: NextRequest) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  if (!rateLimit(`community:profile:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let payload: UpdateProfilePayload
  try {
    payload = await req.json() as UpdateProfilePayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    if (payload.name !== null && typeof payload.name !== 'string') {
      return NextResponse.json({ error: 'invalid_name' }, { status: 400 })
    }
    const name = payload.name === null ? null : payload.name.trim().slice(0, 60)
    if (name !== null && name.length < 2) {
      return NextResponse.json({ error: 'name_too_short' }, { status: 400 })
    }
    patch.name = name
  }

  if (payload.public_handle !== undefined) {
    const raw = payload.public_handle === null ? null : String(payload.public_handle).trim().toLowerCase()
    if (raw !== null && !/^[a-z0-9_]{3,20}$/.test(raw)) {
      return NextResponse.json({ error: 'invalid_handle' }, { status: 400 })
    }
    if (raw !== null) {
      // Checa disponibilidade.
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('public_handle', raw)
        .neq('id', user.id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: 'handle_taken' }, { status: 409 })
      }
    }
    patch.public_handle = raw
  }

  if (payload.bio_short !== undefined) {
    const raw = payload.bio_short === null ? null : String(payload.bio_short)
    if (raw !== null && raw.length > 160) {
      return NextResponse.json({ error: 'bio_too_long' }, { status: 400 })
    }
    patch.bio_short = raw === null ? null : raw.trim() || null
  }

  if (payload.cover_image_url !== undefined) {
    const raw = payload.cover_image_url === null ? null : String(payload.cover_image_url).trim() || null
    if (raw !== null) {
      try {
        const u = new URL(raw)
        if (u.protocol !== 'https:') {
          return NextResponse.json({ error: 'cover_must_be_https' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'invalid_cover_url' }, { status: 400 })
      }
    }
    patch.cover_image_url = raw
  }

  if (payload.profile_image_url !== undefined) {
    const raw = payload.profile_image_url === null ? null : String(payload.profile_image_url).trim() || null
    if (raw !== null) {
      try {
        const u = new URL(raw)
        if (u.protocol !== 'https:') {
          return NextResponse.json({ error: 'avatar_must_be_https' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'invalid_avatar_url' }, { status: 400 })
      }
    }
    patch.profile_image_url = raw
  }

  if (payload.external_links !== undefined) {
    const links = sanitizeExternalLinks(payload.external_links)
    if (links === null) {
      return NextResponse.json({ error: 'invalid_external_links' }, { status: 400 })
    }
    patch.external_links = links
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'empty_patch' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select('id, name, public_handle, bio_short, cover_image_url, profile_image_url, external_links')
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: 'update_failed', detail: updateError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ profile: updated })
}
