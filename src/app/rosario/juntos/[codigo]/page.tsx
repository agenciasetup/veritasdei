import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SharedRoomView } from '@/features/rosario/components/SharedRoomView'
import type {
  RosaryRoom,
  RosaryRoomParticipant,
} from '@/features/rosario/data/historyTypes'

export const dynamic = 'force-dynamic'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const upper = codigo.toUpperCase()

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main
        className="relative min-h-screen w-full px-4 py-10"
        style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
      >
        <div className="relative z-10 mx-auto max-w-md text-center">
          <h1
            className="font-serif text-2xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Entre para rezar em conjunto
          </h1>
          <p className="mt-3 text-xs" style={{ color: '#7A7368' }}>
            Salas compartilhadas exigem uma conta.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={`/login?redirectTo=/rosario/juntos/${upper}`}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Entrar
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Try to load the room. If RLS blocks (user not a participant), try auto-join.
  let { data: roomRow } = await supabase
    .from('rosary_rooms')
    .select('*')
    .eq('codigo', upper)
    .maybeSingle()

  if (!roomRow) {
    // Attempt auto-join via SECURITY DEFINER function
    const { error: joinError } = await supabase.rpc('join_rosary_room', {
      p_codigo: upper,
    })

    if (joinError) {
      notFound()
    }

    // Retry loading after join
    const { data: retryRow } = await supabase
      .from('rosary_rooms')
      .select('*')
      .eq('codigo', upper)
      .maybeSingle()

    if (!retryRow) {
      notFound()
    }

    roomRow = retryRow
  }

  const { data: participantsRows } = await supabase
    .from('rosary_room_participants')
    .select('*')
    .eq('room_id', roomRow.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  const room = roomRow as RosaryRoom
  const participants = (participantsRows ?? []) as RosaryRoomParticipant[]

  return (
    <SharedRoomView
      initialRoom={room}
      initialParticipants={participants}
      viewerUserId={user.id}
    />
  )
}
