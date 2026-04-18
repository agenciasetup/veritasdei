'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Lock } from 'lucide-react'
import VeritasCard from '@/components/comunidade/VeritasCard'
import MediaLightbox from '@/components/comunidade/MediaLightbox'
import InfiniteScrollSentinel from '@/components/comunidade/InfiniteScrollSentinel'
import type { VeritasPost } from '@/lib/community/types'

type Tab = 'veritas' | 'replies' | 'media' | 'likes'

interface Props {
  /** Identifier usado pra chamar RPCs das abas. */
  identifier: string
  viewerUserId: string | null
  /** Se o viewer pode ver a aba Curtidos (show_likes_public=true OU é o dono). */
  likesVisible: boolean
  /** Se o viewer é o dono do perfil. */
  isOwnProfile: boolean
}

interface TabState {
  posts: VeritasPost[]
  cursor: string | null
  loading: boolean
  loaded: boolean
  error: string | null
}

const INITIAL: TabState = {
  posts: [],
  cursor: null,
  loading: false,
  loaded: false,
  error: null,
}

export default function ProfileTabs({
  identifier,
  viewerUserId,
  likesVisible,
  isOwnProfile,
}: Props) {
  const [tab, setTab] = useState<Tab>('veritas')
  const [states, setStates] = useState<Record<Tab, TabState>>({
    veritas: { ...INITIAL },
    replies: { ...INITIAL },
    media: { ...INITIAL },
    likes: { ...INITIAL },
  })
  const [lightbox, setLightbox] = useState<{ items: VeritasPost['media']; index: number } | null>(null)

  const setTabState = useCallback((t: Tab, patch: Partial<TabState>) => {
    setStates(prev => ({ ...prev, [t]: { ...prev[t], ...patch } }))
  }, [])

  const load = useCallback(async (t: Tab, append = false) => {
    const current = states[t]
    if (append && !current.cursor) return
    setTabState(t, { loading: true, error: null })

    try {
      const params = new URLSearchParams()
      if (append && current.cursor) params.set('cursor', current.cursor)
      const res = await fetch(
        `/api/comunidade/perfil/${encodeURIComponent(identifier)}/tab/${t}?${params}`,
        { cache: 'no-store' },
      )
      if (!res.ok) throw new Error('Falha ao carregar')
      const data = (await res.json()) as {
        posts: VeritasPost[]
        pagination: { next_cursor: string | null }
      }
      setTabState(t, {
        posts: append ? [...current.posts, ...data.posts] : data.posts,
        cursor: data.pagination.next_cursor,
        loading: false,
        loaded: true,
      })
    } catch (e) {
      setTabState(t, {
        loading: false,
        error: e instanceof Error ? e.message : 'Erro',
      })
    }
  }, [identifier, states, setTabState])

  // Carrega sob demanda ao trocar de tab.
  useEffect(() => {
    const s = states[tab]
    if (!s.loaded && !s.loading) {
      void load(tab, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const TAB_LABELS: Record<Tab, string> = {
    veritas: 'Veritas',
    replies: 'Respostas',
    media: 'Mídia',
    likes: 'Curtidos',
  }

  const tabs: Tab[] = ['veritas', 'replies', 'media', 'likes']

  const currentState = states[tab]
  const showLikesLock = tab === 'likes' && !likesVisible

  return (
    <>
      <div
        className="flex items-center gap-1 mb-4 border-b overflow-x-auto"
        style={{ borderColor: 'rgba(201,168,76,0.15)' }}
      >
        {tabs.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-4 py-3 text-xs uppercase tracking-[0.12em] whitespace-nowrap"
            style={{
              color: tab === t ? '#C9A84C' : '#8A8378',
              fontFamily: 'Poppins, sans-serif',
              borderBottom: tab === t ? '2px solid #C9A84C' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {showLikesLock && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(16,16,16,0.6)',
            border: '1px solid rgba(201,168,76,0.1)',
          }}
        >
          <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: '#8A8378' }} />
          <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
            Este perfil não compartilha suas curtidas.
          </p>
          {isOwnProfile && (
            <p className="text-xs mt-2" style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
              Você pode habilitar em <Link href="/perfil?edit=1" className="underline">Editar perfil</Link>.
            </p>
          )}
        </div>
      )}

      {!showLikesLock && currentState.error && (
        <div
          className="mb-4 rounded-xl p-3 text-sm"
          style={{
            background: 'rgba(107,29,42,0.12)',
            border: '1px solid rgba(217,79,92,0.35)',
            color: '#D94F5C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {currentState.error}
        </div>
      )}

      {!showLikesLock && currentState.loading && currentState.posts.length === 0 && (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      )}

      {!showLikesLock && !currentState.loading && currentState.loaded && currentState.posts.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(16,16,16,0.6)',
            border: '1px solid rgba(201,168,76,0.1)',
          }}
        >
          <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
            {tab === 'replies' && 'Ainda não respondeu nenhum Veritas.'}
            {tab === 'media' && 'Ainda não publicou mídias.'}
            {tab === 'likes' && 'Ainda não curtiu nenhum Veritas.'}
            {tab === 'veritas' && 'Ainda não publicou Veritas.'}
          </p>
        </div>
      )}

      {/* Grade especial só pra aba Mídia */}
      {!showLikesLock && tab === 'media' && currentState.posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {currentState.posts.flatMap(post =>
            post.media.map((m, mIdx) => (
              <button
                key={`${post.id}-${m.id}`}
                type="button"
                onClick={() => setLightbox({ items: post.media, index: mIdx })}
                className="relative aspect-square overflow-hidden"
                aria-label="Abrir mídia"
              >
                <Image
                  src={m.variants.feed}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                  className="object-cover hover:opacity-85 transition-opacity"
                />
              </button>
            )),
          )}
        </div>
      )}

      {/* Demais tabs: lista hairline (sem gap entre posts). */}
      {!showLikesLock && tab !== 'media' && currentState.posts.length > 0 && (
        <div
          className="-mx-4 md:-mx-8"
          style={{ borderTop: '0.5px solid rgba(242,237,228,0.08)' }}
        >
          {currentState.posts.map(post => (
            <VeritasCard
              key={post.id}
              post={post}
              viewerUserId={viewerUserId}
              hideInlineReply
            />
          ))}
        </div>
      )}

      {!showLikesLock && currentState.cursor && (
        <InfiniteScrollSentinel
          onVisible={() => load(tab, true)}
          loading={currentState.loading}
          hasMore={Boolean(currentState.cursor)}
        />
      )}

      {lightbox && (
        <MediaLightbox
          items={lightbox.items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
