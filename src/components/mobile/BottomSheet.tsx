'use client'

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion'

/**
 * `<BottomSheet />` — primitivo iOS-style com snap detents.
 *
 * Detents são frações da altura de viewport (0..1). O sheet se estabiliza
 * em qualquer um deles via spring; um swipe para baixo abaixo do menor
 * detent dispara `onDismiss` (a menos que `preventDismiss`).
 *
 * - Drag handle visível por padrão (40×4 dourado)
 * - Backdrop com blur, tap-to-dismiss
 * - Safe-area inset no padding bottom
 * - Scroll interno habilitado quando o conteúdo excede
 * - Keyboard avoidance via VisualViewport
 */

export interface BottomSheetProps {
  open: boolean
  onDismiss: () => void
  /** Frações de viewport (0..1). Default: [0.5, 0.92] */
  detents?: number[]
  /** Detent inicial — índice ou número */
  initialDetent?: number
  /** Bloqueia o swipe-to-dismiss (útil para forms com mudanças não salvas) */
  preventDismiss?: boolean
  /** Mostra o handle de arrastar */
  handle?: boolean
  /** Aria label/title */
  label?: string
  children: ReactNode
}

const DEFAULT_DETENTS = [0.5, 0.92]

export function BottomSheet({
  open,
  onDismiss,
  detents = DEFAULT_DETENTS,
  initialDetent = 0,
  preventDismiss = false,
  handle = true,
  label = 'Painel',
  children,
}: BottomSheetProps) {
  const sortedDetents = useMemo(
    () => [...detents].sort((a, b) => a - b),
    [detents],
  )

  const labelId = useId()
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // viewport height — atualizado em resize / orientação
  const [vh, setVh] = useState(0)
  // ajuste para teclado virtual (subtraído da altura efetiva)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  useEffect(() => {
    const update = () => setVh(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardOffset(offset)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [open])

  // Posições absolutas em px (medidas do topo do sheet — 0 = totalmente aberto no detent)
  // y é o deslocamento do sheet a partir da posição "expandido máximo".
  // Cada detent corresponde a uma altura: heightFor(d) = d * vh
  // Quando aberto no detent d, o sheet ocupa d*vh px de altura visível.
  // Posicionamos o sheet com height = maxDetent * vh, e fazemos translate.
  const maxDetent = sortedDetents[sortedDetents.length - 1]
  const sheetHeight = maxDetent * vh
  const detentYs = useMemo(
    () => sortedDetents.map((d) => sheetHeight - d * vh),
    [sortedDetents, sheetHeight, vh],
  )

  const initialIndex = Math.min(
    Math.max(0, Math.floor(initialDetent)),
    sortedDetents.length - 1,
  )

  const y = useMotionValue(0)
  const [activeDetent, setActiveDetent] = useState(initialIndex)

  // Sincroniza a posição quando a janela mede ou quando abrimos
  useEffect(() => {
    if (!open || vh === 0) return
    const target = detentYs[activeDetent] ?? detentYs[0] ?? 0
    y.set(target)
    // só ao abrir — após isso o usuário controla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vh])

  // Backdrop opacity proporcional ao quão aberto está
  const backdropOpacity = useTransform(y, (val) => {
    if (sheetHeight === 0) return 0.6
    const visible = Math.max(0, sheetHeight - val) / sheetHeight
    return Math.min(0.6, 0.15 + visible * 0.45)
  })

  const snapTo = useCallback(
    (index: number) => {
      const target = detentYs[index]
      if (target === undefined) return
      setActiveDetent(index)
      // animação de spring via framer-motion
      const animation = y.set
      animation.call(y, target)
    },
    [detentYs, y],
  )

  const handleDragEnd = useCallback(
    (
      _e: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { y: number }; velocity: { y: number } },
    ) => {
      const current = y.get()
      const velocity = info.velocity.y

      // Velocidade alta para baixo → tenta dismissar
      if (velocity > 700 && !preventDismiss) {
        onDismiss()
        return
      }

      // Encontra o detent mais próximo, considerando velocidade
      const projected = current + velocity * 0.2
      let nearestIdx = 0
      let nearestDist = Infinity
      for (let i = 0; i < detentYs.length; i++) {
        const d = Math.abs(detentYs[i] - projected)
        if (d < nearestDist) {
          nearestDist = d
          nearestIdx = i
        }
      }

      // Se passou abaixo do menor detent significativamente, dismissa
      const lowestY = detentYs[0]
      if (current > lowestY + sheetHeight * 0.18 && !preventDismiss) {
        onDismiss()
        return
      }

      snapTo(nearestIdx)
    },
    [y, detentYs, snapTo, onDismiss, preventDismiss, sheetHeight],
  )

  // ESC fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventDismiss) onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onDismiss, preventDismiss])

  // Lock scroll no body enquanto aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && vh > 0 && (
        <div
          className="fixed inset-0 z-[200]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,1)',
              opacity: backdropOpacity,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!preventDismiss) onDismiss()
            }}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="absolute left-0 right-0 bottom-0 mx-auto w-full max-w-xl rounded-t-3xl outline-none flex flex-col"
            style={{
              y,
              height: sheetHeight,
              marginBottom: keyboardOffset > 0 ? -keyboardOffset : 0,
              background: 'var(--surface-2)',
              borderTop: '1px solid var(--border-1)',
              boxShadow: '0 -16px 64px rgba(0,0,0,0.35)',
              touchAction: 'none',
            }}
            initial={{ y: vh }}
            animate={{ y: detentYs[activeDetent] ?? 0 }}
            exit={{ y: vh }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: detentYs[detentYs.length - 1], bottom: vh }}
            dragElastic={{ top: 0.05, bottom: 0.25 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag affordance — apenas esta zona inicia o drag */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              {handle && (
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--border-1)' }}
                  aria-hidden="true"
                />
              )}
              <span id={labelId} className="sr-only">
                {label}
              </span>
            </div>

            {/* Conteúdo scrollável */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain px-5"
              style={{
                paddingBottom:
                  keyboardOffset > 0
                    ? '1.5rem'
                    : 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
                touchAction: 'pan-y',
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default BottomSheet
