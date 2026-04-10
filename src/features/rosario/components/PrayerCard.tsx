'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Prayer } from '../data/types'

interface PrayerCardProps {
  prayer: Prayer
  repeat?: number
  /** Quando true, inicia expandido */
  defaultOpen?: boolean
}

export default function PrayerCard({ prayer, repeat, defaultOpen = false }: PrayerCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: open ? 'rgba(201,168,76,0.04)' : 'rgba(20,18,14,0.3)',
        border: `1px solid ${open ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)'}`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif', color: open ? '#C9A84C' : '#F2EDE4' }}
          >
            {prayer.name}
          </span>
          {repeat && repeat > 1 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(201,168,76,0.12)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {repeat}x
            </span>
          )}
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300 flex-shrink-0"
          style={{
            color: '#7A7368',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? '600px' : '0',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4">
          {prayer.latinName && (
            <p
              className="text-[10px] tracking-[0.15em] uppercase mb-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              {prayer.latinName}
            </p>
          )}
          <p
            className="text-sm leading-[1.9]"
            style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
          >
            {prayer.text}
          </p>
        </div>
      </div>
    </div>
  )
}
