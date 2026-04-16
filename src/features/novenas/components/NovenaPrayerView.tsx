'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Cross } from 'lucide-react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import type {
  NovenaBuiltin,
  NovenaProgressRecord,
  NovenaDailyLogRecord,
} from '../data/types'
import { useHaptic } from '@/hooks/useHaptic'

interface Props {
  novena: NovenaBuiltin
  progress: NovenaProgressRecord
  dailyLogs: Pick<NovenaDailyLogRecord, 'id' | 'day_number' | 'prayed_at'>[]
}

export function NovenaPrayerView({ novena, progress, dailyLogs }: Props) {
  const router = useRouter()
  const haptic = useHaptic()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const currentDay = progress.current_day
  const prayedDays = new Set(dailyLogs.map((l) => l.day_number))

  // Dia exibido no topo — começa no dia atual; o usuário pode revisitar
  // dias passados via dot ou swipe (mas só pode REZAR no dia atual).
  const [viewedDay, setViewedDay] = useState(currentDay)
  // Quando o servidor avança o dia (após rezar), seguimos para ele.
  const [prevCurrentDay, setPrevCurrentDay] = useState(currentDay)
  if (prevCurrentDay !== currentDay) {
    setViewedDay(currentDay)
    setPrevCurrentDay(currentDay)
  }

  const dia = novena.dias[viewedDay - 1]
  const todayAlreadyPrayed = prayedDays.has(currentDay)
  const viewingCurrent = viewedDay === currentDay
  const viewingPast = viewedDay < currentDay
  const comTerco = progress.com_terco

  // Calcular dias perdidos (flexível: não zera, apenas avisa)
  const startDate = new Date(progress.started_at)
  const now = new Date()
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  )
  const expectedDay = Math.min(daysSinceStart + 1, 9)
  const skippedDays = expectedDay > currentDay ? expectedDay - currentDay : 0

  function gotoDay(target: number, withHaptic = true) {
    if (target < 1 || target > 9) return
    if (target > currentDay) return // dias futuros bloqueados
    if (target === viewedDay) return
    if (withHaptic) haptic.pulse('selection')
    setViewedDay(target)
  }

  function handleSwipe(_e: unknown, info: PanInfo) {
    const dx = info.offset.x
    const dy = info.offset.y
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return
    if (dx < 0) gotoDay(viewedDay + 1)
    else gotoDay(viewedDay - 1)
  }

  async function handlePray() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/novenas/pray', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_id: progress.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'day_already_prayed') {
          setError('Você já rezou este dia.')
        } else {
          setError(data.error ?? 'Erro ao registrar oração')
        }
        return
      }

      const data = await res.json()

      if (data.completed) {
        haptic.pulse('complete')
        setCompleted(true)
      } else {
        haptic.pulse('medium')
        router.refresh()
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <main
        className="relative min-h-screen w-full px-4 py-10 md:py-14"
        style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
      >
        <div className="bg-glow" aria-hidden />
        {/* Confetti dourado simples — partículas com Framer Motion */}
        <ConfettiBurst />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 220 }}
            className="text-5xl mb-4"
            aria-hidden
          >
            ✦
          </motion.div>
          <h1
            className="text-2xl md:text-3xl"
            style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
          >
            Novena Concluída!
          </h1>
          <p className="mt-4 text-sm" style={{ color: '#B8AFA2' }}>
            Você completou os 9 dias da {novena.titulo}. Que as graças alcançadas
            nesta novena frutifiquem em sua vida.
          </p>
          {novena.oracaoFinal && (
            <div
              className="mt-6 rounded-2xl p-5 text-left"
              style={{
                background: 'rgba(20, 18, 14, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.18)',
                borderLeft: '3px solid rgba(201, 168, 76, 0.4)',
              }}
            >
              <h3
                className="text-sm mb-2"
                style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
              >
                Oração Final
              </h3>
              <p
                className="text-xs leading-relaxed whitespace-pre-line"
                style={{ color: '#B8AFA2' }}
              >
                {novena.oracaoFinal}
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/novenas"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Outras novenas
            </Link>
            <Link
              href="/novenas/historico"
              className="rounded-lg border px-5 py-2.5 text-sm transition"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.35)',
                color: '#D9C077',
              }}
            >
              Histórico
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14 pb-24"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <Link
            href={`/novenas/${novena.slug}`}
            className="inline-block mb-3 text-xs transition"
            style={{ color: '#8A8378' }}
          >
            &larr; {novena.titulo}
          </Link>
          <h1
            className="text-xl md:text-2xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Dia {viewedDay} de 9
            {viewingPast && (
              <span
                className="ml-2 text-xs align-middle px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  color: '#C9A84C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                revisitando
              </span>
            )}
          </h1>
          <div className="ornament-divider max-w-xs mx-auto mt-3">
            <span>&#10022;</span>
          </div>
        </header>

        {/* Progress dots — tappable para dias passados */}
        <nav
          aria-label={`Progresso da novena: dia ${currentDay} de 9`}
          className="flex justify-center items-center gap-2.5 mb-6"
        >
          {Array.from({ length: 9 }, (_, i) => {
            const dayNum = i + 1
            const isPrayed = prayedDays.has(dayNum)
            const isCurrent = dayNum === currentDay
            const isViewed = dayNum === viewedDay
            const isFuture = dayNum > currentDay
            const accessible = !isFuture
            // Tamanhos: atual 12px, completos 8px, futuros 8px
            const size = isCurrent ? 12 : 8
            return (
              <button
                key={i}
                type="button"
                onClick={() => gotoDay(dayNum)}
                disabled={!accessible}
                aria-label={`Dia ${dayNum}${isPrayed ? ', rezado' : isCurrent ? ', atual' : ', pendente'}`}
                aria-current={isViewed ? 'step' : undefined}
                className="rounded-full transition-all touch-target flex items-center justify-center disabled:cursor-not-allowed"
                style={{
                  background: 'transparent',
                  padding: 8,
                }}
              >
                <span
                  className="block rounded-full transition-all"
                  style={{
                    width: size,
                    height: size,
                    background: isPrayed
                      ? '#C9A84C'
                      : isCurrent
                        ? 'rgba(201, 168, 76, 0.5)'
                        : 'rgba(242, 237, 228, 0.12)',
                    border: isViewed ? '2px solid #C9A84C' : 'none',
                    transform: isViewed ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: isViewed ? '0 0 12px rgba(201,168,76,0.45)' : 'none',
                  }}
                />
              </button>
            )
          })}
        </nav>

        {/* Aviso de dias perdidos */}
        {skippedDays > 0 && viewingCurrent && (
          <div
            className="rounded-xl p-3 mb-4 text-center"
            style={{
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
            }}
          >
            <p className="text-xs" style={{ color: '#D9C077' }}>
              {skippedDays === 1
                ? 'Você pulou 1 dia, mas não se preocupe — seu progresso continua.'
                : `Você pulou ${skippedDays} dias, mas não se preocupe — seu progresso continua.`}
            </p>
          </div>
        )}

        {/* Terço do dia (quando com_terco ativo) */}
        {comTerco && viewingCurrent && (
          <Link
            href="/rosario"
            className="flex items-center gap-4 rounded-xl p-4 mb-4 transition active:scale-[0.98]"
            style={{
              background: 'rgba(201, 168, 76, 0.06)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
              textDecoration: 'none',
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ background: 'rgba(201, 168, 76, 0.12)' }}
            >
              <Cross size={18} strokeWidth={1.5} style={{ color: '#C9A84C' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
                Terço do dia
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#8A8378' }}>
                Reze o Santo Rosário antes da oração do dia
              </p>
            </div>
            <span style={{ color: '#8A8378', fontSize: '14px' }} aria-hidden>
              →
            </span>
          </Link>
        )}

        {/* Oração Inicial */}
        {novena.oracaoInicial && (
          <section
            className="rounded-2xl p-5 mb-4"
            style={{
              background: 'rgba(20, 18, 14, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.12)',
              borderLeft: '3px solid rgba(201, 168, 76, 0.3)',
            }}
          >
            <h3
              className="text-xs mb-2 uppercase tracking-wider"
              style={{ color: '#8A8378', fontFamily: 'Cinzel, serif' }}
            >
              Oração Inicial
            </h3>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: '#B8AFA2' }}
            >
              {novena.oracaoInicial}
            </p>
          </section>
        )}

        {/* Dia da novena — swipe horizontal entre dias */}
        <AnimatePresence mode="wait">
          <motion.article
            key={viewedDay}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
            aria-label={dia.titulo}
            className="rounded-2xl p-6 mb-4"
            style={{
              background: 'rgba(20, 18, 14, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.18)',
              touchAction: 'pan-y',
            }}
            onPanEnd={handleSwipe}
          >
            <h2
              className="text-lg mb-4"
              style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
            >
              {dia.titulo}
            </h2>
            <div
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: '#F2EDE4' }}
            >
              {dia.texto}
            </div>
          </motion.article>
        </AnimatePresence>

        {/* Oração Final */}
        {novena.oracaoFinal && (
          <section
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(20, 18, 14, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.12)',
              borderLeft: '3px solid rgba(201, 168, 76, 0.3)',
            }}
          >
            <h3
              className="text-xs mb-2 uppercase tracking-wider"
              style={{ color: '#8A8378', fontFamily: 'Cinzel, serif' }}
            >
              Oração Final
            </h3>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: '#B8AFA2' }}
            >
              {novena.oracaoFinal}
            </p>
          </section>
        )}

        {/* Botão "Rezei hoje" — apenas no dia atual */}
        <div
          className="flex flex-col items-center gap-3 mt-6"
          role="status"
          aria-live="polite"
        >
          {!viewingCurrent ? (
            <button
              type="button"
              onClick={() => gotoDay(currentDay)}
              className="text-xs underline"
              style={{ color: '#C9A84C' }}
            >
              Voltar ao dia atual ({currentDay})
            </button>
          ) : todayAlreadyPrayed ? (
            <div className="text-center">
              <p className="text-sm" style={{ color: '#C9A84C' }}>
                Dia {currentDay} já registrado. Volte amanhã para o próximo dia.
              </p>
            </div>
          ) : (
            <button
              onClick={handlePray}
              disabled={loading}
              aria-busy={loading}
              className="rounded-lg px-8 py-3.5 text-sm font-semibold transition disabled:opacity-50 active:scale-[0.97] touch-target-lg"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              {loading
                ? 'Registrando...'
                : currentDay === 9
                  ? 'Rezei hoje — Concluir Novena'
                  : `Rezei hoje — Dia ${currentDay}`}
            </button>
          )}

          {error && (
            <p className="text-xs" role="alert" style={{ color: '#E57373' }}>
              {error}
            </p>
          )}

          <Link
            href="/novenas/minhas"
            className="text-xs transition mt-2"
            style={{ color: '#8A8378' }}
          >
            Minhas novenas em curso
          </Link>
        </div>
      </div>
    </main>
  )
}

