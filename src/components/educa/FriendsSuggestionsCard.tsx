'use client'

/**
 * FriendsSuggestionsCard — sugestões de pessoas pra seguir, em ordem:
 *
 *   1. Mesma paróquia (mais relevante)
 *   2. Mesma diocese
 *   3. Amigos-de-amigos (RPC `find_friend_suggestions`)
 *
 * Pra cada um exibe um chip "X amigos em comum" (quando aplicável). Quando
 * o usuário não tem paróquia/diocese cadastradas E ainda não segue ninguém,
 * mostra CTA pra completar o perfil.
 *
 * Seguir é feito via POST /api/comunidade/follows/[userId] (rate-limit +
 * gate de premium). Em 403/402 redireciona pra /educa/assine.
 */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Check, MapPin, UserPlus, Users2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import GlassCard from './GlassCard'

interface SuggestedProfile {
  id: string
  name: string | null
  public_handle: string | null
  user_number: number | null
  profile_image_url: string | null
  paroquia: string | null
  diocese: string | null
  verified: boolean
  /** Quantos amigos em comum (só presente em sugestões de 2º grau) */
  mutual_count?: number
}

const MAX_SUGGESTIONS = 5

export default function FriendsSuggestionsCard() {
  const { user, profile } = useAuth()
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [hasContext, setHasContext] = useState(false)

  const userParoquia = profile?.paroquia ?? null
  const userDiocese = profile?.diocese ?? null
  const myId = user?.id ?? null

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!myId) {
        setSuggestions([])
        setLoading(false)
        return
      }

      const supabase = createClient()
      if (!supabase) return

      const { data: followsRows } = await supabase
        .from('vd_follows')
        .select('followed_user_id')
        .eq('follower_user_id', myId)
      const followedIds = ((followsRows ?? []) as Array<{
        followed_user_id: string
      }>).map((r) => r.followed_user_id)
      const alreadyFollowing = new Set<string>(followedIds)

      const out: SuggestedProfile[] = []
      const seen = new Set<string>([myId])
      alreadyFollowing.forEach((id) => seen.add(id))

      async function fetchByField(field: 'paroquia' | 'diocese', value: string) {
        const { data } = await supabase!
          .from('profiles')
          .select(
            'id, name, public_handle, user_number, profile_image_url, paroquia, diocese, verified',
          )
          .eq(field, value)
          .neq('id', myId!)
          .limit(12)
        return (data ?? []) as SuggestedProfile[]
      }

      if (userParoquia) {
        const rows = await fetchByField('paroquia', userParoquia)
        for (const r of rows) {
          if (!seen.has(r.id)) {
            seen.add(r.id)
            out.push(r)
          }
          if (out.length >= MAX_SUGGESTIONS) break
        }
      }
      if (out.length < MAX_SUGGESTIONS && userDiocese) {
        const rows = await fetchByField('diocese', userDiocese)
        for (const r of rows) {
          if (!seen.has(r.id)) {
            seen.add(r.id)
            out.push(r)
          }
          if (out.length >= MAX_SUGGESTIONS) break
        }
      }

      // 3º grau: amigos-de-amigos via RPC. Roda quando ainda faltam vagas
      // e quando o usuário tem alguém pra puxar conexões (seguindo ao menos 1).
      if (out.length < MAX_SUGGESTIONS && followedIds.length > 0) {
        const { data: rpcRows } = await supabase.rpc(
          'find_friend_suggestions',
          { p_limit: 12 },
        )
        const rows = (rpcRows ?? []) as SuggestedProfile[]
        for (const r of rows) {
          if (!seen.has(r.id)) {
            seen.add(r.id)
            out.push(r)
          }
          if (out.length >= MAX_SUGGESTIONS) break
        }
      }

      if (cancelled) return
      setSuggestions(out)
      setHasContext(
        Boolean(userParoquia) ||
          Boolean(userDiocese) ||
          followedIds.length > 0,
      )
      setLoading(false)
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    void load()
    return () => {
      cancelled = true
    }
  }, [myId, userParoquia, userDiocese])

  const handleFollow = useCallback(
    async (targetId: string) => {
      if (!myId) return
      if (followingIds.has(targetId)) return
      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.add(targetId)
        return next
      })
      try {
        const res = await fetch(`/api/comunidade/follows/${targetId}`, {
          method: 'POST',
        })
        if (!res.ok) {
          if (res.status === 403 || res.status === 402) {
            window.location.href = '/educa/assine'
            return
          }
          setFollowingIds((prev) => {
            const next = new Set(prev)
            next.delete(targetId)
            return next
          })
        }
      } catch {
        setFollowingIds((prev) => {
          const next = new Set(prev)
          next.delete(targetId)
          return next
        })
      }
    },
    [myId, followingIds],
  )

  const header = (
    <div className="flex items-center justify-between mb-3">
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
          Pessoas pra seguir
        </h3>
      </div>
      <Link
        href="/comunidade"
        className="text-[11px] inline-flex items-center gap-1"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
      >
        Comunidade
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )

  if (loading) {
    return (
      <GlassCard variant="flat" padded>
        {header}
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </div>
      </GlassCard>
    )
  }

  if (suggestions.length === 0 && !hasContext) {
    return (
      <Link href="/perfil" className="block">
        <GlassCard variant="flat" padded interactive>
          {header}
          <div className="flex items-center gap-3 py-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.5) 100%)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <p
              className="text-xs flex-1"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              Adicione sua paróquia ou diocese no perfil pra ver sugestões da
              sua comunidade local.
            </p>
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          </div>
        </GlassCard>
      </Link>
    )
  }

  if (suggestions.length === 0) {
    return (
      <GlassCard variant="flat" padded>
        {header}
        <p
          className="text-xs py-2"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Ainda não temos sugestões pra você. Volte mais tarde — ou convide
          alguém pra entrar no Veritas!
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="flat" padded>
      {header}
      <div className="space-y-2">
        {suggestions.map((s) => (
          <SuggestionRow
            key={s.id}
            profile={s}
            following={followingIds.has(s.id)}
            onFollow={() => handleFollow(s.id)}
          />
        ))}
      </div>
    </GlassCard>
  )
}

