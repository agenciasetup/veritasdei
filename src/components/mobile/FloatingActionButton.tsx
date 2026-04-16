'use client'

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'

/**
 * `<FloatingActionButton />` — acima do BottomNav (apenas mobile).
 *
 * Modo simples: único botão, dispara `onPress`.
 * Modo multi-ação: tap expande em leque vertical; tap fora fecha.
 * Hide-on-scroll sincronizado com BottomNav (some ao scrollar para
 * baixo, volta ao scrollar para cima).
 */

export interface FabAction {
  icon: ReactNode
  label: string
  onPress: () => void
}

interface FloatingActionButtonProps {
  /** Ícone do botão principal quando fechado. Default: Plus */
  icon?: ReactNode
  /** Rótulo para screen readers (e tooltip no desktop). */
  label: string
  /** Lista de ações. Se única, comporta como botão simples sem leque. */
  actions: FabAction[]
  /** Badge numérico opcional (ex: lembretes pendentes). */
  badge?: number
  /** Esconde em < md (o FAB é mobile-only por default — `false` mostra no desktop também). */
  mobileOnly?: boolean
}

export default function FloatingActionButton({
  icon = <Plus className="w-6 h-6" />,
  label,
  actions,
  badge,
  mobileOnly = true,
}: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false)
  const [hidden, setHidden] = useState(false)
  const haptic = useHaptic()
  const lastScrollRef = useRef(0)

  const isSingle = actions.length === 1

  // Hide on scroll-down, show on scroll-up (mesma heurística do BottomNav).
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      const last = lastScrollRef.current
      if (current < 80) setHidden(false)
      else if (current > last + 8) setHidden(true)
      else if (current < last - 8) setHidden(false)
      lastScrollRef.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ESC fecha
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  function handleMainTap() {
    haptic.pulse('tap')
    if (isSingle) {
      actions[0].onPress()
    } else {
      setExpanded((v) => !v)
    }
  }

  return (
    <>
      {/* Backdrop quando expandido */}
      <AnimatePresence>
        {expanded && !isSingle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90]"
            style={{
              background: 'rgba(10,8,6,0.4)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            onClick={() => setExpanded(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed right-4 z-[91] flex flex-col items-end gap-3 ${
          mobileOnly ? 'md:hidden' : ''
        } transition-transform duration-200`}
        style={{
          bottom: 'calc(var(--bottom-nav-h, 72px) + 16px + env(safe-area-inset-bottom, 0px))',
          transform: hidden && !expanded ? 'translateY(120%)' : 'translateY(0)',
          pointerEvents: hidden && !expanded ? 'none' : 'auto',
        }}
      >
        {/* Leque de ações (apenas multi-acao) */}
        <AnimatePresence>
          {expanded && !isSingle && (
            <motion.ul
              className="flex flex-col items-end gap-3"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { transition: { staggerChildren: 0, staggerDirection: -1 } },
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {actions.map((a, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptic.pulse('selection')
                      setExpanded(false)
                      a.onPress()
                    }}
                    aria-label={a.label}
                    className="flex items-center gap-2 active:scale-95 touch-target-lg"
                  >
                    <span
                      className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                      style={{
                        background: 'rgba(15,14,12,0.92)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        color: '#F2EDE4',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {a.label}
                    </span>
                    <span
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 48,
                        height: 48,
                        background: 'rgba(15,14,12,0.95)',
                        border: '1px solid rgba(201,168,76,0.35)',
                        color: 'var(--gold)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                      }}
                    >
                      {a.icon}
                    </span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Botão principal */}
        <button
          type="button"
          onClick={handleMainTap}
          aria-label={expanded ? 'Fechar menu' : label}
          aria-expanded={!isSingle ? expanded : undefined}
          className="relative flex items-center justify-center rounded-full active:scale-90 transition-transform touch-target-lg"
          style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #D9C077 0%, #C9A84C 50%, #A88B3A 100%)',
            color: '#0F0E0C',
            boxShadow:
              '0 10px 24px rgba(201,168,76,0.3), 0 0 0 1px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <motion.span
            animate={{ rotate: expanded ? 45 : 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 300 }}
            className="flex items-center justify-center"
          >
            {expanded && !isSingle ? <X className="w-6 h-6" /> : icon}
          </motion.span>
          {typeof badge === 'number' && badge > 0 && !expanded && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: 'var(--color-danger)',
                color: '#fff',
                border: '2px solid rgba(15,14,12,0.95)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
