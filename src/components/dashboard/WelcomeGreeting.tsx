'use client'

import { useMemo } from 'react'
import { Sun, Moon, Sunset, CloudMoon } from 'lucide-react'
import type { Profile } from '@/types/auth'
import {
  getTimeOfDay,
  getTimeLabel,
  getGreeting,
  getSubtitlePhrase,
} from '@/lib/greetings'

/* ─── Time-of-day icon mapping ─── */
const TIME_ICONS = {
  morning:   Sun,
  afternoon: Sun,
  evening:   Sunset,
  night:     CloudMoon,
} as const

const TIME_COLORS = {
  morning:   '#D9C077',
  afternoon: '#C9A84C',
  evening:   '#E8976B',
  night:     '#8B9DC3',
} as const

interface WelcomeGreetingProps {
  profile: Profile | null
}

export default function WelcomeGreeting({ profile }: WelcomeGreetingProps) {
  const timeOfDay = useMemo(getTimeOfDay, [])
  const timeLabel = getTimeLabel(timeOfDay)
  const TimeIcon = TIME_ICONS[timeOfDay]
  const iconColor = TIME_COLORS[timeOfDay]

  const greeting = profile?.name
    ? getGreeting(profile.vocacao, profile.name)
    : null

  const subtitle = getSubtitlePhrase()

  return (
    <div className="text-center space-y-3 mb-2">
      {/* Time of day label with icon */}
      <div className="flex items-center justify-center gap-2 fade-in">
        <TimeIcon className="w-5 h-5" style={{ color: iconColor }} />
        <span
          className="text-sm tracking-wide"
          style={{ color: iconColor, fontFamily: 'Poppins, sans-serif' }}
        >
          {timeLabel}
        </span>
      </div>

      {/* Personal greeting */}
      {greeting && (
        <h1
          className="text-2xl md:text-3xl font-bold fade-in"
          style={{
            fontFamily: 'Cinzel, serif',
            color: 'var(--text-primary)',
            animationDelay: '0.1s',
          }}
        >
          {greeting}
        </h1>
      )}

      {/* Subtitle / call to action */}
      <p
        className="text-base md:text-lg fade-in"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          animationDelay: '0.2s',
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}
