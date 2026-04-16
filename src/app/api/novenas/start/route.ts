import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NOVENAS_CATALOG } from '@/features/novenas/data/catalog'

/**
 * POST /api/novenas/start
 *
 * Inicia uma novena (builtin ou custom) para o usuário autenticado.
 *
 * body: {
 *   builtin_slug?: string,
 *   custom_novena_id?: string,
 *   intention_id?: string | null
 * }
 *
 * XOR: exatamente um de builtin_slug ou custom_novena_id.
 */

const VALID_SLUGS = new Set(NOVENAS_CATALOG.map(n => n.slug))

interface StartBody {
  builtin_slug?: unknown
  custom_novena_id?: unknown
  intention_id?: unknown
  com_terco?: unknown
}

function sanitize(body: StartBody) {
  const hasSlug = body.builtin_slug !== undefined && body.builtin_slug !== null
  const hasCustom = body.custom_novena_id !== undefined && body.custom_novena_id !== null

  // XOR
  if (hasSlug === hasCustom) return null

  let builtinSlug: string | null = null
  let customNovenaId: string | null = null

  if (hasSlug) {
    if (typeof body.builtin_slug !== 'string') return null
    if (!VALID_SLUGS.has(body.builtin_slug)) return null
    builtinSlug = body.builtin_slug
  }

  if (hasCustom) {
    if (typeof body.custom_novena_id !== 'string') return null
    if (body.custom_novena_id.length < 32 || body.custom_novena_id.length > 64) return null
    customNovenaId = body.custom_novena_id
  }

  let intentionId: string | null = null
  if (body.intention_id !== undefined && body.intention_id !== null) {
    if (typeof body.intention_id !== 'string') return null
    if (body.intention_id.length < 32 || body.intention_id.length > 64) return null
    intentionId = body.intention_id
  }

  const comTerco = body.com_terco === true

  return { builtin_slug: builtinSlug, custom_novena_id: customNovenaId, intention_id: intentionId, com_terco: comTerco }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: StartBody
  try {
    body = (await req.json()) as StartBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const input = sanitize(body)
  if (!input) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('novenas_progress')
    .insert({
      user_id: user.id,
      builtin_slug: input.builtin_slug,
      custom_novena_id: input.custom_novena_id,
      intention_id: input.intention_id,
      com_terco: input.com_terco,
      current_day: 1,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[novenas/start] insert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ progress: data })
}
