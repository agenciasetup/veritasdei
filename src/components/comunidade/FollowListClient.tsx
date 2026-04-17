/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, UserPlus, UserMinus } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'
import RoleBadge from '@/components/comunidade/RoleBadge'
import InfiniteScrollSentinel from '@/components/comunidade/InfiniteScrollSentinel'
import type { CommunityRole } from '@/lib/community/types'

interface ProfileEntry {
  id: string
  name: string | null
  public_handle: string | null
  user_number: number | null
  profile_image_url: string | null
  community_role: CommunityRole
  verified: boolean
  bio_short: string | null
  viewer_follows: boolean
  is_viewer: boolean
}

interface Props {
  userId: string
  handle: string | null
  userNumber: number | null
  type: 'followers' | 'following'
  displayName: string
}

const TITLES: Record<'followers' | 'following', string> = {
  followers: 'Seguidores',
  following: 'Seguindo',
}

export default function FollowListClient({
  userId,
  handle,
  userNumber,
  type,
  displayName,
}: Props) {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profileHref = handle ? `/comunidade/@${handle}` : `/comunidade/p/${userNumber ?? ''}`

  async function load(append = false) {
    if (append && !cursor) return
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ type })
      if (append && cursor) params.set('cursor', cursor)
      const res = await fetch(
        `/api/comunidade/follows/${userId}/list?${params}`,
        { cache: 'no-store' },
      )
      if (!res.ok) throw new Error('Falha ao carregar lista')
      const data = (await res.json()) as {
        profiles: ProfileEntry[]
        pagination: { next_cursor: string | null }
      }
      setCursor(data.pagination.next_cursor)
      setProfiles(prev => {
        if (!append) return data.profiles
        const seen = new Set(prev.map(p => p.id))
        return [...prev, ...data.profiles.filter(p => !seen.has(p.id))]
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type])

  async function toggleFollow(entry: ProfileEntry) {
    const willFollow = !entry.viewer_follows
    setProfiles(prev => prev.map(p => p.id === entry.id ? { ...p, viewer_follows: willFollow } : p))
    const res = await fetch(`/api/comunidade/follows/${entry.id}`, {
      method: willFollow ? 'POST' : 'DELETE',
    })
    if (!res.ok) {
      setProfiles(prev => prev.map(p => p.id === entry.id ? { ...p, viewer_follows: !willFollow } : p))
      setError('Falha ao atualizar seguimento')
    }
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href={profileHref}
          className="inline-flex items-center gap-2 mb-6 text-sm"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> {displayName}
        </Link>

        <header className="mb-6">
          <h1
            className="text-2xl md:text-3xl"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            {TITLES[type]}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            {type === 'followers'
              ? `Quem segue ${displayName}`
              : `Quem ${displayName} segue`}
          </p>
        </header>

        {error && (
          <div
            className="mb-4 rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(107,29,42,0.12)',
              border: '1px solid rgba(217,79,92,0.35)',
              color: '#D94F5C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        )}

        {!loading && profiles.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(16,16,16,0.65)',
              border: '1px solid rgba(201,168,76,0.1)',
            }}
          >
            <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
              {type === 'followers'
                ? 'Ainda não há seguidores.'
                : 'Ainda não segue ninguém.'}
            </p>
          </div>
        )}

        {!loading && profiles.length > 0 && (
          <div className="space-y-2">
            {profiles.map(entry => {
              const entryHref = entry.public_handle
                ? `/comunidade/@${entry.public_handle}`
                : entry.user_number
                  ? `/comunidade/p/${entry.user_number}`
                  : '#'

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{
                    background: 'rgba(16,16,16,0.75)',
                    border: '1px solid rgba(201,168,76,0.14)',
                  }}
                >
                  <Link
                    href={entryHref}
                    className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{
                      background: entry.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.2)',
                    }}
                  >
                    {entry.profile_image_url ? (
                      <img
                        src={entry.profile_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CrossIcon size="sm" />
                    )}
                  </Link>

                  <Link href={entryHref} className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-sm font-medium"
                        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {entry.name ?? 'Membro Veritas'}
                      </span>
                      {entry.verified && <VerifiedBadge size={14} />}
                      <RoleBadge role={entry.community_role} size="sm" />
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {entry.public_handle ? `@${entry.public_handle}` : `#${entry.user_number ?? ''}`}
                    </p>
                    {entry.bio_short && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: '#B8B0A2', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {entry.bio_short}
                      </p>
                    )}
                  </Link>

                  {!entry.is_viewer && (
                    <button
                      type="button"
                      onClick={() => toggleFollow(entry)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        background: entry.viewer_follows
                          ? 'rgba(16,16,16,0.6)'
                          : 'rgba(201,168,76,0.14)',
                        border: '1px solid rgba(201,168,76,0.25)',
                        color: entry.viewer_follows ? '#8A8378' : '#C9A84C',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {entry.viewer_follows
                        ? <><UserMinus className="w-3.5 h-3.5" />Seguindo</>
                        : <><UserPlus className="w-3.5 h-3.5" />Seguir</>}
                    </button>
                  )}
                </div>
              )
            })}

            <InfiniteScrollSentinel
              onVisible={() => load(true)}
              loading={loadingMore}
              hasMore={Boolean(cursor)}
            />
          </div>
        )}
      </div>
    </main>
  )
}
