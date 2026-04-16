'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Cross } from 'lucide-react'
import type { NovenaBuiltin, NovenaProgressRecord, NovenaDailyLogRecord } from '../data/types'

interface Props {
  novena: NovenaBuiltin
  progress: NovenaProgressRecord
  dailyLogs: Pick<NovenaDailyLogRecord, 'id' | 'day_number' | 'prayed_at'>[]
}

export function NovenaPrayerView({ novena, progress, dailyLogs }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const currentDay = progress.current_day
  const dayIndex = currentDay - 1
  const dia = novena.dias[dayIndex]
  const prayedDays = new Set(dailyLogs.map(l => l.day_number))
  const todayAlreadyPrayed = prayedDays.has(currentDay)
  const comTerco = progress.com_terco

  // Calcular dias perdidos (flexível: não zera, apenas avisa)
  const startDate = new Date(progress.started_at)
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const expectedDay = Math.min(daysSinceStart + 1, 9)
  const skippedDays = expectedDay > currentDay ? expectedDay - currentDay : 0

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
        setCompleted(true)
      } else {
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
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <div className="text-5xl mb-4" aria-hidden>&#10013;</div>
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
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#B8AFA2' }}>
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
            style={{ color: '#7A7368' }}
          >
            &larr; {novena.titulo}
          </Link>
          <h1
            className="text-xl md:text-2xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Dia {currentDay} de 9
          </h1>
          <div className="ornament-divider max-w-xs mx-auto mt-3">
            <span>&#10022;</span>
          </div>
        </header>

        {/* Progress dots */}
        <nav aria-label={`Progresso da novena: dia ${currentDay} de 9`} className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 9 }, (_, i) => {
            const dayNum = i + 1
            const isPrayed = prayedDays.has(dayNum)
            const isCurrent = dayNum === currentDay
            return (
              <div
                key={i}
                role="img"
                aria-label={`Dia ${dayNum}${isPrayed ? ', rezado' : isCurrent ? ', atual' : ', pendente'}`}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  background: isPrayed
                    ? '#C9A84C'
                    : isCurrent
                      ? 'rgba(201, 168, 76, 0.4)'
                      : 'rgba(242, 237, 228, 0.1)',
                  border: isCurrent ? '2px solid #C9A84C' : 'none',
                  transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            )
          })}
        </nav>

        {/* Aviso de dias perdidos */}
        {skippedDays > 0 && (
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
        {comTerco && (
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
              <p className="text-[11px] mt-0.5" style={{ color: '#7A7368' }}>
                Reze o Santo Rosário antes da oração do dia
              </p>
            </div>
            <span style={{ color: '#7A7368', fontSize: '14px' }} aria-hidden>→</span>
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
              style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}
            >
              Oração Inicial
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#B8AFA2' }}>
              {novena.oracaoInicial}
            </p>
          </section>
        )}

        {/* Dia da novena */}
        <article
          aria-label={dia.titulo}
          className="rounded-2xl p-6 mb-4"
          style={{
            background: 'rgba(20, 18, 14, 0.6)',
            border: '1px solid rgba(201, 168, 76, 0.18)',
          }}
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
        </article>

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
              style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}
            >
              Oração Final
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#B8AFA2' }}>
              {novena.oracaoFinal}
            </p>
          </section>
        )}

        {/* Botão "Rezei hoje" */}
        <div className="flex flex-col items-center gap-3 mt-6" role="status" aria-live="polite">
          {todayAlreadyPrayed ? (
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
              className="rounded-lg px-8 py-3.5 text-sm font-semibold transition disabled:opacity-50 active:scale-[0.97]"
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
            style={{ color: '#7A7368' }}
          >
            Minhas novenas em curso
          </Link>
        </div>
      </div>
    </main>
  )
}
