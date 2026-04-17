'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import VeritasCard from '@/components/comunidade/VeritasCard'
import InfiniteScrollSentinel from '@/components/comunidade/InfiniteScrollSentinel'
import type { VeritasPost } from '@/lib/community/types'
import { share as platformShare } from '@/lib/platform'

interface HashtagMeta {
  slug: string
  display: string
  usage_count: number
  last_used_at: string | null
}

interface HashtagResponse {
  hashtag: HashtagMeta
  posts: VeritasPost[]
  pagination: { next_cursor: string | null; limit: number }
}

export default function HashtagFeedClient({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [meta, setMeta] = useState<HashtagMeta | null>(null)
  const [items, setItems] = useState<VeritasPost[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  async function load(append = false) {
    if (append && !cursor) return
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ limit: '20' })
      if (append && cursor) params.set('cursor', cursor)

      const res = await fetch(
        `/api/comunidade/hashtag/${encodeURIComponent(slug)}?${params}`,
        { cache: 'no-store' },
      )
      if (!res.ok) throw new Error('Falha ao carregar hashtag')

      const data = (await res.json()) as HashtagResponse
      setMeta(data.hashtag)
      setCursor(data.pagination.next_cursor)
      setItems(prev => {
        if (!append) return data.posts
        const seen = new Set(prev.map(i => i.id))
        return [...prev, ...data.posts.filter(p => !seen.has(p.id))]
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
  }, [slug])

  async function toggleLike(post: VeritasPost) {
    const willLike = !post.viewer.liked
    setItems(prev => prev.map(i => i.id === post.id ? {
      ...i,
      viewer: { ...i.viewer, liked: willLike },
      metrics: { ...i.metrics, like_count: Math.max(0, i.metrics.like_count + (willLike ? 1 : -1)) },
    } : i))

    const res = await fetch(`/api/comunidade/veritas/${post.id}/like`, {
      method: willLike ? 'POST' : 'DELETE',
    })
    if (!res.ok) {
      // rollback
      setItems(prev => prev.map(i => i.id === post.id ? post : i))
      setError('Falha ao curtir')
    }
  }

  async function toggleRepost(post: VeritasPost) {
    const willRepost = !post.viewer.reposted
    setItems(prev => prev.map(i => i.id === post.id ? {
      ...i,
      viewer: { ...i.viewer, reposted: willRepost },
      metrics: { ...i.metrics, repost_count: Math.max(0, i.metrics.repost_count + (willRepost ? 1 : -1)) },
    } : i))

    const res = await fetch(`/api/comunidade/veritas/${post.id}/repost`, {
      method: willRepost ? 'POST' : 'DELETE',
    })
    if (!res.ok) {
      setItems(prev => prev.map(i => i.id === post.id ? post : i))
      setError('Falha ao republicar')
    }
  }

  async function handleShareCross(post: VeritasPost) {
    const res = await fetch(`/api/comunidade/veritas/${post.id}/share-cross`, { method: 'POST' })
    if (!res.ok) return

    const data = await res.json() as { share: { title: string; text: string; url: string } }
    const absoluteUrl = new URL(data.share.url, window.location.origin).toString()
    await platformShare.text({ title: data.share.title, text: data.share.text, url: absoluteUrl })

    setItems(prev => prev.map(i => (
      i.id === post.id && !i.viewer.shared_cross
        ? { ...i, viewer: { ...i.viewer, shared_cross: true }, metrics: { ...i.metrics, share_cross_count: i.metrics.share_cross_count + 1 } }
        : i
    )))
  }

  async function submitReply(post: VeritasPost, body: string) {
    const trimmed = body.trim()
    if (!trimmed) return

    const res = await fetch('/api/comunidade/veritas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'reply', body: trimmed, parent_post_id: post.id }),
    })
    if (!res.ok) {
      setError('Falha ao responder')
      return
    }

    setReplyDrafts(prev => ({ ...prev, [post.id]: '' }))
    setItems(prev => prev.map(i => i.id === post.id
      ? { ...i, metrics: { ...i.metrics, reply_count: i.metrics.reply_count + 1 } }
      : i
    ))
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          href="/comunidade"
          className="inline-flex items-center gap-2 mb-6 text-sm"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao feed
        </Link>

        <header className="mb-6">
          <h1
            className="text-2xl md:text-3xl mb-1"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            #{meta?.display ?? slug}
          </h1>
          {meta && meta.usage_count > 0 && (
            <p className="text-sm" style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
              {meta.usage_count} {meta.usage_count === 1 ? 'Veritas' : 'Veritas'}
            </p>
          )}
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

        {!loading && (
          <div className="space-y-4">
            {items.map(post => (
              <VeritasCard
                key={post.id}
                post={post}
                viewerUserId={user?.id ?? null}
                replyDraft={replyDrafts[post.id] ?? ''}
                onReplyDraftChange={v => setReplyDrafts(prev => ({ ...prev, [post.id]: v }))}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onShareCross={handleShareCross}
                onReplySubmit={submitReply}
              />
            ))}

            {items.length === 0 && (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: 'rgba(16,16,16,0.65)', border: '1px solid rgba(201,168,76,0.1)' }}
              >
                <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
                  Ainda não há Veritas com esta hashtag.
                </p>
              </div>
            )}

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