/* ── Confetti dourado para conclusão ── */

function ConfettiBurst() {
  // Posições determinísticas distribuídas uniformemente — sem Math.random
  // (regra do React Compiler: render deve ser puro). O efeito visual ainda
  // é vivo porque cada peça tem duração e atraso únicos.
  const pieces = useMemo(() => {
    const N = 18
    return Array.from({ length: N }, (_, i) => {
      const t = i / N
      const startX = 8 + ((i * 53) % 84) // distribuído por mod-prime
      const drift = ((i % 5) - 2) * 12
      return {
        i,
        startX,
        drift,
        delay: t * 0.35,
        dur: 1.6 + ((i * 31) % 70) / 50,
      }
    })
  }, [])
  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map(({ i, startX, drift, delay, dur }) => (
        <motion.span
          key={i}
          initial={{ x: `${startX}vw`, y: '-10vh', opacity: 0, rotate: 0 }}
          animate={{
            x: `${startX + drift}vw`,
            y: '110vh',
            opacity: [0, 1, 1, 0],
            rotate: 360,
          }}
          transition={{ duration: dur, delay, ease: 'easeOut' }}
          className="absolute text-base"
          style={{
            color: i % 2 === 0 ? '#C9A84C' : '#D9C077',
            top: 0,
            left: 0,
          }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  )
}
