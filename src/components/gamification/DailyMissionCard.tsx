'use client'

import { Target, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDailyMission } from '@/lib/gamification/useDailyMission'

/**
 * Card da missão do dia. MVP: única missão "study_subtopic" (+20 XP).
 * Barra de progresso + CTA "Coletar XP" quando completa.
 */
export default function DailyMissionCard() {
  const { user } = useAuth()
  const { mission, claim, loading } = useDailyMission(user?.id)

  if (!user || loading || !mission) return null

  const percent = Math.round((mission.progress / mission.target) * 100)
  const label = mission.mission_type === 'study_subtopic'
    ? 'Estude 1 subtópico hoje'
    : 'Missão do dia'

  return (
    <div
      className="rounded-2xl p-4 fade-in"
      style={{
        background: mission.completed
          ? 'linear-gradient(135deg, rgba(102,187,106,0.12), rgba(20,18,14,0.6))'
          : 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(20,18,14,0.6))',
        border: `1px solid ${
          mission.completed ? 'rgba(102,187,106,0.3)' : 'rgba(201,168,76,0.25)'
        }`,
        backdropFilter: 'blur(12px)',
        animationDelay: '0.2s',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Target
          className="w-3.5 h-3.5"
          style={{ color: mission.completed ? '#66BB6A' : 'var(--gold)' }}
          strokeWidth={1.8}
        />
        <span
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{
            fontFamily: 'Cinzel, serif',
            color: mission.completed ? '#66BB6A' : 'var(--gold)',
          }}
        >
          Missão do dia
        </span>
        <span
          className="ml-auto text-[10px]"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          +{mission.xp_reward} XP
        </span>
      </div>

      <p
        className="text-sm mb-3"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {label}
      </p>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-2"
        style={{ background: 'rgba(242,237,228,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percent}%`,
            background: mission.completed
              ? 'linear-gradient(90deg, #66BB6A, #81C784)'
              : 'linear-gradient(90deg, #C9A84C, #D9C077)',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-[10px]"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {mission.progress} / {mission.target}
        </span>
        {mission.completed && !mission.claimed && (
          <button
            type="button"
            onClick={() => void claim()}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            style={{
              background: 'rgba(102,187,106,0.18)',
              border: '1px solid rgba(102,187,106,0.45)',
              color: '#66BB6A',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
            }}
          >
            <Check className="w-3 h-3" />
            Coletar
          </button>
        )}
        {mission.claimed && (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]"
            style={{ color: '#66BB6A', fontFamily: 'Poppins, sans-serif' }}
          >
            <Check className="w-3 h-3" />
            Coletado
          </span>
        )}
      </div>
    </div>
  )
}
