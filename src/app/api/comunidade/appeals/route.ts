import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/comunidade/appeals
 *   body: { post_id?: string, report_id?: string, reason: string }
 *
 *   Abre uma apelação contra decisão de moderação. O usuário é o `user_id`.
 *   Revisão humana obrigatória — a política garante que resolved_by seja
 *   diferente do moderador que aplicou a sanção original (checagem feita
 *   no painel admin).
 *
 * GET /api/comunidade/appeals
 *   Lista as apelações do próprio usuário (últimas 50).
 */

type PostBody = {
  post_id?: string
  report_id?: string
  reason?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  if (!(await rateLimit(`community:appeal:${user.id}`, 5, 60_000))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const reason = (body.reason ?? '').trim()
  if (reason.length < 10 || reason.length > 2000) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 })
  }

  const postId = body.post_id?.trim() || null
  const reportId = body.report_id?.trim() || null
  if (!postId && !reportId) {
    return NextResponse.json({ error: 'target_required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('vd_report_appeals')
    .insert({
      user_id: user.id,
      post_id: postId,
      report_id: reportId,
      reason,
    })
    .select('id, created_at, status')
    .single()

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, appeal: data })
}

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('vd_report_appeals')
    .select('id, post_id, report_id, reason, status, resolution_note, created_at, resolved_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ appeals: data ?? [] })
}
