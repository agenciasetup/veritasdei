'use client'

import { useMemo } from 'react'
import { ROSARY_STEPS, type BeadId } from '@/features/rosario/data/beadSequence'
import { RosaryBeads } from '@/features/rosario/components/RosaryBeads'
import { useRosaryProgress } from '@/features/rosario/session/useRosaryProgress'

/**
 * TEMPORARY preview page for sprint 1.3 — wires the interactive beads to
 * the progress hook so you can click around and validate interaction.
 *
 * Will be deleted / replaced by the full `<RosarySession />` orchestrator
 * in sprint 1.5.
 */

const STEP_LABELS: Record<string, string> = {
  sign_of_cross: 'Sinal da Cruz',
  creed: 'Credo',
  our_father: 'Pai Nosso',
  hail_mary: 'Ave Maria',
  glory: 'Glória ao Pai',
  fatima: 'Oração de Fátima',
  mystery_announce: 'Anúncio do mistério',
  hail_holy_queen: 'Salve Rainha',
  final_prayer: 'Oração final',
}

export function RosaryPreview() {
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

  const stepLabel = STEP_LABELS[currentStep.type] ?? currentStep.type

  return (
    <main
      className="min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="mx-auto max-w-md">
        <header className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: '#7A7368' }}>
            Preview interativo — sprint 1.3
          </p>
          <h1 className="mt-2 font-serif text-2xl" style={{ color: '#F2EDE4' }}>
            Terço interativo
          </h1>
          <p className="mt-2 text-xs" style={{ color: '#7A7368' }}>
            Clique em qualquer conta para pular. Use <kbd>Tab</kbd> para navegar, <kbd>Enter</kbd> ou
            <kbd> Espaço</kbd> para selecionar.
          </p>
        </header>

        <RosaryBeads
          currentBeadId={currentBeadId}
          completedBeadIds={completedBeadIds}
          onBeadSelect={goToBead}
          className="w-full h-auto"
          ariaDescription={`Terço — ${stepLabel} (passo ${currentIndex + 1} de ${totalSteps})`}
        />

        <section
          className="mt-6 rounded-2xl border p-5"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.6)',
          }}
          aria-live="polite"
        >
          <div
            className="text-[10px] uppercase tracking-[0.25em]"
            style={{ color: '#7A7368' }}
          >
            Passo atual
          </div>
          <div
            className="mt-1 font-mono text-sm"
            style={{ color: '#D9C077' }}
          >
            {currentIndex + 1} / {totalSteps}
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <div>
              <span style={{ color: '#7A7368' }}>Tipo: </span>
              <span>{stepLabel}</span>
            </div>
            {currentStep.decade !== undefined && (
              <div>
                <span style={{ color: '#7A7368' }}>Mistério: </span>
                <span>{currentStep.decade}º</span>
              </div>
            )}
            {currentStep.decadePosition !== undefined && (
              <div>
                <span style={{ color: '#7A7368' }}>Ave Maria: </span>
                <span>
                  {currentStep.decadePosition} / 10
                </span>
              </div>
            )}
            <div>
              <span style={{ color: '#7A7368' }}>Conta: </span>
              <span className="font-mono text-xs">{currentBeadId ?? '—'}</span>
            </div>
            <div>
              <span style={{ color: '#7A7368' }}>Prayer ID: </span>
              <span className="font-mono text-xs">{currentStep.prayerId ?? '—'}</span>
            </div>
          </div>

          {isCompleted && (
            <div
              className="mt-3 italic"
              style={{ color: '#D9C077' }}
            >
              Terço completo. ✦
            </div>
          )}
        </section>

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
            onClick={advance}
            disabled={isCompleted}
            className="flex-[2] rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-30"
            style={{
              backgroundColor: '#C9A84C',
              color: '#0F0E0C',
            }}
          >
            Avançar
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border px-4 py-2 text-sm transition"
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
