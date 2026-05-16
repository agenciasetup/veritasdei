import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Snapshot de uma sala pelo código de convite (Marco 3).
 *
 *   GET /api/rosario/rooms/[codigo]
 *       → retorna { room, participants, isHost, isCoHost }.
 *       Requer que o viewer seja host, co-host ou participante
 *       (RLS filtra). Retorna 404 se a sala não existe ou o viewer
 *       não tem acesso.
 *
 *   PATCH /api/rosario/rooms/[codigo]
 *       body: { passo_index?, state?, co_host_user_id? }
 *       → host/co-host podem avançar o passo (passo_index) ou mudar
 *         o state. Apenas o host pode definir/trocar co_host_user_id,
 *         e o valor precisa referenciar um participante existente.
 *
 *   DELETE /api/rosario/rooms/[codigo]
 *       → só o host. Encerra a sala (soft delete via state='encerrada').
 */

const VALID_STATE_TRANSITIONS: Record<string, Set<string>> = {
  aguardando: new Set(['rezando', 'encerrada']),
  rezando: new Set(['finalizada', 'encerrada']),
  // finalizada/encerrada são estados terminais — nenhuma transição permitida.
  finalizada: new Set(),
  encerrada: new Set(),
}

async function loadSnapshot(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  codigo: string,
  userId: string,
) {
  const { data: room } = await supabase
    .from('rosary_rooms')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()
  if (!room) return null

  const { data: participants } = await supabase
    .from('rosary_room_participants')
    .select('*')
    .eq('room_id', room.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  return {
    room,
    participants: participants ?? [],
    isHost: room.host_user_id === userId,
    isCoHost: room.co_host_user_id === userId,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const snapshot = await loadSnapshot(supabase, codigo, user.id)
  if (!snapshot) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 })
  }

  return NextResponse.json(snapshot)
}

interface PatchBody {
  passo_index?: unknown
  state?: unknown
  co_host_user_id?: unknown
  /**
   * Mapa de leitores: `{ "1": user_id, ..., "5": user_id }`. Substitui
   * o mapa inteiro — se quiser apenas atribuir uma dezena, manda o mapa
   * existente com a chave modificada. Use `null` em vez do mapa pra
   * resetar (host lê tudo).
   */
  decade_readers?: unknown
}

const DECADE_KEYS = new Set(['1', '2', '3', '4', '5'])

function sanitizeDecadeReaders(value: unknown):
  | { ok: true; value: Record<string, string> | null }
  | { ok: false } {
  if (value === null) return { ok: true, value: null }
  if (typeof value !== 'object' || Array.isArray(value)) return { ok: false }
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!DECADE_KEYS.has(k)) return { ok: false }
    if (typeof v !== 'string' || v.length === 0) return { ok: false }
    // Validação UUID v4 leve — 8-4-4-4-12 hex
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
      return { ok: false }
    }
    out[k] = v
  }
  return { ok: true, value: out }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Carrega a sala atual. A RLS SELECT permite host/co-host/participantes,
  // então quem não está nela ganha 404.
  const { data: room } = await supabase
    .from('rosary_rooms')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 })
  }

  const isHost = room.host_user_id === user.id
  const isCoHost = room.co_host_user_id === user.id
  if (!isHost && !isCoHost) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const patch: Record<string, unknown> = {}

  if ('passo_index' in body) {
    if (typeof body.passo_index !== 'number' || !Number.isFinite(body.passo_index)) {
      return NextResponse.json({ error: 'invalid_passo_index' }, { status: 400 })
    }
    const rounded = Math.round(body.passo_index)
    if (rounded < 0 || rounded >= 200) {
      return NextResponse.json({ error: 'invalid_passo_index' }, { status: 400 })
    }
    patch.passo_index = rounded
  }

  if ('state' in body) {
    if (typeof body.state !== 'string') {
      return NextResponse.json({ error: 'invalid_state' }, { status: 400 })
    }
    const allowed = VALID_STATE_TRANSITIONS[room.state]
    if (!allowed || !allowed.has(body.state)) {
      return NextResponse.json({ error: 'invalid_state_transition' }, { status: 400 })
    }
    patch.state = body.state
    if (body.state === 'rezando' && !room.started_at) {
      patch.started_at = new Date().toISOString()
    }
    if (body.state === 'finalizada' || body.state === 'encerrada') {
      patch.ended_at = new Date().toISOString()
    }
  }

  if ('decade_readers' in body) {
    const result = sanitizeDecadeReaders(body.decade_readers)
    if (!result.ok) {
      return NextResponse.json({ error: 'invalid_decade_readers' }, { status: 400 })
    }
    const readers = result.value
    if (readers && Object.keys(readers).length > 0) {
      // Cada user_id atribuído precisa estar entre os participantes ativos.
      const uniqueIds = Array.from(new Set(Object.values(readers)))
      const { data: present } = await supabase
        .from('rosary_room_participants')
        .select('user_id')
        .eq('room_id', room.id)
        .is('left_at', null)
        .in('user_id', uniqueIds)
      const presentIds = new Set((present ?? []).map((r) => r.user_id as string))
      for (const id of uniqueIds) {
        if (!presentIds.has(id)) {
          return NextResponse.json(
            { error: 'reader_not_participant' },
            { status: 400 },
          )
        }
      }
    }
    patch.decade_readers = readers ?? {}
  }

  if ('co_host_user_id' in body) {
    // Apenas host pode alterar co_host.
    if (!isHost) {
      return NextResponse.json({ error: 'forbidden_co_host_change' }, { status: 403 })
    }
    if (body.co_host_user_id === null) {
      patch.co_host_user_id = null
    } else if (typeof body.co_host_user_id === 'string') {
      if (body.co_host_user_id === user.id) {
        return NextResponse.json({ error: 'co_host_equals_host' }, { status: 400 })
      }
      // Precisa estar entre os participantes ativos.
      const { data: participant } = await supabase
        .from('rosary_room_participants')
        .select('user_id')
        .eq('room_id', room.id)
        .eq('user_id', body.co_host_user_id)
        .is('left_at', null)
        .maybeSingle()
      if (!participant) {
        return NextResponse.json({ error: 'co_host_not_participant' }, { status: 400 })
      }
      patch.co_host_user_id = body.co_host_user_id
    } else {
      return NextResponse.json({ error: 'invalid_co_host' }, { status: 400 })
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'empty_patch' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('rosary_rooms')
    .update(patch)
    .eq('id', room.id)
    .select('*')
    .single()

  if (error) {
    console.error('[rosary_rooms] update error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: participants } = await supabase
    .from('rosary_room_participants')
    .select('*')
    .eq('room_id', updated.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  return NextResponse.json({
    room: updated,
    participants: participants ?? [],
    isHost: updated.host_user_id === user.id,
    isCoHost: updated.co_host_user_id === user.id,
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { data: room } = await supabase
    .from('rosary_rooms')
    .select('id, host_user_id, state')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 })
  }
  if (room.host_user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Soft close — vira 'encerrada' em vez de DELETE, pra preservar histórico.
  const { error } = await supabase
    .from('rosary_rooms')
    .update({ state: 'encerrada', ended_at: new Date().toISOString() })
    .eq('id', room.id)

  if (error) {
    console.error('[rosary_rooms] close error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
