'use client'

import { useState } from 'react'
import { RosaryDashboard } from './RosaryDashboard'
import { RosarySession } from '@/features/rosario/session/RosarySession'

type PrayerType = 'terco' | 'rosario'

export function RosarioPageClient() {
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
        onExit={() => setSessionActive(false)}
      />
    )
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <RosaryDashboard onStartIndividual={handleStart} />
    </main>
  )
}
