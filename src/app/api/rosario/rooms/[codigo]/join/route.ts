import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { lookupDisplayName, lookupAvatarUrl } from '@/features/rosario/session/lookupDisplayName'

/**
 * Entrar em uma sala pelo código (Marco 3).
 *
 *   POST /api/rosario/rooms/[codigo]/join
 *
 * Delega pra função SQL `join_rosary_room(p_codigo)`, que roda como
 * SECURITY DEFINER e permite que o usuário faça lookup da sala mesmo
 * antes de ser participante. Se a sala existe e está em aguardando|rezando,
 * insere (ou reativa) o participante e retorna a linha da sala.
 */

export async function POST(
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

  const { data: room, error } = await supabase.rpc('join_rosary_room', {
    p_codigo: codigo,
  })

  if (error) {
    // Mapeia os dois exceptions definidos na função.
    if (error.message?.includes('not_authenticated')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error.message?.includes('room_not_found')) {
      return NextResponse.json({ error: 'room_not_found' }, { status: 404 })
    }
    console.error('[rosary_rooms] join error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 })
  }

  // A migration `20260516120000_rosary_room_identity_and_readers` faz o
  // RPC `join_rosary_room` resolver display_name + avatar_url internamente.
  // Mantemos este UPDATE como defesa em profundidade.
  const [displayName, avatarUrl] = await Promise.all([
    lookupDisplayName(supabase, user.id, user.email, user.user_metadata),
    lookupAvatarUrl(supabase, user.id, user.user_metadata),
  ])
  await supabase
    .from('rosary_room_participants')
    .update({ display_name: displayName, avatar_url: avatarUrl })
    .eq('room_id', room.id)
    .eq('user_id', user.id)

  const { data: participants } = await supabase
    .from('rosary_room_participants')
    .select('*')
    .eq('room_id', room.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  return NextResponse.json({
    room,
    participants: participants ?? [],
    isHost: room.host_user_id === user.id,
    isCoHost: room.co_host_user_id === user.id,
  })
}
