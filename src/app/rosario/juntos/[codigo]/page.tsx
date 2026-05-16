import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SharedRoomView } from '@/features/rosario/components/SharedRoomView'
import {
  lookupAvatarUrl,
  lookupDisplayName,
} from '@/features/rosario/session/lookupDisplayName'
import { loadActiveSkin } from '@/features/rosario/skins/loadActiveSkin'
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

  let autoJoined = false
  if (!roomRow) {
    // Attempt auto-join via SECURITY DEFINER function
    const { error: joinError } = await supabase.rpc('join_rosary_room', {
      p_codigo: upper,
    })

    if (joinError) {
      notFound()
    }

    autoJoined = true

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

  // Defesa em profundidade: a migration de identidade faz o RPC `join_rosary_room`
  // resolver display_name + avatar_url no SQL. Caso o ambiente esteja
  // antes da migration, garantimos via UPDATE aqui.
  if (autoJoined) {
    const [displayName, avatarUrl] = await Promise.all([
      lookupDisplayName(supabase, user.id, user.email, user.user_metadata),
      lookupAvatarUrl(supabase, user.id, user.user_metadata),
    ])
    await supabase
      .from('rosary_room_participants')
      .update({ display_name: displayName, avatar_url: avatarUrl })
      .eq('room_id', roomRow.id)
      .eq('user_id', user.id)
  }

  const { data: participantsRows } = await supabase
    .from('rosary_room_participants')
    .select('*')
    .eq('room_id', roomRow.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  const room = roomRow as RosaryRoom
  const participants = (participantsRows ?? []) as RosaryRoomParticipant[]

  // Carrega skin equipada do viewer pra aplicar tema visual também
  // na sala compartilhada — cada participante vê a sala com o tema da
  // SUA skin equipada (preferência pessoal). O conteúdo (mistérios,
  // passo, leitor) vem do estado da sala, comum a todos.
  const activeSkin = await loadActiveSkin(supabase, user.id)

  return (
    <SharedRoomView
      initialRoom={room}
      initialParticipants={participants}
      viewerUserId={user.id}
      activeSkin={activeSkin}
    />
  )
}
