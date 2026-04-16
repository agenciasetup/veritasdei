'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Type,
} from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'

export interface CarouselSlide {
  id: string
  content: React.ReactNode
}

interface CarouselProps {
  slides: CarouselSlide[]
  onClose?: () => void
  /** Chave única para persistir progresso/dicas em localStorage */
  storageKey?: string
}

const SWIPE_HINT_KEY_PREFIX = 'veritasdei:carousel:swipe-hint:'
const FONT_KEY = 'veritasdei:carousel:font-scale'
type FontScale = 'sm' | 'md' | 'lg'

const FONT_SCALE: Record<FontScale, number> = {
  sm: 0.92,
  md: 1.0,
  lg: 1.14,
}

function loadFontScale(): FontScale {
  if (typeof window === 'undefined') return 'md'
  try {
    const raw = window.localStorage.getItem(FONT_KEY)
    if (raw === 'sm' || raw === 'md' || raw === 'lg') return raw
  } catch {}
  return 'md'
}

function saveFontScale(s: FontScale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FONT_KEY, s)
  } catch {}
}

function loadHintDismissed(key: string | undefined): boolean {
  if (!key || typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(SWIPE_HINT_KEY_PREFIX + key) === '1'
  } catch {
    return true
  }
}

function saveHintDismissed(key: string | undefined): void {
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SWIPE_HINT_KEY_PREFIX + key, '1')
  } catch {}
}

export default function Carousel({ slides, onClose, storageKey }: CarouselProps) {
  const haptic = useHaptic()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [fontScale, setFontScale] = useState<FontScale>(() => loadFontScale())
  const [hintDismissed, setHintDismissed] = useState<boolean>(() =>
    loadHintDismissed(storageKey),
  )
  const touchStart = useRef(0)

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= slides.length) return
      setDirection(i > current ? 'right' : 'left')
      setCurrent(i)
      haptic.pulse('selection')
      if (!hintDismissed) {
        setHintDismissed(true)
        saveHintDismissed(storageKey)
      }
    },
    [current, slides.length, haptic, hintDismissed, storageKey],
  )

  const prev = useCallback(() => go(current - 1), [current, go])
  const next = useCallback(() => go(current + 1), [current, go])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (diff > 40) next()
    else if (diff < -40) prev()
  }

  function cycleFont() {
    const order: FontScale[] = ['sm', 'md', 'lg']
    const idx = order.indexOf(fontScale)
    const nextScale = order[(idx + 1) % order.length]
    setFontScale(nextScale)
    saveFontScale(nextScale)
    haptic.pulse('tap')
  }

  const progressPct = slides.length > 1 ? (current / (slides.length - 1)) * 100 : 100

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6">
      {/* Top progress bar + Aa toggle */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.12)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={cycleFont}
          aria-label={`Tamanho de fonte: ${fontScale === 'sm' ? 'pequeno' : fontScale === 'md' ? 'médio' : 'grande'}`}
          title="Tamanho de fonte"
          className="flex items-center justify-center w-10 h-10 rounded-xl active:scale-95 touch-target"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: 'var(--gold)',
          }}
        >
          <Type
            className={
              fontScale === 'sm' ? 'w-3.5 h-3.5' : fontScale === 'md' ? 'w-4 h-4' : 'w-5 h-5'
            }
          />
        </button>
      </div>

      {/* Viewport — com edge shadows laterais */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(16,16,16,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.12)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          minHeight: 'min(68vh, calc(100vh - 160px))',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Edge shadow esquerda */}
        {current > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 bottom-0 w-8 z-10"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.5), transparent)',
            }}
          />
        )}
        {/* Edge shadow direita */}
        {current < slides.length - 1 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 z-10"
            style={{
              background:
                'linear-gradient(to left, rgba(0,0,0,0.5), transparent)',
            }}
          />
        )}

        {/* Slide content */}
        <div
          key={slides[current]?.id}
          className="p-6 md:p-12 lg:p-16 overflow-y-auto"
          style={{
            maxHeight: 'min(80vh, calc(100vh - 160px))',
            fontSize: `${FONT_SCALE[fontScale]}rem`,
            animation: `slideIn${direction === 'right' ? 'Right' : 'Left'} 0.35s ease-out`,
          }}
        >
          {slides[current]?.content}
        </div>

        {/* Swipe hint — só no primeiro slide e antes do usuário interagir */}
        {!hintDismissed && current === 0 && slides.length > 1 && (
          <div
            className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full z-20"
            style={{
              background: 'rgba(201,168,76,0.18)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: '#C9A84C',
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              animation: 'swipeHintPulse 2.4s ease-in-out infinite',
            }}
            aria-hidden
          >
            Deslize
            <ChevronsRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 flex-shrink-0 touch-target-lg active:scale-95"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#C9A84C',
          }}
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots tappable */}
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-[60vw]">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="rounded-full transition-all duration-300 touch-target flex items-center justify-center"
              style={{ padding: 6 }}
              aria-label={`Slide ${i + 1}`}
              aria-current={current === i ? 'true' : undefined}
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: current === i ? '28px' : '8px',
                  height: '8px',
                  background: current === i ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 flex-shrink-0 touch-target-lg active:scale-95"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#C9A84C',
          }}
          aria-label="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Counter */}
      <p
        className="text-center mt-3 text-sm tracking-wider"
        style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
      >
        {current + 1} / {slides.length}
      </p>

      {/* Animations */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes swipeHintPulse {
          0%, 100% { opacity: 0.6; transform: translateX(0); }
          50%      { opacity: 1;   transform: translateX(-4px); }
        }
      `}</style>
    </div>
  )
}
