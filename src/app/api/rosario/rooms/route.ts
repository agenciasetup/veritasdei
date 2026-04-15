import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Sala de terço compartilhado — criação (Marco 3).
 *
 *   POST /api/rosario/rooms
 *        body: {
 *          mystery_set: 'gozosos'|'luminosos'|'dolorosos'|'gloriosos',
 *          silencioso?: boolean,
 *          titulo?: string | null
 *        }
 *        → cria uma nova sala com o usuário autenticado como host,
 *          gera um código único de 6 chars (A-Z0-9), e retorna
 *          o snapshot { room, participants, isHost, isCoHost }.
 *
 * Listagem das salas do usuário não é exposta aqui — se algum dia
 * quisermos "minhas salas ativas" abrimos um GET separado.
 */

const VALID_MYSTERY_SETS = new Set(['gozosos', 'luminosos', 'dolorosos', 'gloriosos'])
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O/1/I pra evitar confusão

function generateRoomCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

interface CreateRoomBody {
  mystery_set?: unknown
  silencioso?: unknown
  titulo?: unknown
}

function sanitizeCreate(body: CreateRoomBody) {
  if (typeof body.mystery_set !== 'string') return null
  if (!VALID_MYSTERY_SETS.has(body.mystery_set)) return null

  const silencioso = typeof body.silencioso === 'boolean' ? body.silencioso : false

  let titulo: string | null = null
  if (body.titulo !== undefined && body.titulo !== null) {
    if (typeof body.titulo !== 'string') return null
    const trimmed = body.titulo.trim()
    if (trimmed.length > 120) return null
    titulo = trimmed.length > 0 ? trimmed : null
  }

  return {
    mystery_set: body.mystery_set,
    silencioso,
    titulo,
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: CreateRoomBody
  try {
    body = (await req.json()) as CreateRoomBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const input = sanitizeCreate(body)
  if (!input) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  // Até 5 tentativas pra gerar código único. 32^6 ≈ 1 bilhão, então colisão
  // é extremamente improvável — mas se duas salas forem criadas no mesmo
  // ms com o mesmo seed, a unique constraint pega e a gente regenera.
  let created = null
  let lastError: string | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const codigo = generateRoomCode()
    const { data, error } = await supabase
      .from('rosary_rooms')
      .insert({
        codigo,
        host_user_id: user.id,
        mystery_set: input.mystery_set,
        silencioso: input.silencioso,
        titulo: input.titulo,
      })
      .select('*')
      .single()
    if (!error) {
      created = data
      break
    }
    // 23505 = unique_violation
    if (error.code !== '23505') {
      lastError = error.message
      break
    }
  }

  if (!created) {
    console.error('[rosary_rooms] insert failed', lastError)
    return NextResponse.json(
      { error: lastError ?? 'room_create_failed' },
      { status: 500 },
    )
  }

  // Busca os participantes (o host foi inserido pelo trigger).
  const { data: participants } = await supabase
    .from('rosary_room_participants')
    .select('*')
    .eq('room_id', created.id)
    .is('left_at', null)

  return NextResponse.json({
    room: created,
    participants: participants ?? [],
    isHost: true,
    isCoHost: false,
  })
}
