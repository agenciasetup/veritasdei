import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

const MAX_RESULTS = 6

/**
 * GET /api/comunidade/mentions?q=prefix
 *
 * Busca profiles por handle/nome (prefix match). Usado pelo autocomplete
 * de @menção no composer. Retorna apenas dados enxutos (id, handle, name,
 * avatar) pra ficar leve e rápido.
 */
export async function GET(req: NextRequest) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  if (!rateLimit(`community:mentions:${user.id}`, 120, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const url = new URL(req.url)
  const rawQ = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const q = rawQ.replace(/^@+/, '').slice(0, 24)

  if (q.length < 1) {
    return NextResponse.json({ matches: [] })
  }

  // Busca por handle (prefix, mais preciso) OU nome (ilike). Handle tem
  // prioridade no ordering. Limite pequeno para UI ser rápida.
  const { data: byHandle } = await supabase
    .from('profiles')
    .select('id, public_handle, name, profile_image_url, community_role, verified')
    .ilike('public_handle', `${q}%`)
    .not('public_handle', 'is', null)
    .limit(MAX_RESULTS)

  const handleIds = new Set((byHandle ?? []).map(r => r.id))

  // Completa com match de nome se ainda tiver espaço.
  let nameMatches: typeof byHandle = []
  if ((byHandle?.length ?? 0) < MAX_RESULTS) {
    const remaining = MAX_RESULTS - (byHandle?.length ?? 0)
    const { data: byName } = await supabase
      .from('profiles')
      .select('id, public_handle, name, profile_image_url, community_role, verified')
      .ilike('name', `%${q}%`)
      .not('public_handle', 'is', null)
      .limit(remaining + handleIds.size)
    nameMatches = (byName ?? []).filter(r => !handleIds.has(r.id)).slice(0, remaining)
  }

  const matches = [...(byHandle ?? []), ...nameMatches].map(r => ({
    id: r.id,
    handle: r.public_handle ?? '',
    name: r.name ?? '',
    avatar_url: r.profile_image_url,
    community_role: r.community_role ?? 'leigo',
    verified: Boolean(r.verified),
  }))

  return NextResponse.json({ matches })
}
