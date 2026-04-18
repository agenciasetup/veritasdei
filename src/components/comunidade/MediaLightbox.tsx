/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { VeritasMediaAsset } from '@/lib/community/types'

interface Props {
  items: VeritasMediaAsset[]
  startIndex: number
  onClose: () => void
}

export default function MediaLightbox({ items, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)

  const go = useCallback((dir: 1 | -1) => {
    setIndex(i => {
      const next = i + dir
      if (next < 0) return items.length - 1
      if (next >= items.length) return 0
      return next
    })
  }, [items.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, go])

  const current = items[index]
  if (!current) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 p-2 rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#F2EDE4' }}
      >
        <X className="w-6 h-6" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            aria-label="Anterior"
            className="absolute left-4 p-3 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#F2EDE4' }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1) }}
            aria-label="Próxima"
            className="absolute right-4 p-3 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#F2EDE4' }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <img
        src={current.variants.detail || current.variants.feed}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[95vw] max-h-[90vh] object-contain"
      />

      {items.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs"
          style={{
            background: 'rgba(0,0,0,0.6)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {index + 1} / {items.length}
        </div>
      )}
    </div>,
    document.body,
  )
}
