'use client'

import { Flame, Calendar, Trophy, CheckCircle } from 'lucide-react'
import { useStudyStreak } from '@/lib/content/useStudyStreak'

interface StudyStreakProps {
  userId: string | undefined
}

export default function StudyStreak({ userId }: StudyStreakProps) {
  const { currentStreak, longestStreak, studiedToday, totalDaysStudied, loading } = useStudyStreak(userId)

  if (loading || totalDaysStudied === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 fade-in" style={{ animationDelay: '0.5s' }}>
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(20,18,14,0.6)',
          border: `1px solid ${currentStreak >= 7 ? 'rgba(201,168,76,0.25)' : 'var(--border-subtle)'}`,
        }}
      >
        {/* Flame icon with streak count */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: currentStreak > 0
                ? 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(217,192,119,0.08))'
                : 'rgba(242,237,228,0.04)',
              border: `1px solid ${currentStreak > 0 ? 'rgba(201,168,76,0.2)' : 'rgba(242,237,228,0.06)'}`,
            }}
          >
            <Flame
              className="w-5 h-5"
              style={{
                color: currentStreak > 0 ? '#C9A84C' : 'var(--text-muted)',
              }}
            />
          </div>
          <span
            className="text-lg font-bold mt-1 leading-none"
            style={{
              fontFamily: 'Cinzel, serif',
              color: currentStreak > 0 ? '#C9A84C' : 'var(--text-muted)',
            }}
          >
            {currentStreak}
          </span>
        </div>

        {/* Streak info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--text-secondary)' }}
          >
            {currentStreak === 0
              ? 'Estude hoje para iniciar seu streak!'
              : currentStreak === 1
                ? '1 dia de estudo consecutivo'
                : `${currentStreak} dias consecutivos`}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            {longestStreak > currentStreak && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
                <Trophy className="w-3 h-3" />
                Recorde: {longestStreak}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
              <Calendar className="w-3 h-3" />
              {totalDaysStudied} {totalDaysStudied === 1 ? 'dia' : 'dias'} total
            </span>
          </div>
        </div>

        {/* Today indicator */}
        {studiedToday && (
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5" style={{ color: '#66BB6A' }} />
          </div>
        )}
      </div>
    </div>
  )
}
