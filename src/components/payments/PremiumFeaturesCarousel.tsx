'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Compass,
  Layers,
  MapPinned,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'

type Feature = {
  id: string
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  items: string[]
}

const FEATURES: Feature[] = [
  {
    id: 'aprofundamento',
    icon: BookOpen,
    eyebrow: 'Aprofundamento',
    title: 'Teologia com profundidade',
    description:
      'Estude com os maiores mestres da Igreja — do Doutor Angélico aos Padres da tradição.',
    items: ['Suma Teológica de São Tomás', 'Dogmas da fé católica', 'Doutores da Igreja'],
  },
  {
    id: 'quizzes',
    icon: Brain,
    eyebrow: 'Formação ativa',
    title: 'Trilhas guiadas com quizzes',
    description:
      'Aprenda de forma estruturada com trilhas temáticas e teste o que aprendeu em cada etapa.',
    items: ['Percursos progressivos', 'Quizzes ao fim de cada lição', 'Acompanhe seu progresso'],
  },
  {
    id: 'materiais',
    icon: Layers,
    eyebrow: 'Materiais',
    title: 'Estudo por temas',
    description:
      'Mergulhe em um pilar de cada vez — com conteúdo rico, ilustrado e com referências.',
    items: ['Mandamentos e Sacramentos', 'Virtudes e Pecados capitais', 'Obras de Misericórdia'],
  },
  {
    id: 'metodos',
    icon: Compass,
    eyebrow: 'Métodos',
    title: 'Catecismos e preceitos',
    description:
      'O método consagrado da Igreja para transmitir a fé, do clássico ao contemporâneo.',
    items: ['Catecismo de São Pio X', 'Preceitos da Igreja', 'Itinerário de oração'],
  },
  {
    id: 'comunidade',
    icon: Users,
    eyebrow: 'Comunidade',
    title: 'Não caminhe sozinho',
    description:
      'Conecte-se com outros católicos que também buscam crescer na fé e na vida espiritual.',
    items: ['Perfis e interações', 'Oração em comum', 'Partilha de estudos'],
  },
  {
    id: 'mapa',
    icon: MapPinned,
    eyebrow: 'E muito mais',
    title: 'Mapa, liturgia e recursos',
    description:
      'Encontre paróquias perto de você, acompanhe a liturgia do dia e muito mais — tudo em um só lugar.',
    items: ['Mapa de igrejas no Brasil', 'Liturgia diária', 'Novidades toda semana'],
  },
]

type Variant = 'popup' | 'full'

interface Props {
  /**
   * 'popup' — compacto, pra usar dentro do upsell inline/modal
   * 'full'  — um pouco maior, pra página /planos
   */
  variant?: Variant
}

export default function PremiumFeaturesCarousel({ variant = 'popup' }: Props) {
  const haptic = useHaptic()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [hintSeen, setHintSeen] = useState(false)
  const touchStart = useRef(0)

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= FEATURES.length) return
      setDirection(i > current ? 'right' : 'left')
      setCurrent(i)
      setHintSeen(true)
      haptic.pulse('selection')
    },
    [current, haptic],
  )

  const prev = useCallback(() => go(current - 1), [current, go])
  const next = useCallback(() => go(current + 1), [current, go])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (diff > 40) next()
    else if (diff < -40) prev()
  }

  const slide = FEATURES[current]
  const Icon = slide.icon
  const progressPct = ((current + 1) / FEATURES.length) * 100

  const isFull = variant === 'full'
  const minH = isFull ? 320 : 260

  return (
    <div className="w-full" aria-roledescription="carousel" aria-label="Benefícios do plano Premium">
      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden mb-3"
        style={{ background: 'var(--accent-soft)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-400"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
          }}
        />
      </div>

      {/* Viewport */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border-1)',
          minHeight: minH,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Edge shadows */}
        {current > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 bottom-0 w-8 z-10"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.45), transparent)' }}
          />
        )}
        {current < FEATURES.length - 1 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 z-10"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.45), transparent)' }}
          />
        )}

        {/* Slide */}
        <div
          key={slide.id}
          className="relative z-[1] px-5 py-6 md:px-8 md:py-8"
          style={{
            animation: `pfcSlideIn${direction === 'right' ? 'R' : 'L'} 0.35s ease-out`,
          }}
          aria-live="polite"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{
                width: isFull ? 56 : 48,
                height: isFull ? 56 : 48,
                background: 'var(--accent-soft)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                color: 'var(--accent)',
                boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 18%, transparent)',
              }}
            >
              <Icon className={isFull ? 'w-7 h-7' : 'w-6 h-6'} strokeWidth={1.6} />
            </div>
            <span
              className="text-[10px] tracking-[0.18em] uppercase"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              {slide.eyebrow}
            </span>
          </div>

          <h3
            className={isFull ? 'text-2xl md:text-[28px] mb-2' : 'text-xl md:text-2xl mb-2'}
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '0.02em',
            }}
          >
            {slide.title}
          </h3>

          <p
            className="text-sm md:text-[15px] mb-4"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.55,
            }}
          >
            {slide.description}
          </p>

          <ul className="flex flex-col gap-2">
            {slide.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[13px]"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span
                  aria-hidden
                  className="flex-shrink-0 rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: 'var(--accent)',
                    boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 60%, transparent)',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Swipe hint */}
        {!hintSeen && current === 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full z-20"
            style={{
              background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              animation: 'pfcHintPulse 2.4s ease-in-out infinite',
            }}
          >
            Deslize
            <ChevronsRight className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          aria-label="Benefício anterior"
          className="flex items-center justify-center rounded-xl transition-all disabled:opacity-25 active:scale-95"
          style={{
            width: 40,
            height: 40,
            background: 'var(--accent-soft)',
            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5" role="tablist">
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir para ${f.eyebrow}`}
              aria-current={current === i ? 'true' : undefined}
              className="rounded-full transition-all duration-300"
              style={{
                width: current === i ? 22 : 6,
                height: 6,
                background: current === i ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 22%, transparent)',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          disabled={current === FEATURES.length - 1}
          aria-label="Próximo benefício"
          className="flex items-center justify-center rounded-xl transition-all disabled:opacity-25 active:scale-95"
          style={{
            width: 40,
            height: 40,
            background: 'var(--accent-soft)',
            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <style>{`
        @keyframes pfcSlideInR {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pfcSlideInL {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pfcHintPulse {
          0%, 100% { opacity: 0.6; transform: translateX(0); }
          50%      { opacity: 1;   transform: translateX(-3px); }
        }
      `}</style>
    </div>
  )
}
