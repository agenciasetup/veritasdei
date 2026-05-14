'use client'

/**
 * LevelHeroExpanded — versão flat vertical 4:5 (desktop) com fallback
 * horizontal compacto pro mobile.
 *
 * Direção visual: superfícies sólidas (sem glass/gradient), borda discreta,
 * avatar circular, tipografia editorial em serifa pra números/títulos.
 * Dourado entra só como acento (números do nível, traço da barra XP, ícones
 * dos stat chips) — nunca como fundo de bloco inteiro.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Flame, Gem, User, Users, UsersRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import { useReliquias } from '@/lib/gamification/useReliquias'
import { useMyStudyGroups } from '@/lib/study/useStudyGroups'
import { createClient } from '@/lib/supabase/client'
import LevelHero from './LevelHero'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function useFollowersCount(userId: string | undefined): number | null {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(null)
      return
    }
    const supabase = createClient()
    if (!supabase) return
    let cancelled = false
    void supabase
      .from('vd_follows')
      .select('follower_user_id', { count: 'exact', head: true })
      .eq('followed_user_id', userId)
      .then((res: { count: number | null }) => {
        if (!cancelled) setCount(res.count ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [userId])
  return count
}

export default function LevelHeroExpanded() {
  const { user, profile } = useAuth()
  const gami = useGamification(user?.id)
  const { unlockedIds } = useReliquias(user?.id)
  const { groups } = useMyStudyGroups()
  const followers = useFollowersCount(user?.id)

  const avatarUrl = profile?.profile_image_url
  const firstName = (profile?.name || user?.email?.split('@')[0] || '')
    .split(' ')[0]

  return (
    <>
      <div className="lg:hidden">
        <LevelHero />
      </div>

      <div
        className="hidden lg:flex lg:flex-col lg:h-full relative overflow-hidden rounded-[28px] p-7"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(201,168,76,0.5)',
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" style={{ color: 'var(--text-3)' }} />
            )}
          </div>

          <p
            className="text-[11px] mt-4"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {greeting()}
          </p>
          <h1
            className="text-[26px] xl:text-[28px] leading-tight mt-0.5"
            style={{
              fontFamily: 'var(--font-elegant)',
              color: 'var(--text-1)',
              fontWeight: 500,
            }}
          >
            {firstName ? firstName : 'Veritas Educa'}
          </h1>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <div className="inline-flex items-baseline gap-2">
              <span
                className="text-[10px] tracking-[0.16em] uppercase"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Nível
              </span>
              <span
                className="text-3xl leading-none"
                style={{
                  fontFamily: 'var(--font-elegant)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                {gami.level}
              </span>
            </div>
            <span
              className="text-xs"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {gami.totalXp} XP
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(242,237,228,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${gami.percentInLevel}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <p
            className="text-[11px] mt-2"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {gami.xpInLevel} / 100 — faltam {gami.xpToNextLevel} pro Nv {gami.level + 1}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="grid grid-cols-3 gap-2">
            <StatChip
              href="/perfil#selos"
              icon={<Gem className="w-4 h-4" />}
              value={unlockedIds.size}
              label="Selos"
            />
            <StatChip
              href="/comunidade"
              icon={<UsersRound className="w-4 h-4" />}
              value={followers ?? 0}
              label="Amigos"
            />
            <StatChip
              href="/estudo/grupos"
              icon={<Users className="w-4 h-4" />}
              value={groups.length}
              label="Grupos"
            />
          </div>

          {gami.currentStreak > 0 && (
            <div className="flex justify-center mt-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Flame className="w-3.5 h-3.5" />
                {gami.currentStreak} dia{gami.currentStreak === 1 ? '' : 's'} de sequência
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StatChip({
  href,
  icon,
  value,
  label,
}: {
  href: string
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center py-3 rounded-2xl transition-colors"
      style={{
        background: 'rgba(0,0,0,0.2)',
      }}
    >
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span
        className="text-lg mt-1 leading-none"
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-elegant)',
          fontWeight: 500,
        }}
      >
        {value}
      </span>
      <span
        className="text-[10px] mt-1"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
    </Link>
  )
}
