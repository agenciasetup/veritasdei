'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Mystery } from '../data/types'
import { PAI_NOSSO, AVE_MARIA, GLORIA, ORACAO_FATIMA } from '../data/prayers'
import MysteryHeader from './MysteryHeader'
import PrayerCard from './PrayerCard'

interface DecadeSectionProps {
  mystery: Mystery
  decadeNumber: number
  defaultOpen?: boolean
}

export default function DecadeSection({ mystery, decadeNumber, defaultOpen = false }: DecadeSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: open ? 'rgba(20,18,14,0.6)' : 'rgba(20,18,14,0.3)',
        border: `1px solid ${open ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.06)'}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header - clickable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 md:p-5 transition-colors duration-200"
      >
        <div className="flex items-center gap-3 text-left">
          {/* Decade number badge */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: open ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
            >
              {decadeNumber}
            </span>
          </div>

          <div>
            <h3
              className="text-sm font-semibold leading-snug"
              style={{ fontFamily: 'Cinzel, serif', color: open ? '#C9A84C' : '#F2EDE4' }}
            >
              {mystery.title}
            </h3>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Fruto: {mystery.fruit}
            </p>
          </div>
        </div>

        <ChevronDown
          className="w-5 h-5 transition-transform duration-300 flex-shrink-0"
          style={{
            color: '#7A7368',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          maxHeight: open ? '2000px' : '0',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 md:px-5 pb-5 space-y-2">
          <MysteryHeader mystery={mystery} decadeNumber={decadeNumber} />
          <PrayerCard prayer={PAI_NOSSO} />
          <PrayerCard prayer={AVE_MARIA} repeat={10} />
          <PrayerCard prayer={GLORIA} />
          <PrayerCard prayer={ORACAO_FATIMA} />
        </div>
      </div>
    </div>
  )
}
