import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { IntencaoStatus } from '@/types/devocao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CreatePayload {
  texto: string
  santo_id?: string | null
  lembrete_semanal?: boolean
}

interface UpdatePayload {
  id: string
  texto?: string
  status?: IntencaoStatus
  reflexao_graca?: string | null
  lembrete_semanal?: boolean
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const statusFilter = req.nextUrl.searchParams.get('status') as IntencaoStatus | null

  let q = supabase
    .from('intencoes')
    .select(`
      id, user_id, santo_id, texto, status, reflexao_graca, lembrete_semanal,
      encerrada_em, created_at, updated_at,
      santo:santos!santo_id(id, slug, nome, invocacao, imagem_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusFilter) q = q.eq('status', statusFilter)

  const { data, error } = await q
  if (error) {
    console.error('[intencoes] GET error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ intencoes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: CreatePayload
  try { body = await req.json() as CreatePayload }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const texto = String(body.texto ?? '').trim()
  if (texto.length < 3) return NextResponse.json({ error: 'texto_too_short' }, { status: 400 })
  if (texto.length > 500) return NextResponse.json({ error: 'texto_too_long' }, { status: 400 })

  const santoId = body.santo_id ?? null
  if (santoId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(santoId)) {
    return NextResponse.json({ error: 'invalid_santo_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('intencoes')
    .insert({
      user_id: user.id,
      santo_id: santoId,
      texto,
      lembrete_semanal: Boolean(body.lembrete_semanal),
    })
    .select('*')
    .single()
  if (error) {
    console.error('[intencoes] POST error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ intencao: data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: UpdatePayload
  try { body = await req.json() as UpdatePayload }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.texto !== undefined) {
    const t = String(body.texto).trim()
    if (t.length < 3 || t.length > 500) return NextResponse.json({ error: 'texto_invalid' }, { status: 400 })
    patch.texto = t
  }
  if (body.status !== undefined) {
    if (!['aberta', 'graca_recebida', 'arquivada'].includes(body.status)) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
    }
    patch.status = body.status
  }
  if (body.reflexao_graca !== undefined) {
    const r = body.reflexao_graca === null ? null : String(body.reflexao_graca).trim()
    if (r !== null && r.length > 500) return NextResponse.json({ error: 'reflexao_too_long' }, { status: 400 })
    patch.reflexao_graca = r || null
  }
  if (body.lembrete_semanal !== undefined) {
    patch.lembrete_semanal = Boolean(body.lembrete_semanal)
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'empty_patch' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('intencoes')
    .update(patch)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select('*')
    .single()
  if (error) {
    console.error('[intencoes] PUT error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ intencao: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('intencoes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
