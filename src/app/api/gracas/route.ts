import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/gracas?santo_id=... — feed público de graças recebidas
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const santoId = url.searchParams.get('santo_id')
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50)

  let q = supabase
    .from('gracas_publicas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (santoId) q = q.eq('santo_id', santoId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ gracas: data ?? [] })
}

// PUT /api/gracas — toggle compartilhamento de intenção (marca/desmarca compartilhada_publicamente)
// body: { intencao_id: uuid, compartilhada_publicamente: boolean }
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: { intencao_id?: string; compartilhada_publicamente?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (!body.intencao_id) return NextResponse.json({ error: 'missing_intencao_id' }, { status: 400 })

  // Só permite compartilhar se status == 'graca_recebida'
  const { data: intencao, error: fetchErr } = await supabase
    .from('intencoes')
    .select('id, user_id, status, reflexao_graca')
    .eq('id', body.intencao_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (fetchErr || !intencao) {
    return NextResponse.json({ error: 'intencao_not_found' }, { status: 404 })
  }

  if (body.compartilhada_publicamente === true) {
    if (intencao.status !== 'graca_recebida') {
      return NextResponse.json({ error: 'only_gracas_can_be_shared' }, { status: 400 })
    }
    if (!intencao.reflexao_graca || intencao.reflexao_graca.trim().length < 20) {
      return NextResponse.json({ error: 'reflexao_required' }, { status: 400 })
    }
  }

  const { error: updErr } = await supabase
    .from('intencoes')
    .update({
      compartilhada_publicamente: Boolean(body.compartilhada_publicamente),
      // Ao descompartilhar, mantém moderacao_status
      // Ao compartilhar pela 1ª vez, é aprovado_auto (já default)
    })
    .eq('id', body.intencao_id)
    .eq('user_id', user.id)
  if (updErr) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
