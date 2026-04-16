'use client'

import { type ReactNode, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useHaptic } from '@/hooks/useHaptic'

const TRIGGER_DISTANCE = 72
const MAX_PULL = 120

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: ReactNode
}

/**
 * Pull-to-refresh estilo iOS/Android. Usa o pan gesture do Framer Motion
 * sobre o container e exibe um indicador girando enquanto puxa.
 *
 * Só atira o refresh quando o usuário está no topo do scroll do `window`.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const haptic = useHaptic()
  const y = useMotionValue(0)
  const [refreshing, setRefreshing] = useState(false)
  const startedAtTopRef = useRef(false)

  // indicator opacity / rotation based on pull distance
  const indicatorOpacity = useTransform(y, [0, TRIGGER_DISTANCE], [0, 1])
  const indicatorRotate = useTransform(y, [0, MAX_PULL], [0, 360])
  const indicatorScale = useTransform(y, [0, TRIGGER_DISTANCE], [0.6, 1])

  function handlePanStart() {
    startedAtTopRef.current = window.scrollY <= 1
  }

  function handlePan(_: unknown, info: { delta: { y: number }; offset: { y: number } }) {
    if (!startedAtTopRef.current || refreshing) return
    if (info.offset.y <= 0) {
      y.set(0)
      return
    }
    // Resistência à medida que se aproxima do max
    const dampened = Math.min(MAX_PULL, info.offset.y * 0.55)
    y.set(dampened)
  }

  async function handlePanEnd() {
    if (!startedAtTopRef.current || refreshing) {
      y.set(0)
      return
    }
    const pulled = y.get()
    if (pulled >= TRIGGER_DISTANCE) {
      setRefreshing(true)
      haptic.pulse('medium')
      y.set(TRIGGER_DISTANCE)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        y.set(0)
      }
    } else {
      y.set(0)
    }
  }

  return (
    <motion.div
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      style={{ y, touchAction: 'pan-y' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      {/* Indicador */}
      <motion.div
        className="flex items-center justify-center pointer-events-none"
        style={{
          height: 56,
          marginTop: -56,
          opacity: indicatorOpacity,
        }}
        aria-hidden={!refreshing}
      >
        <motion.div
          className={refreshing ? 'animate-spin' : ''}
          style={{
            rotate: refreshing ? undefined : indicatorRotate,
            scale: indicatorScale,
            width: 28,
            height: 28,
            borderRadius: 9999,
            border: '2px solid rgba(201,168,76,0.25)',
            borderTopColor: 'var(--gold)',
          }}
        />
      </motion.div>
      {children}
    </motion.div>
  )
}

export default PullToRefresh
