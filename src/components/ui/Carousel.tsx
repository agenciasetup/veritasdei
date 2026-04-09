'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) setCurrent(index)
  }, [slides.length])

  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  // Keyboard nav
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [prev, next, onClose])

  // Touch/swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX
  }
  function handleTouchEnd() {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 fade-in">
      {/* Carousel viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(16,16,16,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          minHeight: '60vh',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
            width: `${slides.length * 100}%`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex-shrink-0 p-8 md:p-12 overflow-y-auto"
              style={{
                width: `${100 / slides.length}%`,
                maxHeight: '75vh',
              }}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-5 px-2">
        {/* Prev */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-20"
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#C9A84C',
          }}
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: current === i ? '24px' : '8px',
                height: '8px',
                background: current === i ? '#C9A84C' : 'rgba(201,168,76,0.2)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-20"
          style={{
            background: 'rgba(201,168,76,0.1)',
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
        className="text-center mt-3 text-xs tracking-wider"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        {current + 1} de {slides.length}
      </p>
    </div>
  )
}