function SuggestionRow({
  profile,
  following,
  onFollow,
}: {
  profile: SuggestedProfile
  following: boolean
  onFollow: () => void
}) {
  const profileHref = profile.public_handle
    ? `/comunidade/@${profile.public_handle}`
    : profile.user_number
      ? `/comunidade/p/${profile.user_number}`
      : '/comunidade'
  const sub =
    typeof profile.mutual_count === 'number' && profile.mutual_count > 0
      ? `${profile.mutual_count} amigo${profile.mutual_count === 1 ? '' : 's'} em comum`
      : (profile.paroquia || profile.diocese || '—')
  return (
    <div className="flex items-center gap-3">
      <Link href={profileHref} className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
          }}
        >
          {profile.profile_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="w-full h-full flex items-center justify-center text-xs"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {(profile.name?.[0] ?? '?').toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {profile.name ?? 'Anônimo'}
            {profile.verified && (
              <Check
                className="inline w-3 h-3 ml-1"
                style={{ color: 'var(--accent)' }}
              />
            )}
          </p>
          <p
            className="text-[11px] truncate"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {sub}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onFollow}
        disabled={following}
        className="text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 rounded-full inline-flex items-center gap-1 transition-colors flex-shrink-0"
        style={{
          background: following
            ? 'rgba(102,187,106,0.12)'
            : 'rgba(201,168,76,0.12)',
          border: `1px solid ${
            following
              ? 'rgba(102,187,106,0.35)'
              : 'rgba(201,168,76,0.35)'
          }`,
          color: following ? '#66BB6A' : 'var(--accent)',
          fontFamily: 'var(--font-body)',
          cursor: following ? 'default' : 'pointer',
        }}
        aria-label={following ? 'Seguindo' : 'Seguir'}
      >
        {following ? (
          <>
            <Check className="w-3 h-3" />
            Seguindo
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3" />
            Seguir
          </>
        )}
      </button>
    </div>
  )
}
