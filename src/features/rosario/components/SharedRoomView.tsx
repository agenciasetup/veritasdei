'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  RosaryRoom,
  RosaryRoomParticipant,
} from '@/features/rosario/data/historyTypes'
import { MYSTERY_GROUPS } from '@/features/rosario/data/mysteries'
import {
  ROSARY_STEPS,
  firstStepForBead,
  type BeadId,
} from '@/features/rosario/data/beadSequence'
import { RosaryBeads } from '@/features/rosario/components/RosaryBeads'
import { PrayerStage } from '@/features/rosario/components/PrayerStage'
import { useSharedRosaryProgress } from '@/features/rosario/session/useSharedRosaryProgress'
import { useRosaryHistoryRecord } from '@/features/rosario/session/useRosaryHistoryRecord'

/**
 * `<SharedRoomView />` — UI da sala compartilhada (lobby + sessão).
 *
 * Layout responsivo:
 *   - Mobile/tablet: vertical, conteúdo centralizado num column scrollável.
 *   - Desktop (lg+): fullscreen — lobby empilhado verticalmente com lista
 *     larga, sessão em split-screen (terço esquerda, oração direita, lista
 *     de participantes em sidebar fina à direita).
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
  const shared = useSharedRosaryProgress(
    initialRoom,
    initialParticipants,
    viewerUserId,
  )
  const {
    room,
    participants,
    currentIndex,
    isCompleted,
    canControl,
    isHost,
    onlineUserIds,
    pending,
    error,
  } = shared
  const onlineCount = onlineUserIds.size
  const { recordSession } = useRosaryHistoryRecord()

  /**
   * Ao entrar em `finalizada`, cada viewer grava uma entrada individual
   * no próprio histórico, com sala_id preenchido. Uma ref evita gravação
   * dupla caso o broadcast dispare múltiplos UPDATE com o mesmo state.
   */
  const recordedRef = useRef(false)
  useEffect(() => {
    if (room.state !== 'finalizada') {
      recordedRef.current = false
      return
    }
    if (recordedRef.current) return
    recordedRef.current = true
    const start = room.started_at ? Date.parse(room.started_at) : Date.now()
    const duration = Math.max(0, Math.round((Date.now() - start) / 1000))
    void recordSession({
      mystery_set: room.mystery_set,
      sala_id: room.id,
      started_at: room.started_at ?? null,
      duration_seconds: duration,
    })
  }, [room.state, room.id, room.mystery_set, room.started_at, recordSession])
  const [localError, setLocalError] = useState<string | null>(null)

  const mysteryGroup = useMemo(
    () => MYSTERY_GROUPS.find((g) => g.id === room.mystery_set) ?? MYSTERY_GROUPS[0],
    [room.mystery_set],
  )

  const currentStep = ROSARY_STEPS[Math.min(Math.max(currentIndex, 0), ROSARY_STEPS.length - 1)]

  const completedBeadIds = useMemo<ReadonlySet<BeadId>>(() => {
    const set = new Set<BeadId>()
    for (let i = 0; i < currentIndex; i++) {
      const b = ROSARY_STEPS[i]?.beadId
      if (b) set.add(b)
    }
    if (isCompleted) {
      const last = ROSARY_STEPS[ROSARY_STEPS.length - 1].beadId
      if (last) set.add(last)
    }
    return set
  }, [currentIndex, isCompleted])

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(room.codigo)
    } catch {
      // Clipboard pode falhar em contextos inseguros — sem drama.
    }
  }, [room.codigo])

  const handleStart = useCallback(() => {
    void shared.setState('rezando')
  }, [shared])

  const handleLeave = useCallback(async () => {
    try {
      await fetch(`/api/rosario/rooms/${room.codigo}/leave`, { method: 'POST' })
      window.location.href = '/rosario/juntos'
    } catch {
      setLocalError('Não foi possível sair.')
    }
  }, [room.codigo])

  const displayError = error ?? localError

  const showSession = room.state === 'rezando' || room.state === 'finalizada'
  const progressPct = Math.round(
    ((currentIndex + (isCompleted ? 1 : 0)) / ROSARY_STEPS.length) * 100,
  )

  return (
    <main
      className="relative min-h-screen w-full"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="bg-glow" aria-hidden />

      <div
        className="
          relative z-10 mx-auto flex flex-col px-4 py-8
          md:px-8 md:py-12
          lg:max-w-7xl lg:px-12
        "
      >
        <header className="mb-6 text-center md:mb-8">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.4em]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            Sala de oração
          </p>
          <h1
            className="text-3xl md:text-4xl lg:text-5xl"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
            }}
          >
            {room.titulo ?? 'Terço compartilhado'}
          </h1>
          <p className="mt-2 text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>
            {mysteryGroup.name}
          </p>
        </header>

        {/* Estado da sala */}
        <div className="mx-auto w-full max-w-md md:max-w-lg">
          <RoomStateBanner state={room.state} canControl={canControl} />
        </div>

        {/* Código de convite — destaque grande no lobby, discreto durante a sessão */}
        {room.state === 'aguardando' ? (
          <section
            className="
              mx-auto mb-6 w-full max-w-md rounded-3xl border p-6 text-center
              md:max-w-lg md:p-8 lg:max-w-xl
            "
            style={{
              borderColor: 'var(--accent-soft)',
              backgroundColor: 'rgba(20, 18, 14, 0.55)',
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.3em] md:text-[11px]"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
            >
              Código de convite
            </div>
            <div
              className="mt-3 font-mono text-3xl tracking-[0.4em] md:text-4xl lg:text-5xl"
              style={{
                color: 'var(--accent)',
                textShadow: '0 0 24px rgba(201, 168, 76, 0.25)',
              }}
            >
              {room.codigo}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="mt-4 rounded-md border px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] transition active:scale-[0.97]"
              style={{
                borderColor: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Copiar código
            </button>
          </section>
        ) : (
          <div
            className="mb-4 text-center font-mono text-[11px] tracking-[0.3em]"
            style={{ color: 'var(--text-3)' }}
          >
            Código {room.codigo}
          </div>
        )}

        {/* Sessão ao vivo — split-screen no desktop */}
        {showSession && (
          <section
            aria-label="Sessão do terço"
            className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-12 lg:items-start"
          >
            {/* Beads + progress (left on desktop) */}
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-8">
              <div className="mx-auto flex max-w-md flex-col items-center gap-4 lg:max-w-none">
                <RosaryBeads
                  currentBeadId={currentStep.beadId}
                  completedBeadIds={completedBeadIds}
                  onBeadSelect={
                    canControl
                      ? (beadId: BeadId) => {
                          const step = firstStepForBead(beadId)
                          if (step) void shared.goTo(step.index)
                        }
                      : undefined
                  }
                  className="
                    h-auto w-full
                    max-w-[300px] sm:max-w-[360px] md:max-w-[420px]
                    lg:max-w-[460px] xl:max-w-[520px]
                  "
                  ariaDescription={`Terço compartilhado — passo ${currentIndex + 1} de ${ROSARY_STEPS.length}`}
                />

                <div className="w-full" aria-hidden>
                  <div
                    className="h-1 w-full overflow-hidden rounded-full"
                    style={{ background: 'var(--accent-soft)' }}
                  >
                    <div
                      className="rosary-progress-fill h-full"
                      style={{
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
                      }}
                    />
                  </div>
                  <div
                    className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.25em]"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <span>Passo {currentIndex + 1} / {ROSARY_STEPS.length}</span>
                    <span>{progressPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prayer + controls (right on desktop) */}
            <div className="lg:max-w-2xl">
              <PrayerStage
                step={currentStep}
                mysteryGroup={mysteryGroup}
                isCompleted={isCompleted}
                onAdvance={canControl ? () => void shared.advance() : noop}
              />

              {!canControl && !isCompleted && (
                <div
                  className="mt-3 rounded-md border px-3 py-2 text-center text-[11px]"
                  role="status"
                  aria-live="polite"
                  style={{
                    borderColor: 'var(--accent-soft)',
                    color: 'var(--text-3)',
                  }}
                >
                  O {room.co_host_user_id ? 'host ou co-líder' : 'host'} avança as contas.
                </div>
              )}

              {canControl && !isCompleted && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void shared.back()}
                    disabled={pending || currentIndex === 0}
                    className="flex-1 rounded-lg border px-4 py-3 text-sm transition disabled:opacity-30"
                    style={{
                      borderColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => void shared.advance()}
                    disabled={pending}
                    className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                      color: 'var(--accent-contrast)',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Próximo
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Lista de participantes */}
        <section
          className="
            mx-auto mt-6 w-full max-w-md rounded-2xl border p-5
            md:max-w-lg md:p-6
            lg:max-w-3xl
          "
          style={{
            borderColor: 'var(--accent-soft)',
            backgroundColor: 'rgba(20, 18, 14, 0.55)',
          }}
          aria-labelledby="participantes-titulo"
        >
          <div className="flex items-center justify-between">
            <h2
              id="participantes-titulo"
              className="text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
            >
              Na sala ({participants.length})
            </h2>
            <span
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--accent)' }}
              aria-label={`${onlineCount} online agora`}
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 0 6px rgba(217,192,119,0.6)',
                }}
              />
              {onlineCount} online
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
            {participants.map((p) => {
              const isP_Host = p.user_id === room.host_user_id
              const isP_CoHost = p.user_id === room.co_host_user_id
              const isViewer = p.user_id === viewerUserId
              const isOnline = onlineUserIds.has(p.user_id)
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--accent-soft)',
                    backgroundColor: 'rgba(15, 14, 12, 0.6)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="relative inline-flex">
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px]"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          opacity: isOnline ? 1 : 0.5,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {(p.display_name ?? 'A').trim().charAt(0).toUpperCase() || 'A'}
                      </span>
                      {isOnline && (
                        <span
                          aria-hidden
                          className="absolute -bottom-0 -right-0 h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--success)',
                            boxShadow: '0 0 0 1.5px #0F0E0C',
                          }}
                        />
                      )}
                    </span>
                    <span
                      className="truncate"
                      style={{ color: isOnline ? 'var(--text-1)' : 'var(--text-3)' }}
                    >
                      {p.display_name ?? 'Anônimo'}
                      {isViewer ? ' (você)' : ''}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {isP_Host && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                        style={{
                          borderColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        Host
                      </span>
                    )}
                    {isP_CoHost && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                        style={{
                          borderColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        Co-líder
                      </span>
                    )}
                    {isHost &&
                      !isP_Host &&
                      !isP_CoHost &&
                      room.state !== 'finalizada' &&
                      room.state !== 'encerrada' && (
                        <button
                          type="button"
                          onClick={() => void shared.setCoHost(p.user_id)}
                          disabled={pending}
                          className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] transition disabled:opacity-40"
                          style={{
                            borderColor: 'rgba(122, 115, 104, 0.4)',
                            color: 'var(--text-3)',
                          }}
                          aria-label={`Promover ${p.display_name ?? 'participante'} a co-líder`}
                        >
                          Promover
                        </button>
                      )}
                    {isHost && isP_CoHost && (
                      <button
                        type="button"
                        onClick={() => void shared.setCoHost(null)}
                        disabled={pending}
                        className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] transition disabled:opacity-40"
                        style={{
                          borderColor: 'rgba(122, 115, 104, 0.4)',
                          color: 'var(--text-3)',
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

        {displayError && (
          <div
            className="mx-auto mt-4 w-full max-w-md rounded-md border px-3 py-2 text-xs md:max-w-lg"
            role="alert"
            style={{
              borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
              color: 'var(--text-1)',
              backgroundColor: 'rgba(70, 20, 20, 0.4)',
            }}
          >
            {displayError}
          </div>
        )}

        {/* Ações principais do lobby / saída */}
        <div className="mx-auto mt-6 flex w-full max-w-md flex-wrap gap-2 md:max-w-lg">
          {room.state === 'aguardando' && isHost && (
            <button
              type="button"
              onClick={handleStart}
              disabled={pending}
              className="flex-1 rounded-lg px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {pending ? 'Iniciando…' : 'Iniciar terço'}
            </button>
          )}
          {room.state === 'aguardando' && !isHost && (
            <div
              className="flex-1 rounded-lg border px-5 py-3 text-center text-sm"
              style={{
                borderColor: 'var(--accent-soft)',
                color: 'var(--text-3)',
              }}
              role="status"
              aria-live="polite"
            >
              Aguardando o host iniciar…
            </div>
          )}
          {(room.state === 'finalizada' || room.state === 'encerrada') && (
            <Link
              href="/rosario/juntos"
              className="flex-1 rounded-lg border px-5 py-3 text-center text-sm transition"
              style={{
                borderColor: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              Voltar
            </Link>
          )}
          <button
            type="button"
            onClick={handleLeave}
            disabled={pending}
            className="rounded-lg border px-5 py-3 text-sm transition disabled:opacity-60"
            style={{
              borderColor: 'rgba(122, 115, 104, 0.4)',
              color: 'var(--text-3)',
            }}
          >
            Sair
          </button>
        </div>

        <style>{`
          .rosary-progress-fill { transition: width 500ms ease-out; }
          @media (prefers-reduced-motion: reduce) {
            .rosary-progress-fill { transition: none; }
          }
        `}</style>
      </div>
    </main>
  )
}

function noop() {}

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
    info.tone === 'active' ? 'var(--accent)' : info.tone === 'ended' ? 'var(--text-3)' : 'var(--text-3)'
  return (
    <div
      className="mb-4 rounded-full border px-4 py-2 text-center text-[10px] uppercase tracking-[0.25em]"
      style={{
        borderColor: 'var(--accent-soft)',
        color,
        fontFamily: 'var(--font-display)',
      }}
      role="status"
      aria-live="polite"
    >
      {info.label}
      {!canControl && state === 'aguardando' && ' — aguardando host'}
    </div>
  )
}
