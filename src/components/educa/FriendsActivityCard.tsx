'use client'

/**
 * FriendsActivityCard — prova social: quem da sua rede estudou hoje.
 *
 * Estratégia: query simples em 2 passos (sem RPC nova).
 *   1. Lista até 50 user_ids que o user atual segue (vd_follows).
 *   2. Cruza com user_gamification quem tem last_study_at em "hoje" (TZ BR).
 *   3. Hidrata 5 perfis pra exibir avatar+nome.
 *
 * Se o usuário não segue ninguém OU ninguém da rede estudou hoje, mostra
 * placeholder com CTA pra /comunidade.
 *
 * O componente é "leve" no DOM (linha + avatars empilhados) — pode ficar
 * inline na grid ao lado de outros cards informativos.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Flame, Users2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import GlassCard from './GlassCard'

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

export default function FriendsActivityCard() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<ActiveFriend[]>([])
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasNetwork, setHasNetwork] = useState(false)

  const myId = user?.id ?? null

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!myId) {
        setFriends([])
        setLoading(false)
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
        setFriends([])
        setTotalActive(0)
        setLoading(false)
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
        setFriends([])
        setTotalActive(0)
        setLoading(false)
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
        setLoading(false)
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    void load()
    return () => {
      cancelled = true
    }
  }, [myId])

  const header = (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Users2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <h3
          className="text-[11px] tracking-[0.18em] uppercase"
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Sua rede hoje
        </h3>
      </div>
    </div>
  )

  if (loading) {
    return (
      <GlassCard variant="default" padded>
        {header}
        <div
          className="h-12 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
      </GlassCard>
    )
  }

  if (!hasNetwork) {
    return (
      <Link href="/comunidade" className="block">
        <GlassCard variant="default" padded interactive>
          {header}
          <div className="flex items-center gap-3 py-1">
            <p
              className="text-xs flex-1"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              Siga católicos da sua paróquia pra ver quem estudou hoje.
            </p>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        </GlassCard>
      </Link>
    )
  }

  if (friends.length === 0) {
    return (
      <GlassCard variant="default" padded>
        {header}
        <p
          className="text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Ninguém da sua rede estudou hoje. Seja o primeiro!
        </p>
      </GlassCard>
    )
  }

  const firstName = (n: string | null) => (n?.split(' ')[0] ?? 'Anônimo')
  const lead =
    friends.length === 1
      ? `${firstName(friends[0].name)} estudou hoje.`
      : friends.length === 2
        ? `${firstName(friends[0].name)} e ${firstName(friends[1].name)} estudaram hoje.`
        : `${firstName(friends[0].name)}, ${firstName(friends[1].name)} e mais ${totalActive - 2} estudaram hoje.`

  return (
    <Link href="/comunidade" className="block">
      <GlassCard variant="default" padded interactive>
        {header}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 flex-shrink-0">
            {friends.map((f) => (
              <Avatar key={f.id} friend={f} />
            ))}
          </div>
          <p
            className="text-xs flex-1 leading-snug"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {lead}
          </p>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--accent)' }}
          />
        </div>
      </GlassCard>
    </Link>
  )
}

function Avatar({ friend }: { friend: ActiveFriend }) {
  const initial = (friend.name?.[0] ?? '?').toUpperCase()
  return (
    <div
      className="relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '2px solid var(--surface-1)',
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
          className="text-xs"
          style={{
            color: 'var(--text-2)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {initial}
        </span>
      )}
      {friend.current_streak >= 7 && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--accent)',
            border: '1.5px solid var(--surface-1)',
          }}
        >
          <Flame className="w-2.5 h-2.5" style={{ color: 'var(--accent-contrast)' }} />
        </span>
      )}
    </div>
  )
}
