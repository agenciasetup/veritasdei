import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface StartPayload {
  santo_id: string
  disparo_auto?: boolean
}

// Lista novenas ativas do user (e concluídas recentes) + santo.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const ativa = req.nextUrl.searchParams.get('ativa')
  let query = supabase
    .from('novenas')
    .select(`
      id, user_id, santo_id, iniciada_em, concluida_em, dia_atual, progresso, disparo_auto,
      created_at, updated_at,
      santo:santos!santo_id(id, slug, nome, invocacao, imagem_url, oracao_curta)
    `)
    .eq('user_id', user.id)
    .order('iniciada_em', { ascending: false })
    .limit(10)

  if (ativa === '1') {
    query = query.is('concluida_em', null)
  }

  const { data, error } = await query
  if (error) {
    console.error('[novenas] GET error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ novenas: data ?? [] })
}

// Inicia nova novena
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: StartPayload
  try { body = await req.json() as StartPayload }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.santo_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.santo_id)) {
    return NextResponse.json({ error: 'invalid_santo_id' }, { status: 400 })
  }

  // Não iniciar duplicada — se já há ativa pro mesmo santo, retorna ela
  const { data: existing } = await supabase
    .from('novenas')
    .select('id')
    .eq('user_id', user.id)
    .eq('santo_id', body.santo_id)
    .is('concluida_em', null)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ novena: existing, already_active: true })
  }

  const { data, error } = await supabase
    .from('novenas')
    .insert({
      user_id: user.id,
      santo_id: body.santo_id,
      dia_atual: 1,
      progresso: [],
      disparo_auto: Boolean(body.disparo_auto),
    })
    .select('*')
    .single()
  if (error) {
    console.error('[novenas] POST error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ novena: data })
}

// Marca dia rezado ou avança
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: { novena_id?: string; action?: 'marcar_dia' | 'encerrar' }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.novena_id) return NextResponse.json({ error: 'missing_novena_id' }, { status: 400 })

  const { data: novena, error: fetchErr } = await supabase
    .from('novenas')
    .select('id, dia_atual, progresso, concluida_em')
    .eq('id', body.novena_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (fetchErr || !novena) {
    return NextResponse.json({ error: 'novena_not_found' }, { status: 404 })
  }
  if (novena.concluida_em) {
    return NextResponse.json({ error: 'novena_already_finished' }, { status: 400 })
  }

  if (body.action === 'encerrar') {
    const { error: updErr } = await supabase
      .from('novenas')
      .update({ concluida_em: new Date().toISOString() })
      .eq('id', novena.id)
    if (updErr) return NextResponse.json({ error: 'db_error' }, { status: 500 })
    return NextResponse.json({ ok: true, concluida: true })
  }

  // marcar_dia (default)
  const progressoArr = Array.isArray(novena.progresso) ? novena.progresso as string[] : []
  const jaRezouHoje = progressoArr.some(ts => {
    const d = new Date(ts)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  if (jaRezouHoje) {
    return NextResponse.json({ ok: true, ja_rezou_hoje: true, novena })
  }

  progressoArr.push(new Date().toISOString())
  const novoDia = Math.min(novena.dia_atual + 1, 9)
  const concluir = progressoArr.length >= 9

  const { data: updated, error: updErr } = await supabase
    .from('novenas')
    .update({
      dia_atual: concluir ? 9 : novoDia,
      progresso: progressoArr,
      concluida_em: concluir ? new Date().toISOString() : null,
    })
    .eq('id', novena.id)
    .select('*')
    .single()
  if (updErr) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true, novena: updated, concluida: concluir })
}
