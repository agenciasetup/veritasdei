'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CarouselSlide {
  id: string
  content: React.ReactNode
}

interface CarouselProps {
  slides: CarouselSlide[]
  onClose?: () => void
}

export default function Carousel({ slides, onClose }: CarouselProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const touchStart = useRef(0)

  const go = useCallback((i: number) => {
    if (i < 0 || i >= slides.length) return
    setDirection(i > current ? 'right' : 'left')
    setCurrent(i)
  }, [current, slides.length])

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
    if (diff > 60) next()
    else if (diff < -60) prev()
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6">
      {/* Viewport */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(16,16,16,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.12)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          minHeight: '68vh',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Single visible slide */}
        <div
          key={slides[current]?.id}
          className="p-8 md:p-14 lg:p-20 overflow-y-auto"
          style={{
            maxHeight: '80vh',
            animation: `slideIn${direction === 'right' ? 'Right' : 'Left'} 0.35s ease-out`,
          }}
        >
          {slides[current]?.content}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 flex-shrink-0"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#C9A84C',
          }}
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: current === i ? '28px' : '8px',
                height: '8px',
                background: current === i ? '#C9A84C' : 'rgba(201,168,76,0.2)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 flex-shrink-0"
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
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        {current + 1} / {slides.length}
      </p>

      {/* Animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
