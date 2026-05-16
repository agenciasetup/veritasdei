'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Mic,
  MicOff,
  Copy,
  Check,
  Users,
  LogOut,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import type {
  RosaryDecadeReaders,
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
import {
  useRoomVoiceChat,
  type UseRoomVoiceChatReturn,
} from '@/features/rosario/session/useRoomVoiceChat'

/**
 * `<SharedRoomView />` — UI da sala compartilhada.
 *
 * Layout (3 zonas):
 *   - Header sticky no topo: voltar, título, código, ações.
 *   - Body split:
 *       Desktop (lg+): coluna principal (terço+oração) + sidebar fina
 *         (participantes, áudio, leitores).
 *       Mobile: coluna única — terço+oração em cima, blocos colapsáveis
 *         (participantes/áudio/leitores) embaixo.
 *   - Footer sticky: barra de avanço (host/co-host) ou status.
 *
 * Estados:
 *   - aguardando: hero com código + CTA "Iniciar"; sidebar mostra quem
 *     está esperando + setup de áudio + atribuição de leitores.
 *   - rezando: terço/oração em foco; sidebar acompanha o ritmo da sala.
 *   - finalizada/encerrada: tela de conclusão.
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
  const { recordSession } = useRosaryHistoryRecord()
  const voice = useRoomVoiceChat(initialRoom.id, viewerUserId)

  // Histórico individual quando a sala finaliza
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
  const [codeCopied, setCodeCopied] = useState(false)

  const mysteryGroup = useMemo(
    () => MYSTERY_GROUPS.find((g) => g.id === room.mystery_set) ?? MYSTERY_GROUPS[0],
    [room.mystery_set],
  )

  const currentStep = ROSARY_STEPS[
    Math.min(Math.max(currentIndex, 0), ROSARY_STEPS.length - 1)
  ]

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
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1800)
    } catch {
      // ignore — contextos inseguros podem bloquear clipboard
    }
  }, [room.codigo])

  const copyShareLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/rosario/juntos/${room.codigo}`
      await navigator.clipboard.writeText(url)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1800)
    } catch {}
  }, [room.codigo])

  const handleStart = useCallback(() => {
    void shared.setState('rezando')
  }, [shared])

  const handleLeave = useCallback(async () => {
    try {
      voice.leaveVoice()
      await fetch(`/api/rosario/rooms/${room.codigo}/leave`, { method: 'POST' })
      window.location.href = '/rosario/juntos'
    } catch {
      setLocalError('Não foi possível sair.')
    }
  }, [room.codigo, voice])

  const displayError = error ?? localError
  const showSession = room.state === 'rezando' || room.state === 'finalizada'
  const progressPct = Math.round(
    ((currentIndex + (isCompleted ? 1 : 0)) / ROSARY_STEPS.length) * 100,
  )

  // Reader da dezena atual (badge sobre o prayer card)
  const decadeReaders: RosaryDecadeReaders = room.decade_readers ?? {}
  const currentDecade = currentStep.decade
  const currentReaderId =
    currentDecade && currentDecade >= 1 && currentDecade <= 5
      ? decadeReaders[String(currentDecade) as keyof RosaryDecadeReaders]
      : undefined
  const currentReader = currentReaderId
    ? participants.find((p) => p.user_id === currentReaderId) ?? null
    : null

  return (
    <main
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="bg-glow" aria-hidden />

      {/* ── HEADER (sticky) ─────────────────────────────────────────────── */}
      <header
        className="relative z-30 flex flex-shrink-0 items-center justify-between gap-2 px-4 safe-top md:px-6 lg:px-8"
        style={{
          height: '60px',
          borderBottom: '1px solid var(--border-1)',
          background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/rosario/juntos"
          className="flex items-center gap-1.5 text-xs transition"
          style={{ color: 'var(--text-3)', textDecoration: 'none' }}
          aria-label="Voltar"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">Voltar</span>
        </Link>

        <div className="min-w-0 flex-1 px-2 text-center">
          <h1
            className="truncate text-xs font-medium md:text-sm"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
            title={room.titulo ?? 'Terço compartilhado'}
          >
            {room.titulo ?? 'Terço compartilhado'}
          </h1>
          <p
            className="hidden truncate text-[10px] sm:block"
            style={{ color: 'var(--text-3)' }}
          >
            {mysteryGroup.name} · <span className="font-mono tracking-[0.18em]">{room.codigo}</span>
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={copyShareLink}
            className="flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[10px] uppercase tracking-[0.18em] transition active:scale-95"
            style={{
              borderColor: 'var(--accent-soft)',
              color: codeCopied ? 'var(--success)' : 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
            aria-label="Copiar link da sala"
            title="Copiar link da sala"
          >
            {codeCopied ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
            )}
            <span className="hidden md:inline">{codeCopied ? 'Copiado' : 'Convidar'}</span>
          </button>

          <button
            type="button"
            onClick={handleLeave}
            disabled={pending}
            className="flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[10px] uppercase tracking-[0.18em] transition active:scale-95 disabled:opacity-50"
            style={{
              borderColor: 'rgba(122, 115, 104, 0.4)',
              color: 'var(--text-3)',
              fontFamily: 'var(--font-display)',
            }}
            aria-label="Sair da sala"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* MAIN COLUMN */}
        <section
          className="flex min-w-0 flex-1 flex-col overflow-y-auto"
          aria-label="Conteúdo principal"
        >
          {showSession ? (
            <SessionMain
              currentStep={currentStep}
              currentIndex={currentIndex}
              isCompleted={isCompleted}
              completedBeadIds={completedBeadIds}
              mysteryGroup={mysteryGroup}
              canControl={canControl}
              progressPct={progressPct}
              onBeadSelect={
                canControl
                  ? (beadId: BeadId) => {
                      const step = firstStepForBead(beadId)
                      if (step) void shared.goTo(step.index)
                    }
                  : undefined
              }
              onAdvance={canControl ? () => void shared.advance() : undefined}
              currentReader={currentReader}
              currentDecade={currentDecade}
              roomState={room.state}
            />
          ) : (
            <LobbyMain
              codigo={room.codigo}
              codeCopied={codeCopied}
              copyCode={copyCode}
              isHost={isHost}
              canStart={isHost && !pending}
              onStart={handleStart}
              pending={pending}
              state={room.state}
              mysteryGroupName={mysteryGroup.name}
            />
          )}

          {/* Erro inline (não-bloqueante) */}
          {displayError && (
            <div
              className="mx-4 mb-4 mt-2 rounded-md border px-3 py-2 text-xs md:mx-8"
              role="alert"
              style={{
                borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
                color: 'var(--text-1)',
                backgroundColor: 'rgba(70, 20, 20, 0.35)',
              }}
            >
              {displayError}
            </div>
          )}

          {/* Mobile: blocos colapsáveis embaixo do conteúdo principal */}
          <div className="flex flex-col gap-3 px-4 pb-6 pt-4 lg:hidden md:px-8">
            <CollapsibleSection
              title="Participantes"
              count={participants.length}
              onlineCount={onlineUserIds.size}
              icon={<Users className="h-3.5 w-3.5" strokeWidth={2} />}
              defaultOpen={true}
            >
              <ParticipantsList
                participants={participants}
                viewerUserId={viewerUserId}
                hostUserId={room.host_user_id}
                coHostUserId={room.co_host_user_id}
                onlineUserIds={onlineUserIds}
                voice={voice}
                isHost={isHost}
                roomState={room.state}
                pending={pending}
                onPromote={(uid) => void shared.setCoHost(uid)}
                onDemote={() => void shared.setCoHost(null)}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Áudio em grupo"
              icon={<Mic className="h-3.5 w-3.5" strokeWidth={2} />}
              badge={voice.joined ? `${voice.voiceJoinedUserIds.size}` : undefined}
              defaultOpen={!voice.joined}
            >
              <VoicePanel voice={voice} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Leitores das dezenas"
              badge={`${Object.keys(decadeReaders).length}/5`}
              defaultOpen={false}
            >
              <ReadersList
                decadeReaders={decadeReaders}
                participants={participants}
                hostUserId={room.host_user_id}
                canEdit={canControl}
                currentDecade={
                  room.state === 'rezando' && currentDecade
                    ? (currentDecade as 1 | 2 | 3 | 4 | 5)
                    : null
                }
                onSet={shared.setDecadeReader}
                pending={pending}
              />
            </CollapsibleSection>
          </div>
        </section>

        {/* SIDEBAR (desktop only) */}
        <aside
          className="hidden h-full w-[340px] flex-shrink-0 flex-col overflow-y-auto lg:flex xl:w-[380px]"
          style={{
            borderLeft: '1px solid var(--border-1)',
            background: 'color-mix(in srgb, var(--surface-1) 88%, var(--surface-2))',
          }}
          aria-label="Painel da sala"
        >
          <div className="flex flex-col gap-4 p-5 xl:p-6">
            <SidebarSection
              title="Na sala"
              count={participants.length}
              onlineLabel={`${onlineUserIds.size} online`}
            >
              <ParticipantsList
                participants={participants}
                viewerUserId={viewerUserId}
                hostUserId={room.host_user_id}
                coHostUserId={room.co_host_user_id}
                onlineUserIds={onlineUserIds}
                voice={voice}
                isHost={isHost}
                roomState={room.state}
                pending={pending}
                onPromote={(uid) => void shared.setCoHost(uid)}
                onDemote={() => void shared.setCoHost(null)}
              />
            </SidebarSection>

            <SidebarSection title="Áudio em grupo">
              <VoicePanel voice={voice} />
            </SidebarSection>

            <SidebarSection
              title="Leitores"
              badge={`${Object.keys(decadeReaders).length}/5`}
            >
              <ReadersList
                decadeReaders={decadeReaders}
                participants={participants}
                hostUserId={room.host_user_id}
                canEdit={canControl}
                currentDecade={
                  room.state === 'rezando' && currentDecade
                    ? (currentDecade as 1 | 2 | 3 | 4 | 5)
                    : null
                }
                onSet={shared.setDecadeReader}
                pending={pending}
              />
            </SidebarSection>
          </div>
        </aside>
      </div>

      {/* ── FOOTER (sticky) ───────────────────────────────────────────── */}
      <Footer
        roomState={room.state}
        canControl={canControl}
        isHost={isHost}
        coHostName={room.co_host_user_id ? 'co-líder' : 'host'}
        currentIndex={currentIndex}
        totalSteps={ROSARY_STEPS.length}
        isCompleted={isCompleted}
        pending={pending}
        progressPct={progressPct}
        onBack={() => void shared.back()}
        onAdvance={() => void shared.advance()}
        onStart={handleStart}
      />

      <style>{`
        .rosary-progress-fill { transition: width 500ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .rosary-progress-fill { transition: none; }
        }
      `}</style>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   LOBBY MAIN (aguardando)
   ═══════════════════════════════════════════════════════════════════════ */

function LobbyMain({
  codigo,
  codeCopied,
  copyCode,
  isHost,
  canStart,
  onStart,
  pending,
  state,
  mysteryGroupName,
}: {
  codigo: string
  codeCopied: boolean
  copyCode: () => void
  isHost: boolean
  canStart: boolean
  onStart: () => void
  pending: boolean
  state: RosaryRoom['state']
  mysteryGroupName: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center md:px-12 md:py-12">
      <div
        className="mb-3 rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.3em]"
        style={{
          borderColor: 'var(--accent-soft)',
          color: 'var(--accent)',
          fontFamily: 'var(--font-display)',
        }}
        role="status"
      >
        {state === 'encerrada' ? 'Sala encerrada' : 'Aguardando início'}
      </div>

      <p
        className="mb-2 text-xs uppercase tracking-[0.25em]"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
      >
        {mysteryGroupName}
      </p>

      <h2
        className="mb-2 text-3xl md:text-4xl lg:text-5xl"
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.01em',
        }}
      >
        Código de convite
      </h2>

      <button
        type="button"
        onClick={copyCode}
        className="my-4 inline-flex items-center gap-3 rounded-2xl border px-6 py-4 transition active:scale-[0.98]"
        style={{
          borderColor: 'var(--accent-soft)',
          background: 'rgba(20, 18, 14, 0.55)',
        }}
        aria-label={`Copiar código ${codigo}`}
        title="Toque pra copiar"
      >
        <span
          className="font-mono text-4xl tracking-[0.4em] md:text-5xl lg:text-6xl"
          style={{
            color: 'var(--accent)',
            textShadow: '0 0 28px rgba(201, 168, 76, 0.3)',
          }}
        >
          {codigo}
        </span>
        <span
          aria-hidden
          style={{
            color: codeCopied ? 'var(--success)' : 'var(--text-3)',
          }}
        >
          {codeCopied ? (
            <Check className="h-5 w-5" strokeWidth={2.4} />
          ) : (
            <Copy className="h-5 w-5" strokeWidth={2} />
          )}
        </span>
      </button>

      <p className="mb-8 max-w-md text-sm" style={{ color: 'var(--text-3)' }}>
        Compartilhe o código ou o link da sala. Quem entrar verá o terço
        avançar ao vivo.
      </p>

      {state === 'aguardando' && isHost && (
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="rounded-xl px-8 py-4 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60 md:text-base"
          style={{
            background: 'linear-gradient(180deg, #C9A84C, #A88437)',
            color: 'var(--accent-contrast)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 32px -12px rgba(201, 168, 76, 0.5)',
          }}
        >
          {pending ? 'Iniciando…' : 'Iniciar terço'}
        </button>
      )}

      {state === 'aguardando' && !isHost && (
        <div
          className="rounded-xl border px-6 py-3 text-sm italic"
          role="status"
          aria-live="polite"
          style={{
            borderColor: 'var(--accent-soft)',
            color: 'var(--text-3)',
          }}
        >
          Aguardando o host iniciar…
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   SESSION MAIN (rezando / finalizada)
   ═══════════════════════════════════════════════════════════════════════ */

interface SessionMainProps {
  currentStep: (typeof ROSARY_STEPS)[number]
  currentIndex: number
  isCompleted: boolean
  completedBeadIds: ReadonlySet<BeadId>
  mysteryGroup: typeof MYSTERY_GROUPS[number]
  canControl: boolean
  progressPct: number
  onBeadSelect?: (beadId: BeadId) => void
  onAdvance?: () => void
  currentReader: RosaryRoomParticipant | null
  currentDecade?: number
  roomState: RosaryRoom['state']
}

function SessionMain({
  currentStep,
  currentIndex,
  isCompleted,
  completedBeadIds,
  mysteryGroup,
  canControl,
  progressPct,
  onBeadSelect,
  onAdvance,
  currentReader,
  currentDecade,
  roomState,
}: SessionMainProps) {
  if (roomState === 'finalizada' && isCompleted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center md:px-12">
        <div className="mb-3 text-4xl" aria-hidden>✦</div>
        <h2
          className="mb-2 text-2xl md:text-3xl"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Terço completo
        </h2>
        <p className="max-w-md text-sm md:text-base" style={{ color: 'var(--text-2)' }}>
          Que Nossa Senhora interceda por todos vocês.
        </p>
      </div>
    )
  }

  return (
    <div
      className="
        flex flex-1 flex-col gap-6 px-4 py-6
        md:px-8 md:py-8
        lg:flex-row lg:items-start lg:gap-10 lg:px-12 lg:py-10
        xl:gap-16
      "
    >
      {/* Esquerda — terço */}
      <div className="flex flex-shrink-0 flex-col items-center gap-4 lg:w-[44%] lg:max-w-[520px] lg:gap-6">
        <RosaryBeads
          currentBeadId={currentStep.beadId}
          completedBeadIds={completedBeadIds}
          onBeadSelect={onBeadSelect}
          className="
            h-auto w-full
            max-w-[280px] sm:max-w-[340px] md:max-w-[400px]
            lg:max-w-[460px] xl:max-w-[520px]
          "
          ariaDescription={`Terço — passo ${currentIndex + 1} de ${ROSARY_STEPS.length}`}
        />

        {/* Progress slim */}
        <div className="w-full max-w-[460px]" aria-hidden>
          <div
            className="h-px w-full overflow-hidden rounded-full"
            style={{ background: 'var(--border-1)' }}
          >
            <div
              className="rosary-progress-fill h-full"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
                boxShadow: '0 0 8px rgba(201, 168, 76, 0.4)',
              }}
            />
          </div>
          <div
            className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--text-3)' }}
          >
            <span>Passo {currentIndex + 1} / {ROSARY_STEPS.length}</span>
            <span>{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Direita — oração */}
      <div className="flex-1 lg:max-w-2xl lg:pt-2">
        {currentReader && currentDecade && (
          <ReaderBadge reader={currentReader} decade={currentDecade} />
        )}

        <PrayerStage
          step={currentStep}
          mysteryGroup={mysteryGroup}
          isCompleted={isCompleted}
          onAdvance={canControl ? onAdvance ?? noop : noop}
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
            O host avança as contas.
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════ */

function Footer({
  roomState,
  canControl,
  isHost,
  coHostName,
  currentIndex,
  totalSteps,
  isCompleted,
  pending,
  progressPct,
  onBack,
  onAdvance,
  onStart,
}: {
  roomState: RosaryRoom['state']
  canControl: boolean
  isHost: boolean
  coHostName: string
  currentIndex: number
  totalSteps: number
  isCompleted: boolean
  pending: boolean
  progressPct: number
  onBack: () => void
  onAdvance: () => void
  onStart: () => void
}) {
  if (roomState === 'finalizada' || roomState === 'encerrada') {
    return (
      <div
        className="relative z-20 flex flex-shrink-0 items-center justify-center px-4 safe-bottom md:px-8"
        style={{
          height: '72px',
          borderTop: '1px solid var(--border-1)',
          background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/rosario/juntos"
          className="rounded-lg border px-5 py-2.5 text-sm transition"
          style={{
            borderColor: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Voltar às salas
        </Link>
      </div>
    )
  }

  if (roomState === 'aguardando') {
    return (
      <div
        className="relative z-20 flex flex-shrink-0 items-center gap-3 px-4 safe-bottom md:px-8"
        style={{
          height: '72px',
          borderTop: '1px solid var(--border-1)',
          background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {isHost ? (
          <button
            type="button"
            onClick={onStart}
            disabled={pending}
            className="mx-auto h-12 max-w-md flex-1 rounded-xl text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60 lg:max-w-lg"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px -8px rgba(201, 168, 76, 0.5)',
            }}
          >
            {pending ? 'Iniciando…' : 'Iniciar terço'}
          </button>
        ) : (
          <div
            className="mx-auto flex-1 text-center text-xs italic"
            style={{ color: 'var(--text-3)' }}
            role="status"
            aria-live="polite"
          >
            Aguardando o host iniciar…
          </div>
        )}
      </div>
    )
  }

  // state === 'rezando'
  return (
    <div
      className="relative z-20 flex flex-shrink-0 items-center gap-2 px-4 safe-bottom md:px-8 lg:px-12"
      style={{
        height: '80px',
        borderTop: '1px solid var(--border-1)',
        background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {canControl && !isCompleted ? (
        <>
          <button
            type="button"
            onClick={onBack}
            disabled={pending || currentIndex === 0}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition active:scale-95 disabled:opacity-25 lg:h-14 lg:w-14"
            style={{
              borderColor: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
            aria-label="Voltar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onAdvance}
            disabled={pending}
            className="mx-auto h-12 max-w-md flex-1 rounded-xl text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60 lg:h-14 lg:max-w-lg lg:text-base"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px -8px rgba(201, 168, 76, 0.5)',
            }}
          >
            Avançar
          </button>

          <div
            className="hidden w-20 flex-shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.18em] md:block"
            style={{ color: 'var(--text-3)' }}
            aria-hidden
          >
            {currentIndex + 1}/{totalSteps}
            <br />
            {progressPct}%
          </div>
        </>
      ) : (
        <div
          className="mx-auto text-center text-xs italic"
          style={{ color: 'var(--text-3)' }}
          role="status"
          aria-live="polite"
        >
          O {coHostName} avança as contas. {currentIndex + 1}/{totalSteps}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   READER BADGE — exibido acima da prayer card durante a dezena
   ═══════════════════════════════════════════════════════════════════════ */

function ReaderBadge({
  reader,
  decade,
}: {
  reader: RosaryRoomParticipant
  decade: number
}) {
  return (
    <div
      className="mb-3 flex items-center gap-2.5 rounded-xl border px-3 py-2"
      role="status"
      aria-live="polite"
      style={{
        borderColor: 'var(--accent-soft)',
        background:
          'linear-gradient(90deg, rgba(201,168,76,0.10), rgba(201,168,76,0.02))',
      }}
    >
      <ParticipantAvatar
        name={reader.display_name}
        avatarUrl={reader.avatar_url ?? null}
        online
        size={28}
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
        >
          Lê a {decade}ª dezena
        </span>
        <span className="truncate text-sm" style={{ color: 'var(--text-1)' }}>
          {reader.display_name ?? 'Convidado'}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   SIDEBAR / SECTION HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function SidebarSection({
  title,
  count,
  onlineLabel,
  badge,
  children,
}: {
  title: string
  count?: number
  onlineLabel?: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="mb-2.5 flex items-center justify-between">
        <h2
          className="text-[10px] uppercase tracking-[0.25em]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
        >
          {title}
          {typeof count === 'number' && (
            <span className="ml-1.5" style={{ color: 'var(--text-3)' }}>
              ({count})
            </span>
          )}
        </h2>
        {onlineLabel && (
          <span
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--accent)' }}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 6px rgba(217,192,119,0.6)',
              }}
            />
            {onlineLabel}
          </span>
        )}
        {badge && (
          <span
            className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
            style={{
              borderColor: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  )
}

function CollapsibleSection({
  title,
  count,
  onlineCount,
  icon,
  badge,
  defaultOpen,
  children,
}: {
  title: string
  count?: number
  onlineCount?: number
  icon?: React.ReactNode
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <section
      className="rounded-xl border"
      style={{
        borderColor: 'var(--border-1)',
        background: 'rgba(20, 18, 14, 0.45)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon && (
            <span style={{ color: 'var(--text-3)' }}>{icon}</span>
          )}
          <span
            className="text-[11px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            {title}
          </span>
          {typeof count === 'number' && (
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-3)' }}
            >
              ({count}{typeof onlineCount === 'number' ? ` · ${onlineCount} online` : ''})
            </span>
          )}
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className="h-4 w-4 transition-transform"
          style={{
            color: 'var(--text-3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>
      {open && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border-1)' }}>
          {children}
        </div>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PARTICIPANTS LIST
   ═══════════════════════════════════════════════════════════════════════ */

function ParticipantsList({
  participants,
  viewerUserId,
  hostUserId,
  coHostUserId,
  onlineUserIds,
  voice,
  isHost,
  roomState,
  pending,
  onPromote,
  onDemote,
}: {
  participants: RosaryRoomParticipant[]
  viewerUserId: string
  hostUserId: string
  coHostUserId: string | null
  onlineUserIds: ReadonlySet<string>
  voice: UseRoomVoiceChatReturn
  isHost: boolean
  roomState: RosaryRoom['state']
  pending: boolean
  onPromote: (userId: string) => void
  onDemote: () => void
}) {
  const inactive = roomState === 'finalizada' || roomState === 'encerrada'
  return (
    <ul className="flex flex-col gap-1.5">
      {participants.map((p) => {
        const isP_Host = p.user_id === hostUserId
        const isP_CoHost = p.user_id === coHostUserId
        const isViewer = p.user_id === viewerUserId
        const isOnline = onlineUserIds.has(p.user_id)
        const inVoice = voice.voiceJoinedUserIds.has(p.user_id)
        const isMuted = voice.mutedUserIds.has(p.user_id)
        const isSpeaking = voice.speakingUserIds.has(p.user_id)

        return (
          <li
            key={p.id}
            className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition"
            style={{
              background: isSpeaking
                ? 'rgba(201, 168, 76, 0.08)'
                : 'transparent',
            }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <ParticipantAvatar
                name={p.display_name}
                avatarUrl={p.avatar_url ?? null}
                online={isOnline}
                speaking={isSpeaking}
                size={30}
              />
              <div className="flex min-w-0 flex-col leading-tight">
                <span
                  className="truncate text-[13px]"
                  style={{ color: isOnline ? 'var(--text-1)' : 'var(--text-3)' }}
                >
                  {p.display_name ?? 'Convidado'}
                  {isViewer && (
                    <span style={{ color: 'var(--text-3)' }}> · você</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {isP_Host && (
                    <span
                      className="uppercase tracking-[0.15em]"
                      style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
                    >
                      Host
                    </span>
                  )}
                  {isP_CoHost && (
                    <span
                      className="uppercase tracking-[0.15em]"
                      style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
                    >
                      Co-líder
                    </span>
                  )}
                  {inVoice && (
                    <span
                      aria-label={isMuted ? 'Microfone mudo' : 'Microfone ativo'}
                      style={{
                        color: isMuted ? 'var(--text-3)' : 'var(--accent)',
                      }}
                    >
                      {isMuted ? (
                        <MicOff className="h-3 w-3" strokeWidth={2.2} />
                      ) : (
                        <Mic className="h-3 w-3" strokeWidth={2.2} />
                      )}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Host actions */}
            {isHost && !isP_Host && !inactive && (
              <div className="flex flex-shrink-0 gap-1">
                {!isP_CoHost ? (
                  <button
                    type="button"
                    onClick={() => onPromote(p.user_id)}
                    disabled={pending}
                    className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] transition disabled:opacity-40"
                    style={{
                      borderColor: 'rgba(122, 115, 104, 0.4)',
                      color: 'var(--text-3)',
                    }}
                    aria-label={`Promover ${p.display_name ?? 'participante'} a co-líder`}
                  >
                    Promover
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onDemote}
                    disabled={pending}
                    className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] transition disabled:opacity-40"
                    style={{
                      borderColor: 'rgba(122, 115, 104, 0.4)',
                      color: 'var(--text-3)',
                    }}
                  >
                    Rebaixar
                  </button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VOICE PANEL — controle de áudio compactado pra sidebar/drawer
   ═══════════════════════════════════════════════════════════════════════ */

function VoicePanel({ voice }: { voice: UseRoomVoiceChatReturn }) {
  const [showHelp, setShowHelp] = useState(false)

  if (!voice.supported) {
    return (
      <p className="text-[11px] italic" style={{ color: 'var(--text-3)' }}>
        Áudio em grupo não suportado neste navegador.
      </p>
    )
  }

  const onCount = voice.voiceJoinedUserIds.size
  const speakingCount = voice.speakingUserIds.size
  const isDenied =
    voice.error?.toLowerCase().includes('permiss') ||
    voice.error?.toLowerCase().includes('denied') ||
    voice.error?.toLowerCase().includes('notallowed')

  return (
    <div className="flex flex-col gap-2.5">
      {voice.joined ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: voice.muted
                    ? 'rgba(122, 115, 104, 0.25)'
                    : 'var(--accent-soft)',
                  border: `1px solid ${voice.muted ? 'var(--border-1)' : 'var(--accent-soft)'}`,
                  color: voice.muted ? 'var(--text-3)' : 'var(--accent)',
                }}
              >
                {voice.muted ? (
                  <MicOff className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Mic className="h-4 w-4" strokeWidth={1.8} />
                )}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px]" style={{ color: 'var(--text-1)' }}>
                  Você está no áudio
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {onCount} {onCount === 1 ? 'pessoa' : 'pessoas'}
                  {speakingCount > 0 && ` · ${speakingCount} falando`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={voice.toggleMute}
              className="flex-1 rounded-lg border py-2 text-[10px] uppercase tracking-[0.18em] transition active:scale-[0.97]"
              style={{
                borderColor: voice.muted ? 'var(--accent)' : 'var(--accent-soft)',
                color: voice.muted ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'var(--font-display)',
                background: voice.muted ? 'var(--accent-soft)' : 'transparent',
              }}
              aria-pressed={voice.muted}
            >
              {voice.muted ? 'Tirar mudo' : 'Mudo'}
            </button>
            <button
              type="button"
              onClick={voice.leaveVoice}
              className="rounded-lg border px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition active:scale-[0.97]"
              style={{
                borderColor: 'rgba(122, 115, 104, 0.4)',
                color: 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Sair
            </button>
          </div>
        </>
      ) : (
        <>
          <p
            className="text-[12px] leading-snug"
            style={{ color: 'var(--text-2)' }}
          >
            Reze junto, em voz alta. Microfone só — sem vídeo.
          </p>

          <button
            type="button"
            onClick={() => void voice.joinVoice()}
            disabled={voice.joining}
            className="w-full rounded-lg py-2.5 text-[11px] font-semibold transition active:scale-[0.97] disabled:opacity-60"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {voice.joining ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Solicitando…
              </span>
            ) : (
              'Entrar com voz'
            )}
          </button>
        </>
      )}

      {voice.error && (
        <div
          className="flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11px]"
          role="alert"
          style={{
            borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)',
            color: 'var(--text-1)',
            backgroundColor: 'rgba(70, 20, 20, 0.3)',
          }}
        >
          <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <span>{voice.error}</span>
            {isDenied && (
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="self-start text-[10px] underline transition"
                style={{ color: 'var(--accent)' }}
              >
                Como habilitar?
              </button>
            )}
          </div>
        </div>
      )}

      {showHelp && (
        <div
          className="rounded-md border px-3 py-2 text-[11px] leading-relaxed"
          style={{
            borderColor: 'var(--border-1)',
            background: 'rgba(20, 18, 14, 0.6)',
            color: 'var(--text-2)',
          }}
        >
          <strong style={{ color: 'var(--text-1)' }}>Chrome / Edge:</strong>{' '}
          Clique no <span aria-hidden>🔒</span> ao lado da URL →{' '}
          <em>Permissões do site</em> → ative o microfone. Recarregue.
          <br />
          <strong style={{ color: 'var(--text-1)' }}>Safari:</strong>{' '}
          Menu Safari → Configurações deste site → permitir microfone.
          <br />
          <strong style={{ color: 'var(--text-1)' }}>Firefox:</strong>{' '}
          Ícone de microfone na barra → permitir.
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   READERS LIST — atribuição de leitor por dezena
   ═══════════════════════════════════════════════════════════════════════ */

function ReadersList({
  decadeReaders,
  participants,
  hostUserId,
  canEdit,
  currentDecade,
  onSet,
  pending,
}: {
  decadeReaders: RosaryDecadeReaders
  participants: RosaryRoomParticipant[]
  hostUserId: string
  canEdit: boolean
  currentDecade: 1 | 2 | 3 | 4 | 5 | null
  onSet: (decade: 1 | 2 | 3 | 4 | 5, userId: string | null) => Promise<void>
  pending: boolean
}) {
  const [pickerForDecade, setPickerForDecade] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const decades: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

  return (
    <div className="flex flex-col gap-1.5">
      {decades.map((d) => {
        const readerId = decadeReaders[String(d) as keyof RosaryDecadeReaders]
        const reader = readerId
          ? participants.find((p) => p.user_id === readerId) ?? null
          : null
        const isCurrent = currentDecade === d
        return (
          <div
            key={d}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
            style={{
              border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-1)'}`,
              background: isCurrent ? 'rgba(201,168,76,0.06)' : 'transparent',
            }}
          >
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px]"
              style={{
                background: isCurrent ? 'var(--accent)' : 'var(--accent-soft)',
                color: isCurrent ? 'var(--accent-contrast)' : 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {d}
            </span>

            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {reader ? (
                <>
                  <ParticipantAvatar
                    name={reader.display_name}
                    avatarUrl={reader.avatar_url ?? null}
                    size={22}
                  />
                  <span className="truncate text-[12px]" style={{ color: 'var(--text-1)' }}>
                    {reader.display_name ?? 'Convidado'}
                  </span>
                </>
              ) : (
                <span className="text-[11px] italic" style={{ color: 'var(--text-3)' }}>
                  Host lê
                </span>
              )}
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  setPickerForDecade((cur) => (cur === d ? null : d))
                }
                className="rounded px-1.5 py-1 text-[9px] uppercase tracking-[0.1em] transition"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                }}
                aria-label={`Atribuir leitor da ${d}ª dezena`}
              >
                {reader ? 'Trocar' : '+ Leitor'}
              </button>
            )}
          </div>
        )
      })}

      {pickerForDecade !== null && canEdit && (
        <div
          className="mt-1 rounded-lg border p-2.5"
          style={{
            borderColor: 'var(--accent-soft)',
            background: 'rgba(15, 14, 12, 0.7)',
          }}
        >
          <div
            className="mb-1.5 text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            Quem lê a {pickerForDecade}ª?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => {
              const isThisReader =
                decadeReaders[String(pickerForDecade) as keyof RosaryDecadeReaders] === p.user_id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={async () => {
                    await onSet(pickerForDecade, p.user_id)
                    setPickerForDecade(null)
                  }}
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition active:scale-[0.97] disabled:opacity-50"
                  style={{
                    borderColor: isThisReader ? 'var(--accent)' : 'var(--accent-soft)',
                    background: isThisReader ? 'var(--accent-soft)' : 'transparent',
                    color: 'var(--text-1)',
                  }}
                >
                  <ParticipantAvatar
                    name={p.display_name}
                    avatarUrl={p.avatar_url ?? null}
                    size={16}
                  />
                  <span className="truncate" style={{ maxWidth: '7rem' }}>
                    {p.display_name ?? 'Convidado'}
                    {p.user_id === hostUserId ? ' ★' : ''}
                  </span>
                </button>
              )
            })}
            {decadeReaders[String(pickerForDecade) as keyof RosaryDecadeReaders] && (
              <button
                type="button"
                onClick={async () => {
                  await onSet(pickerForDecade, null)
                  setPickerForDecade(null)
                }}
                disabled={pending}
                className="rounded-full px-2 py-0.5 text-[11px] italic"
                style={{ color: 'var(--text-3)' }}
              >
                Remover
              </button>
            )}
            <button
              type="button"
              onClick={() => setPickerForDecade(null)}
              className="rounded-full px-2 py-0.5 text-[11px]"
              style={{ color: 'var(--text-3)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!canEdit && (
        <p className="mt-1 text-[10px] italic" style={{ color: 'var(--text-3)' }}>
          Apenas host e co-líder atribuem leitores.
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PARTICIPANT AVATAR — foto + indicadores online/falando
   ═══════════════════════════════════════════════════════════════════════ */

function ParticipantAvatar({
  name,
  avatarUrl,
  online,
  speaking,
  size = 28,
}: {
  name: string | null
  avatarUrl: string | null
  online?: boolean
  speaking?: boolean
  size?: number
}) {
  const initial = (name ?? 'C').trim().charAt(0).toUpperCase() || 'C'
  return (
    <span
      className="relative inline-flex flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {speaking && (
        <span
          aria-hidden
          className="rosary-speaking-ring absolute"
          style={{
            inset: -3,
            borderRadius: '9999px',
            border: '2px solid var(--accent)',
            boxShadow: '0 0 10px rgba(201, 168, 76, 0.55)',
          }}
        />
      )}
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="rounded-full object-cover"
          style={{
            width: size,
            height: size,
            opacity: online === false ? 0.55 : 1,
            border: '1px solid var(--accent-soft)',
          }}
        />
      ) : (
        <span
          aria-hidden
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent)',
            opacity: online === false ? 0.5 : 1,
            fontFamily: 'var(--font-display)',
            fontSize: Math.round(size * 0.42),
          }}
        >
          {initial}
        </span>
      )}
      {online && (
        <span
          aria-hidden
          className="absolute -bottom-0 -right-0 rounded-full"
          style={{
            width: Math.max(6, Math.round(size * 0.22)),
            height: Math.max(6, Math.round(size * 0.22)),
            backgroundColor: 'var(--success)',
            boxShadow: '0 0 0 1.5px var(--surface-1)',
          }}
        />
      )}
      <style>{`
        @keyframes rosary-speaking-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.05); }
        }
        .rosary-speaking-ring {
          animation: rosary-speaking-pulse 1100ms ease-in-out infinite;
          transform-origin: center;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .rosary-speaking-ring { animation: none; opacity: 0.85; }
        }
      `}</style>
    </span>
  )
}

function noop() {}
