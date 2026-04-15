'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import type {
  RosaryRoom,
  RosaryRoomParticipant,
} from '@/features/rosario/data/historyTypes'
import { MYSTERY_GROUPS } from '@/features/rosario/data/mysteries'

/**
 * `<SharedRoomView />` — UI da sala compartilhada (lobby + sessão).
 *
 * Sprint 3.2: monta o lobby com código visível, lista de participantes
 * congelada no snapshot inicial, e um botão "Iniciar" para o host.
 * Após o estado virar 'rezando', mostra um placeholder da sessão
 * (a sincronização real via Realtime entra no sprint 3.3).
 *
 * O componente já recebe o snapshot hidratado via server component,
 * então o primeiro render é consistente com o cookie auth e não há
 * flash de "carregando".
 */
export interface SharedRoomViewProps {
  initialRoom: RosaryRoom
  initialParticipants: RosaryRoomParticipant[]
  viewerUserId: string
}

export function SharedRoomView({
  initialRoom,
  initialParticipants,
  viewerUserId,
}: SharedRoomViewProps) {
  const [room, setRoom] = useState<RosaryRoom>(initialRoom)
  const [participants, setParticipants] =
    useState<RosaryRoomParticipant[]>(initialParticipants)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHost = room.host_user_id === viewerUserId
  const isCoHost = room.co_host_user_id === viewerUserId
  const canControl = isHost || isCoHost

  const mysteryGroup = useMemo(
    () => MYSTERY_GROUPS.find((g) => g.id === room.mystery_set) ?? MYSTERY_GROUPS[0],
    [room.mystery_set],
  )

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(room.codigo)
    } catch {
      // Ignorar — clipboard requer permissão em alguns contextos.
    }
  }, [room.codigo])

  const patchRoom = useCallback(
    async (patch: Record<string, unknown>) => {
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`/api/rosario/rooms/${room.codigo}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) {
          setError('Ação negada. Tente novamente.')
          return
        }
        const data = (await res.json()) as {
          room: RosaryRoom
          participants: RosaryRoomParticipant[]
        }
        setRoom(data.room)
        setParticipants(data.participants)
      } catch {
        setError('Erro de rede.')
      } finally {
        setBusy(false)
      }
    },
    [room.codigo],
  )

  const handleStart = useCallback(() => {
    void patchRoom({ state: 'rezando' })
  }, [patchRoom])

  const handleLeave = useCallback(async () => {
    setBusy(true)
    try {
      await fetch(`/api/rosario/rooms/${room.codigo}/leave`, {
        method: 'POST',
      })
      window.location.href = '/rosario/juntos'
    } catch {
      setBusy(false)
    }
  }, [room.codigo])

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <h1
            className="font-serif text-2xl md:text-3xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            {room.titulo ?? 'Terço compartilhado'}
          </h1>
          <p className="mt-1 text-xs" style={{ color: '#7A7368' }}>
            {mysteryGroup.name}
          </p>
        </header>

        {/* Código de convite */}
        <section
          className="mb-6 rounded-2xl border p-5 text-center"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.6)',
          }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: '#7A7368' }}
          >
            Código de convite
          </div>
          <div
            className="mt-2 font-mono text-3xl tracking-[0.4em]"
            style={{ color: '#D9C077' }}
          >
            {room.codigo}
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="mt-3 rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Copiar código
          </button>
        </section>

        {/* Estado da sala */}
        <RoomStateBanner state={room.state} canControl={canControl} />

        {/* Lista de participantes */}
        <section
          className="mb-6 rounded-2xl border p-5"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.6)',
          }}
          aria-labelledby="participantes-titulo"
        >
          <h2
            id="participantes-titulo"
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: '#7A7368' }}
          >
            Na sala ({participants.length})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {participants.map((p) => {
              const isP_Host = p.user_id === room.host_user_id
              const isP_CoHost = p.user_id === room.co_host_user_id
              const isViewer = p.user_id === viewerUserId
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'rgba(201, 168, 76, 0.12)',
                    backgroundColor: 'rgba(15, 14, 12, 0.6)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                      style={{
                        backgroundColor: 'rgba(201, 168, 76, 0.15)',
                        color: '#D9C077',
                      }}
                    >
                      {(p.display_name ?? 'A').trim().charAt(0).toUpperCase() || 'A'}
                    </span>
                    <span className="truncate" style={{ color: '#F2EDE4' }}>
                      {p.display_name ?? 'Anônimo'}
                      {isViewer ? ' (você)' : ''}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {isP_Host && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                        style={{
                          borderColor: 'rgba(201, 168, 76, 0.35)',
                          color: '#D9C077',
                        }}
                      >
                        Host
                      </span>
                    )}
                    {isP_CoHost && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                        style={{
                          borderColor: 'rgba(201, 168, 76, 0.35)',
                          color: '#D9C077',
                        }}
                      >
                        Co-líder
                      </span>
                    )}
                    {isHost && !isP_Host && !isP_CoHost && room.state !== 'finalizada' && room.state !== 'encerrada' && (
                      <button
                        type="button"
                        onClick={() => patchRoom({ co_host_user_id: p.user_id })}
                        disabled={busy}
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] transition disabled:opacity-40"
                        style={{
                          borderColor: 'rgba(122, 115, 104, 0.4)',
                          color: '#7A7368',
                        }}
                        aria-label={`Promover ${p.display_name ?? 'participante'} a co-líder`}
                      >
                        Promover
                      </button>
                    )}
                    {isHost && isP_CoHost && (
                      <button
                        type="button"
                        onClick={() => patchRoom({ co_host_user_id: null })}
                        disabled={busy}
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] transition disabled:opacity-40"
                        style={{
                          borderColor: 'rgba(122, 115, 104, 0.4)',
                          color: '#7A7368',
                        }}
                      >
                        Rebaixar
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {error && (
          <div
            className="mb-4 rounded-md border px-3 py-2 text-xs"
            role="alert"
            style={{
              borderColor: 'rgba(201, 100, 100, 0.45)',
              color: '#F2EDE4',
              backgroundColor: 'rgba(70, 20, 20, 0.4)',
            }}
          >
            {error}
          </div>
        )}

        {/* Ações principais */}
        <div className="flex flex-wrap gap-2">
          {room.state === 'aguardando' && isHost && (
            <button
              type="button"
              onClick={handleStart}
              disabled={busy}
              className="flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              {busy ? 'Iniciando…' : 'Iniciar terço'}
            </button>
          )}
          {room.state === 'aguardando' && !isHost && (
            <div
              className="flex-1 rounded-lg border px-5 py-2.5 text-center text-sm"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.22)',
                color: '#7A7368',
              }}
              role="status"
              aria-live="polite"
            >
              Aguardando o host iniciar…
            </div>
          )}
          {room.state === 'rezando' && (
            <div
              className="flex-1 rounded-lg border px-5 py-2.5 text-center text-sm"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.22)',
                color: '#D9C077',
              }}
            >
              Terço em curso — sincronização ao vivo chega no próximo passo.
            </div>
          )}
          {(room.state === 'finalizada' || room.state === 'encerrada') && (
            <Link
              href="/rosario/juntos"
              className="flex-1 rounded-lg border px-5 py-2.5 text-center text-sm transition"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.35)',
                color: '#D9C077',
              }}
            >
              Voltar
            </Link>
          )}
          <button
            type="button"
            onClick={handleLeave}
            disabled={busy}
            className="rounded-lg border px-5 py-2.5 text-sm transition disabled:opacity-60"
            style={{
              borderColor: 'rgba(122, 115, 104, 0.4)',
              color: '#7A7368',
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </main>
  )
}

function RoomStateBanner({
  state,
  canControl,
}: {
  state: RosaryRoom['state']
  canControl: boolean
}) {
  const map: Record<RosaryRoom['state'], { label: string; tone: 'muted' | 'active' | 'ended' }> = {
    aguardando: { label: 'Aguardando início', tone: 'muted' },
    rezando: { label: 'Rezando em comunhão', tone: 'active' },
    finalizada: { label: 'Terço finalizado', tone: 'ended' },
    encerrada: { label: 'Sala encerrada', tone: 'ended' },
  }
  const info = map[state]
  const color =
    info.tone === 'active' ? '#D9C077' : info.tone === 'ended' ? '#7A7368' : '#7A7368'
  return (
    <div
      className="mb-4 rounded-full border px-4 py-2 text-center text-[10px] uppercase tracking-[0.2em]"
      style={{
        borderColor: 'rgba(201, 168, 76, 0.22)',
        color,
      }}
      role="status"
      aria-live="polite"
    >
      {info.label}
      {!canControl && state === 'aguardando' && ' — aguardando host'}
    </div>
  )
}
