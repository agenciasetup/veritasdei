import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Sair de uma sala (Marco 3).
 *
 *   POST /api/rosario/rooms/[codigo]/leave
 *
 * Marca `left_at = now()` na row do participante. Se o usuário era
 * co-host, remove o co_host_user_id da sala. Se era host, encerra
 * a sala (state='encerrada') — todos os demais ficam offline.
 *
 * O Marco 3.5 melhora o caso "host sai no meio" promovendo o co-host
 * automaticamente em vez de encerrar; por ora, encerrar é simples e
 * transparente.
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

  const { data: room } = await supabase
    .from('rosary_rooms')
    .select('id, host_user_id, co_host_user_id, state')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()
  if (!room) {
    return NextResponse.json({ error: 'room_not_found' }, { status: 404 })
  }

  // Se é host e a sala ainda não terminou, encerra.
  if (room.host_user_id === user.id) {
    if (room.state === 'aguardando' || room.state === 'rezando') {
      await supabase
        .from('rosary_rooms')
        .update({ state: 'encerrada', ended_at: new Date().toISOString() })
        .eq('id', room.id)
    }
  } else if (room.co_host_user_id === user.id) {
    // Co-host perde o papel ao sair.
    await supabase
      .from('rosary_rooms')
      .update({ co_host_user_id: null })
      .eq('id', room.id)
  }

  // Marca left_at no participante.
  await supabase
    .from('rosary_room_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
