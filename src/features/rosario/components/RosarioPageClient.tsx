'use client'

import { useState } from 'react'
import { RosaryDashboard } from './RosaryDashboard'
import { RosarySession } from '@/features/rosario/session/RosarySession'
import type { RosarySkin } from '@/features/rosario/data/skinTypes'

type PrayerType = 'terco' | 'rosario'

interface RosarioPageClientProps {
  /**
   * Skin ativa do usuário, carregada server-side. Pode ser `null` quando
   * o user está deslogado ou o DB ainda não tem skin canônica seeded —
   * `RosarySession` aplica `FALLBACK_THEME` nesse caso.
   */
  activeSkin: RosarySkin | null
}

export function RosarioPageClient({ activeSkin }: RosarioPageClientProps) {
  const [sessionActive, setSessionActive] = useState(false)
  const [fullRosary, setFullRosary] = useState(false)

  function handleStart(type: PrayerType) {
    setFullRosary(type === 'rosario')
    setSessionActive(true)
  }

  if (sessionActive) {
    return (
      <RosarySession
        fullRosary={fullRosary}
        activeSkin={activeSkin}
        onExit={() => setSessionActive(false)}
      />
    )
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <RosaryDashboard
        onStartIndividual={handleStart}
        activeSkin={activeSkin}
      />
    </main>
  )
}
