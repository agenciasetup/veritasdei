'use client'

import { useMemo, useState } from 'react'
import { ROSARY_STEPS, type BeadId } from '@/features/rosario/data/beadSequence'
import { RosaryBeads } from '@/features/rosario/components/RosaryBeads'
import { PrayerStage } from '@/features/rosario/components/PrayerStage'
import { useRosaryProgress } from '@/features/rosario/session/useRosaryProgress'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import type { MysterySet } from '@/features/rosario/data/types'

/**
 * TEMPORARY preview page for sprint 1.3–1.4 — wires the interactive beads to
 * the progress hook and renders the current prayer/mystery via `<PrayerStage />`.
 *
 * Will be deleted / replaced by the full `<RosarySession />` orchestrator
 * in sprint 1.5.
 */

export function RosaryPreview() {
  const [mysterySetId, setMysterySetId] = useState<MysterySet>(
    () => getMysteryForToday().id,
  )
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

  return (
    <main
      className="min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="mx-auto max-w-md">
        <header className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: '#7A7368' }}>
            Preview interativo — sprint 1.4
          </p>
          <h1 className="mt-2 font-serif text-2xl" style={{ color: '#F2EDE4' }}>
            Terço interativo
          </h1>
          <p className="mt-2 text-xs" style={{ color: '#7A7368' }}>
            Clique em qualquer conta para pular. Use <kbd>Tab</kbd> para navegar, <kbd>Enter</kbd> ou
            <kbd> Espaço</kbd> para selecionar.
          </p>
        </header>

        <fieldset className="mb-6">
          <legend className="mb-2 text-[10px] uppercase tracking-[0.25em]" style={{ color: '#7A7368' }}>
            Mistérios
          </legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Seleção de mistérios">
            {MYSTERY_GROUPS.map((g) => {
              const active = g.id === mysterySetId
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMysterySetId(g.id)}
                  className="rounded-lg border px-3 py-2 text-xs transition"
                  style={{
                    borderColor: active ? '#D9C077' : 'rgba(201,168,76,0.25)',
                    backgroundColor: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: active ? '#F2EDE4' : '#7A7368',
                  }}
                >
                  {g.name.replace('Mistérios ', '')}
                </button>
              )
            })}
          </div>
        </fieldset>

        <RosaryBeads
          currentBeadId={currentBeadId}
          completedBeadIds={completedBeadIds}
          onBeadSelect={goToBead}
          className="w-full h-auto"
          ariaDescription={`Terço — passo ${currentIndex + 1} de ${totalSteps}`}
        />

        <div
          className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ color: '#7A7368' }}
          aria-live="polite"
        >
          Passo {currentIndex + 1} / {totalSteps}
        </div>

        <div className="mt-3">
          <PrayerStage
            step={currentStep}
            mysteryGroup={mysteryGroup}
            isCompleted={isCompleted}
            onAdvance={advance}
          />
        </div>

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
