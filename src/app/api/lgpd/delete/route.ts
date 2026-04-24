import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/lgpd/delete
 *   body: { confirm: string } — o usuário precisa digitar "EXCLUIR" para
 *   confirmar. Marca a conta como pending_deletion com deletion_scheduled_for
 *   = now() + 30 dias. A remoção efetiva é executada em lote pela função
 *   soft_delete_user(uuid), chamada por job/cron após o grace period
 *   (enquanto o cron não está em produção, a operação admin pode rodar a
 *   função manualmente).
 *
 * DELETE /api/lgpd/delete
 *   Cancela o pedido (reverte para active) enquanto estiver dentro do grace.
 */

type PostBody = { confirm?: string }

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if ((body.confirm ?? '').trim().toUpperCase() !== 'EXCLUIR') {
    return NextResponse.json({ error: 'confirmation_required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('request_account_deletion', { p_user_id: user.id })
  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    scheduledFor: data,
    graceDays: 30,
  })
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { error } = await supabase.rpc('cancel_account_deletion', { p_user_id: user.id })
  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
