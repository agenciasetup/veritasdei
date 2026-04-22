import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const santoId = url.searchParams.get('santo_id')
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 30, 1), 60)

  let q = supabase
    .from('pedidos_oracao_publicos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (santoId) q = q.eq('santo_id', santoId)

  const { data, error } = await q
  if (error) {
    console.error('[pedidos-oracao] GET error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // Se autenticado, anota quais o user já rezou
  const { data: { user } } = await supabase.auth.getUser()
  let rezouIds: Set<string> = new Set()
  if (user && data && data.length > 0) {
    const { data: rezas } = await supabase
      .from('pedidos_oracao_rezas')
      .select('pedido_id')
      .eq('user_id', user.id)
      .in('pedido_id', data.map(p => p.id))
    rezouIds = new Set((rezas ?? []).map((r: { pedido_id: string }) => r.pedido_id))
  }

  return NextResponse.json({
    pedidos: (data ?? []).map(p => ({ ...p, ja_rezou: rezouIds.has(p.id) })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: { texto?: string; santo_id?: string | null; anonimo?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const texto = String(body.texto ?? '').trim()
  if (texto.length < 10) return NextResponse.json({ error: 'texto_too_short' }, { status: 400 })
  if (texto.length > 600) return NextResponse.json({ error: 'texto_too_long' }, { status: 400 })

  const santoId = body.santo_id ?? null
  if (santoId && !UUID_RE.test(santoId)) {
    return NextResponse.json({ error: 'invalid_santo_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pedidos_oracao')
    .insert({
      user_id: user.id,
      santo_id: santoId,
      texto,
      anonimo: Boolean(body.anonimo),
    })
    .select('*')
    .single()
  if (error) {
    console.error('[pedidos-oracao] POST error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ pedido: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('pedidos_oracao')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
