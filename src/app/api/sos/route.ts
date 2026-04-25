import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'
import { sendAdminAlert } from '@/lib/notifications/admin-alert'

type Body = {
  target_user_id?: string
  target_post_id?: string
  category?: 'menor_em_risco' | 'nudez_nao_consensual' | 'violencia_grave' | 'ameaca_vida' | 'outro'
  details?: string
}

const VALID_CATEGORIES = new Set<NonNullable<Body['category']>>([
  'menor_em_risco',
  'nudez_nao_consensual',
  'violencia_grave',
  'ameaca_vida',
  'outro',
])

/**
 * POST /api/sos — cria uma denúncia de emergência (SLA 24h).
 *   body: { target_user_id?, target_post_id?, category, details? }
 *
 * Fluxo:
 * - Rate-limit estrito (5/hora/usuário) para evitar abuso.
 * - Cria linha em vd_sos_reports com status=open.
 * - Quando apropriado, o moderador encaminha a SaferNet / autoridade.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  if (!rateLimit(`sos:${user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.category || !VALID_CATEGORIES.has(body.category)) {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 })
  }
  if (!body.target_user_id && !body.target_post_id) {
    return NextResponse.json({ error: 'target_required' }, { status: 400 })
  }

  const details = (body.details ?? '').trim().slice(0, 2000) || null

  const { data, error } = await supabase
    .from('vd_sos_reports')
    .insert({
      reporter_user_id: user.id,
      target_user_id: body.target_user_id ?? null,
      target_post_id: body.target_post_id ?? null,
      category: body.category,
      details,
      ip: clientIpFromHeaders(req.headers),
      user_agent: req.headers.get('user-agent')?.slice(0, 400) ?? null,
    })
    .select('id, created_at, status')
    .single()

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  await sendAdminAlert({
    severity: 'critical',
    title: 'Novo SOS recebido',
    description: `Categoria: ${body.category}`,
    fields: [
      { name: 'sos_id', value: String(data.id), inline: true },
      { name: 'reporter', value: user.id, inline: true },
      { name: 'target_user', value: body.target_user_id ?? '—', inline: true },
      { name: 'target_post', value: body.target_post_id ?? '—', inline: true },
      ...(details ? [{ name: 'detalhes', value: details.slice(0, 500) }] : []),
    ],
  })

  return NextResponse.json({
    ok: true,
    sos: data,
    resources: {
      safernet: 'https://new.safernet.org.br/denuncie',
      disque_100: 'https://www.gov.br/mdh/pt-br/disque100',
    },
  })
}
