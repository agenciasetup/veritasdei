'use client'

/**
 * CommunityModule — módulo único de comunidade. Substitui os 3 cards
 * sociais separados (FriendsActivityCard + DashboardGruposStrip +
 * FriendsSuggestionsCard), que pra quase todo usuário novo apareciam
 * vazios — três caixas dizendo "nada aqui ainda".
 *
 * Agora é UM card com duas seções enxutas:
 *   1. Rede hoje  — quem da sua rede estudou hoje (prova social)
 *   2. Grupos     — seus grupos de estudo
 *
 * Descoberta de gente (sugestões/seguir) fica em /comunidade — não polui
 * mais a dashboard. O CTA de convidar gente vive no InviteCard.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Flame, Plus, Users, Users2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyStudyGroups } from '@/lib/study/useStudyGroups'
import { createClient } from '@/lib/supabase/client'

interface ActiveFriend {
  id: string
  name: string | null
  profile_image_url: string | null
  current_streak: number
}

function todayInBrazilISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

const SHELL_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
}

export default function CommunityModule({
  compact = false,
}: {
  compact?: boolean
}) {
  const { user } = useAuth()
  const { groups, loading: groupsLoading } = useMyStudyGroups()
  const [friends, setFriends] = useState<ActiveFriend[]>([])
  const [totalActive, setTotalActive] = useState(0)
  const [hasNetwork, setHasNetwork] = useState(false)
  const [netLoading, setNetLoading] = useState(true)

  const myId = user?.id ?? null

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!myId) {
        setNetLoading(false)
        return
      }
      const supabase = createClient()
      if (!supabase) return

      const { data: follows } = await supabase
        .from('vd_follows')
        .select('followed_user_id')
        .eq('follower_user_id', myId)
        .limit(200)

      const followedIds = ((follows ?? []) as Array<{
        followed_user_id: string
      }>).map((r) => r.followed_user_id)

      if (cancelled) return
      setHasNetwork(followedIds.length > 0)
      if (followedIds.length === 0) {
        setNetLoading(false)
        return
      }

      const today = todayInBrazilISO()
      const dayStart = new Date(`${today}T00:00:00-03:00`).toISOString()
      const dayEnd = new Date(`${today}T23:59:59-03:00`).toISOString()

      const { data: gami } = await supabase
        .from('user_gamification')
        .select('user_id, current_streak')
        .in('user_id', followedIds)
        .gte('last_study_at', dayStart)
        .lte('last_study_at', dayEnd)
        .order('current_streak', { ascending: false })
        .limit(50)

      const activeRows = (gami ?? []) as Array<{
        user_id: string
        current_streak: number
      }>

      if (cancelled) return
      if (activeRows.length === 0) {
        setNetLoading(false)
        return
      }

      const topIds = activeRows.slice(0, 5).map((r) => r.user_id)
      const streakById = new Map(
        activeRows.map((r) => [r.user_id, r.current_streak]),
      )

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, profile_image_url')
        .in('id', topIds)

      const profileById = new Map(
        ((profs ?? []) as Array<{
          id: string
          name: string | null
          profile_image_url: string | null
        }>).map((p) => [p.id, p]),
      )

      const enriched: ActiveFriend[] = topIds
        .map((id) => {
          const p = profileById.get(id)
          if (!p) return null
          return {
            id,
            name: p.name,
            profile_image_url: p.profile_image_url,
            current_streak: streakById.get(id) ?? 0,
          }
        })
        .filter((x): x is ActiveFriend => x !== null)

      if (!cancelled) {
        setFriends(enriched)
        setTotalActive(activeRows.length)
        setNetLoading(false)
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNetLoading(true)
    void load()
    return () => {
      cancelled = true
    }
  }, [myId])

  const firstName = (n: string | null) => n?.split(' ')[0] ?? 'Anônimo'
  const networkLead =
    friends.length === 0
      ? null
      : friends.length === 1
        ? `${firstName(friends[0].name)} estudou hoje.`
        : friends.length === 2
          ? `${firstName(friends[0].name)} e ${firstName(friends[1].name)} estudaram hoje.`
          : `${firstName(friends[0].name)}, ${firstName(friends[1].name)} e mais ${totalActive - 2} estudaram hoje.`

  return (
    <div className="h-full rounded-[24px] p-6 lg:p-7 flex flex-col" style={SHELL_STYLE}>
      <div className="flex items-center gap-2">
        <Users2
          className="w-4 h-4"
          strokeWidth={1.6}
          style={{ color: 'var(--accent)' }}
        />
        <h3
          className="text-sm"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          Comunidade
        </h3>
        <Link
          href="/comunidade"
          className="ml-auto inline-flex items-center gap-1 text-[11px]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          Ver tudo
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Seção 1 — Rede hoje */}
      <div className="mt-4">
        {netLoading ? (
          <div
            className="h-10 rounded-xl animate-pulse"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />
        ) : !hasNetwork ? (
          <Link
            href="/comunidade"
            className="flex items-center gap-2 group"
          >
            <p
              className="text-xs flex-1"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              Siga católicos da sua paróquia pra acompanhar quem estuda.
            </p>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            />
          </Link>
        ) : friends.length === 0 ? (
          <p
            className="text-xs"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Ninguém da sua rede estudou hoje. Seja o primeiro!
          </p>
        ) : (
          <Link href="/comunidade" className="flex items-center gap-3">
            <div className="flex -space-x-2 flex-shrink-0">
              {friends.map((f) => (
                <Avatar key={f.id} friend={f} />
              ))}
            </div>
            <p
              className="text-xs flex-1 leading-snug"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              {networkLead}
            </p>
          </Link>
        )}
      </div>

      {/* Divisória */}
      <div
        className="my-4 h-px"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />

      {/* Seção 2 — Grupos */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2.5">
          <Users
            className="w-3.5 h-3.5"
            strokeWidth={1.6}
            style={{ color: 'var(--text-3)' }}
          />
          <span
            className="text-[11px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Seus grupos
          </span>
        </div>

        {groupsLoading ? (
          <div
            className="h-16 rounded-xl animate-pulse"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />
        ) : groups.length === 0 ? (
          <Link
            href="/estudo/grupos"
            className="flex items-center gap-2 group"
          >
            <p
              className="text-xs flex-1"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              Crie ou entre num grupo e mantenham a sequência juntos.
            </p>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            />
          </Link>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {groups.slice(0, compact ? 4 : 8).map((g) => (
              <Link
                key={g.id}
                href={`/estudo/grupos/${g.id}`}
                className="flex-shrink-0 w-[150px] rounded-2xl p-3"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Users
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--accent)' }}
                    />
                  </div>
                  {g.my_role === 'owner' && (
                    <span
                      className="text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full"
                      style={{
                        color: 'var(--accent)',
                        background: 'rgba(201,168,76,0.12)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Dono
                    </span>
                  )}
                </div>
                <p
                  className="text-[13px] font-medium line-clamp-1"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {g.name}
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {g.member_count} membro{g.member_count === 1 ? '' : 's'}
                </p>
              </Link>
            ))}
            <Link
              href="/estudo/grupos"
              className="flex-shrink-0 w-[110px] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-center"
              style={{
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span
                className="text-[11px]"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
              >
                Novo grupo
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ friend }: { friend: ActiveFriend }) {
  const initial = (friend.name?.[0] ?? '?').toUpperCase()
  return (
    <div
      className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '2px solid var(--surface-2)',
      }}
      title={
        friend.current_streak > 0
          ? `${friend.name ?? 'Anônimo'} · ${friend.current_streak} dia${friend.current_streak === 1 ? '' : 's'}`
          : (friend.name ?? 'Anônimo')
      }
    >
      {friend.profile_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={friend.profile_image_url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="text-[11px]"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-display)' }}
        >
          {initial}
        </span>
      )}
      {friend.current_streak >= 7 && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--accent)',
            border: '1.5px solid var(--surface-2)',
          }}
        >
          <Flame
            className="w-2 h-2"
            style={{ color: 'var(--accent-contrast)' }}
          />
        </span>
      )}
    </div>
  )
}
