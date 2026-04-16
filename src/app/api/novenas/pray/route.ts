import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/novenas/pray
 *
 * Marca o dia atual como rezado, avança current_day e (se dia 9) completa.
 *
 * body: { progress_id: string }
 */

interface PrayBody {
  progress_id?: unknown
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: PrayBody
  try {
    body = (await req.json()) as PrayBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (typeof body.progress_id !== 'string' || body.progress_id.length < 32) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  // Buscar progresso atual
  const { data: progress, error: fetchErr } = await supabase
    .from('novenas_progress')
    .select('id, user_id, current_day, completed_at')
    .eq('id', body.progress_id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !progress) {
    return NextResponse.json({ error: 'progress_not_found' }, { status: 404 })
  }

  if (progress.completed_at) {
    return NextResponse.json({ error: 'already_completed' }, { status: 400 })
  }

  const dayNumber = progress.current_day

  // Inserir daily_log (UNIQUE constraint protege contra duplicatas)
  const { error: logErr } = await supabase
    .from('novenas_daily_log')
    .insert({
      progress_id: progress.id,
      user_id: user.id,
      day_number: dayNumber,
    })

  if (logErr) {
    // Se for duplicata, retornar erro amigável
    if (logErr.code === '23505') {
      return NextResponse.json({ error: 'day_already_prayed' }, { status: 409 })
    }
    console.error('[novenas/pray] log insert error', logErr)
    return NextResponse.json({ error: logErr.message }, { status: 500 })
  }

  // Atualizar progresso
  const isComplete = dayNumber >= 9
  const now = new Date().toISOString()

  const updatePayload: Record<string, unknown> = {
    last_prayed_at: now,
  }

  if (isComplete) {
    updatePayload.completed_at = now
  } else {
    updatePayload.current_day = dayNumber + 1
  }

  const { data: updated, error: updateErr } = await supabase
    .from('novenas_progress')
    .update(updatePayload)
    .eq('id', progress.id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (updateErr) {
    console.error('[novenas/pray] progress update error', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    progress: updated,
    day_prayed: dayNumber,
    completed: isComplete,
  })
}
