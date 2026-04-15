'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ROSARY_STEPS,
  type BeadId,
  type RosaryStep,
} from '@/features/rosario/data/beadSequence'

export interface RosaryProgressState {
  /** Zero-based index into `ROSARY_STEPS`. */
  currentIndex: number
  /** The current step object (never null — sequence is non-empty). */
  currentStep: RosaryStep
  /** Convenience: bead id to highlight, or `null` for transitional prayers. */
  currentBeadId: BeadId | null
  /** True once the user has advanced past the final step. */
  isCompleted: boolean
  /** True while the user is on the very first step. */
  isFirst: boolean
  /** True while the user is on the final step (but hasn't advanced past it yet). */
  isLast: boolean
  /** Total number of steps in a full rosary. */
  totalSteps: number
  /** Set of indices already prayed (strictly less than `currentIndex`). */
  completedIndices: ReadonlySet<number>
}

export interface RosaryProgressControls {
  /** Advance one step. On the last step, marks the rosary as completed. */
  advance: () => void
  /** Go back one step. Does nothing at index 0. Clears `isCompleted` if set. */
  back: () => void
  /** Jump to an arbitrary index. Clamped into range. Clears `isCompleted`. */
  goTo: (index: number) => void
  /** Jump to the first step whose `beadId` matches. No-op if not found. */
  goToBead: (beadId: BeadId) => void
  /** Reset back to the beginning. */
  reset: () => void
}

export type UseRosaryProgressReturn = RosaryProgressState & RosaryProgressControls

const LAST_INDEX = ROSARY_STEPS.length - 1

function clampIndex(n: number): number {
  if (Number.isNaN(n)) return 0
  if (n < 0) return 0
  if (n > LAST_INDEX) return LAST_INDEX
  return Math.floor(n)
}

/**
 * Tracks progress through a single rosary session.
 *
 * This hook is deliberately UI-free and persistence-free. Persistence
 * (`localStorage`, Supabase) lands in later sprints.
 */
export function useRosaryProgress(initialIndex = 0): UseRosaryProgressReturn {
  const [currentIndex, setCurrentIndex] = useState<number>(() => clampIndex(initialIndex))
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const advance = useCallback(() => {
    setCurrentIndex((i) => {
      if (i >= LAST_INDEX) {
        setIsCompleted(true)
        return i
      }
      return i + 1
    })
  }, [])

  const back = useCallback(() => {
    setIsCompleted(false)
    setCurrentIndex((i) => (i <= 0 ? 0 : i - 1))
  }, [])

  const goTo = useCallback((index: number) => {
    setIsCompleted(false)
    setCurrentIndex(clampIndex(index))
  }, [])

  const goToBead = useCallback((beadId: BeadId) => {
    const step = ROSARY_STEPS.find((s) => s.beadId === beadId)
    if (!step) return
    setIsCompleted(false)
    setCurrentIndex(step.index)
  }, [])

  const reset = useCallback(() => {
    setIsCompleted(false)
    setCurrentIndex(0)
  }, [])

  const currentStep = ROSARY_STEPS[currentIndex]

  const completedIndices = useMemo<ReadonlySet<number>>(() => {
    const set = new Set<number>()
    for (let i = 0; i < currentIndex; i++) set.add(i)
    if (isCompleted) set.add(LAST_INDEX)
    return set
  }, [currentIndex, isCompleted])

  return {
    currentIndex,
    currentStep,
    currentBeadId: currentStep.beadId,
    isCompleted,
    isFirst: currentIndex === 0,
    isLast: currentIndex === LAST_INDEX,
    totalSteps: ROSARY_STEPS.length,
    completedIndices,
    advance,
    back,
    goTo,
    goToBead,
    reset,
  }
}
