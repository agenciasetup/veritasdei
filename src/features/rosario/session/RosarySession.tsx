'use client'

import { useMemo, useState } from 'react'
import { ROSARY_STEPS, type BeadId } from '@/features/rosario/data/beadSequence'
import { RosaryBeads } from '@/features/rosario/components/RosaryBeads'
import { PrayerStage } from '@/features/rosario/components/PrayerStage'
import { useRosaryProgress } from '@/features/rosario/session/useRosaryProgress'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import type { MysterySet } from '@/features/rosario/data/types'

/**
 * `<RosarySession />` — orquestrador completo de uma sessão de terço.
 *
 * Junta as três peças já construídas nos sprints anteriores:
 *   - `useRosaryProgress`   (estado do passo atual)
 *   - `<RosaryBeads />`     (contas clicáveis e com navegação por teclado)
 *   - `<PrayerStage />`     (oração, mistério e botão de avançar)
 *
 * Essa tela substitui a `/rosario` antiga (lista colapsável estática) e
 * fica independente de persistência — `localStorage` entra no sprint 1.6.
 */

export function RosarySession() {
  const [mysterySetId, setMysterySetId] = useState<MysterySet>(
    () => getMysteryForToday().id,
  )
  const todayId = useMemo(() => getMysteryForToday().id, [])
  const mysteryGroup = useMemo(
    () => MYSTERY_GROUPS.find((g) => g.id === mysterySetId) ?? MYSTERY_GROUPS[0],
    [mysterySetId],
  )

  const {
    currentIndex,
    currentStep,
    currentBeadId,
    completedIndices,
    isFirst,
    isCompleted,
    totalSteps,
    advance,
    back,
    reset,
    goToBead,
  } = useRosaryProgress()

  const completedBeadIds = useMemo<ReadonlySet<BeadId>>(() => {
    const set = new Set<BeadId>()
    for (const idx of completedIndices) {
      const b = ROSARY_STEPS[idx].beadId
      if (b) set.add(b)
    }
    return set
  }, [completedIndices])

  const progressPct = Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalSteps) * 100)

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <h1
            className="font-serif text-3xl md:text-4xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Santo Rosário
          </h1>
          <p
            className="mt-2 text-xs md:text-sm"
            style={{ color: '#7A7368' }}
          >
            Medite os mistérios da vida de Cristo com Nossa Senhora
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <fieldset className="mb-6">
          <legend className="sr-only">Seleção de mistérios</legend>
          <div
            className="flex gap-1.5 rounded-xl p-1.5"
            role="radiogroup"
            aria-label="Mistérios do dia"
            style={{
              background: 'rgba(20,18,14,0.6)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            {MYSTERY_GROUPS.map((g) => {
              const active = g.id === mysterySetId
              const isToday = g.id === todayId
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setMysterySetId(g.id)
                    reset()
                  }}
                  className="min-w-0 flex-1 rounded-lg px-2 py-2 text-center transition"
                  style={{
                    background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                  }}
                >
                  <span
                    className="block text-[11px] font-semibold tracking-wide"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: active ? '#C9A84C' : '#7A7368',
                    }}
                  >
                    {g.name.replace('Mistérios ', '')}
                  </span>
                  <span
                    className="mt-0.5 block text-[9px] tracking-wider"
                    style={{
                      color: isToday ? '#D9C077' : 'rgba(122,115,104,0.5)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {isToday ? '● Hoje' : g.days}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mb-4">
          <RosaryBeads
            currentBeadId={currentBeadId}
            completedBeadIds={completedBeadIds}
            onBeadSelect={goToBead}
            className="mx-auto h-auto w-full max-w-md"
            ariaDescription={`Terço — passo ${currentIndex + 1} de ${totalSteps}`}
          />
        </div>

        <div className="mb-4" aria-hidden>
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: 'rgba(201,168,76,0.08)' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
              }}
            />
          </div>
          <div
            className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.25em]"
            style={{ color: '#7A7368' }}
          >
            Passo {currentIndex + 1} / {totalSteps}
          </div>
        </div>

        <PrayerStage
          step={currentStep}
          mysteryGroup={mysteryGroup}
          isCompleted={isCompleted}
          onAdvance={advance}
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={back}
            disabled={isFirst}
            className="flex-1 rounded-lg border px-4 py-2 text-sm transition disabled:opacity-30"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg border px-4 py-2 text-sm transition"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Reiniciar
          </button>
        </div>
      </div>
    </main>
  )
}
