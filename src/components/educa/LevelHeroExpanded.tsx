'use client'

/**
 * LevelHeroExpanded — variante horizontal pro desktop da dashboard /educa.
 *
 * Mobile (< lg): cai pro <LevelHero/> compacto que já existia.
 * Desktop (lg+): avatar grande à esquerda + saudação + barra XP larga
 *                + 3 chips de stats (selos, amigos, grupos) à direita.
 *
 * Os contadores de selos/grupos vêm de hooks que já existem; amigos
 * vem do RPC público (snapshot) — se não houver, mostra "—".
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
import GlassCard from './GlassCard'

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
  const equipped = gami.equippedReliquia

  return (
    <>
      <div className="lg:hidden">
        <LevelHero />
      </div>

      <div className="hidden lg:block">
        <GlassCard variant="gold" padded>
          <div className="flex items-stretch gap-6">
            <div
              className="relative w-[120px] h-[120px] rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1.5px solid var(--accent)',
                boxShadow:
                  '0 0 32px color-mix(in srgb, var(--accent) 38%, transparent)',
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12" style={{ color: 'var(--text-3)' }} />
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <p
                  className="text-[11px] tracking-[0.22em] uppercase mb-1"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                    opacity: 0.85,
                  }}
                >
                  {greeting()}
                </p>
                <h1
                  className="text-3xl xl:text-4xl truncate leading-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-1)',
                  }}
                >
                  {firstName ? `Olá, ${firstName}` : 'Veritas Educa'}
                </h1>
                {equipped && (
                  <p
                    className="text-xs mt-1 inline-flex items-center gap-1.5"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                  >
                    <Gem className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[20rem]">{equipped.name}</span>
                  </p>
                )}
              </div>

              <div className="mt-3">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(242,237,228,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${gami.percentInLevel}%`,
                      background:
                        'linear-gradient(90deg, color-mix(in srgb, var(--accent) 80%, black) 0%, #E5C97A 50%, var(--accent) 100%)',
                      boxShadow:
                        '0 0 12px color-mix(in srgb, var(--accent) 60%, transparent)',
                    }}
                  />
                </div>
                <div
                  className="flex items-center justify-between mt-2 text-[11px]"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span>{gami.xpInLevel} / 100 XP</span>
                  <span>{gami.xpToNextLevel} até Nv {gami.level + 1}</span>
                </div>
              </div>
            </div>

            <div
              className="flex flex-col items-end justify-between flex-shrink-0"
              style={{ minWidth: 200 }}
            >
              <div
                className="px-4 py-2 rounded-full inline-flex items-baseline gap-1.5"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
                  color: 'var(--accent-contrast)',
                  boxShadow:
                    '0 6px 18px -6px color-mix(in srgb, var(--accent) 55%, transparent)',
                }}
              >
                <span
                  className="text-[10px] tracking-[0.18em] uppercase opacity-85"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  NV
                </span>
                <span
                  className="text-xl font-bold leading-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {gami.level}
                </span>
              </div>
              <p
                className="text-xs mt-1.5"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                {gami.totalXp} XP total
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                <StatChip
                  href="/perfil#selos"
                  icon={<Gem className="w-3.5 h-3.5" />}
                  value={unlockedIds.size}
                  label="Selos"
                />
                <StatChip
                  href="/comunidade"
                  icon={<UsersRound className="w-3.5 h-3.5" />}
                  value={followers ?? 0}
                  label="Amigos"
                />
                <StatChip
                  href="/estudo/grupos"
                  icon={<Users className="w-3.5 h-3.5" />}
                  value={groups.length}
                  label="Grupos"
                />
              </div>

              {gami.currentStreak > 0 && (
                <p
                  className="text-[11px] mt-3 inline-flex items-center gap-1"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                >
                  <Flame className="w-3.5 h-3.5" />
                  {gami.currentStreak} dia{gami.currentStreak === 1 ? '' : 's'} de sequência
                </p>
              )}
            </div>
          </div>
        </GlassCard>
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
      className="flex flex-col items-center py-2 px-2 rounded-xl transition-colors hover:bg-white/[0.04]"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
      }}
    >
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span
        className="text-sm font-semibold mt-0.5"
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </span>
      <span
        className="text-[9px] tracking-[0.12em] uppercase"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
    </Link>
  )
}
