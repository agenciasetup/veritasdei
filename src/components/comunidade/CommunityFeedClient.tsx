/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Loader2,
  PlusCircle,
  Search,
  UserCog,
  BookOpenText,
  Shield,
} from 'lucide-react'
import { share as platformShare } from '@/lib/platform'
import type { FeedResponse, VeritasPost } from '@/lib/community/types'
import { useAuth } from '@/contexts/AuthContext'
import VeritasCard from '@/components/comunidade/VeritasCard'
import QuoteModal from '@/components/comunidade/QuoteModal'
import TrendingHashtags from '@/components/comunidade/TrendingHashtags'
import InfiniteScrollSentinel from '@/components/comunidade/InfiniteScrollSentinel'
import MentionAutocomplete from '@/components/comunidade/MentionAutocomplete'
import NotificationsBell from '@/components/comunidade/NotificationsBell'

interface PresignItem {
  upload_url: string
  object_key: string
  mime_type: string
  bytes: number
}

interface ComposerAttachment {
  file: File
  previewUrl: string
}

async function requestPresigns(files: File[]): Promise<PresignItem[]> {
  const res = await fetch('/api/comunidade/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map(file => ({
        filename: file.name,
        mime_type: file.type,
        bytes: file.size,
      })),
    }),
  })

  if (!res.ok) {
    throw new Error('Não foi possível preparar o upload de mídia.')
  }

  const data = await res.json() as { items: PresignItem[] }
  return data.items
}

async function uploadWithPresign(files: File[], items: PresignItem[]): Promise<void> {
  if (files.length !== items.length) {
    throw new Error('Falha no mapeamento dos uploads.')
  }

  await Promise.all(items.map(async (item, index) => {
    const file = files[index]
    const response = await fetch(item.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!response.ok) {
      throw new Error(`Falha no upload de ${file.name}.`)
    }
  }))
}

export default function CommunityFeedClient() {
  const { user, profile } = useAuth()
  const isClergy = profile
    ? ['padre', 'diacono', 'bispo', 'religioso'].includes(profile.community_role)
    : false
  const isAdmin = profile?.community_role === 'admin'
  const isModerator = profile?.community_role === 'moderator' || isAdmin
  // Regra: clero precisa estar verificado; admin pode sempre.
  const canPublishReflection = (isClergy && profile?.verified) || isAdmin
  const [variantReflection, setVariantReflection] = useState(false)
  const [tab, setTab] = useState<'for_you' | 'following'>('for_you')
  const [items, setItems] = useState<VeritasPost[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [composerBody, setComposerBody] = useState('')
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([])
  const [submittingPost, setSubmittingPost] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [quoteTarget, setQuoteTarget] = useState<VeritasPost | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  const canSubmitComposer = useMemo(() => {
    return composerBody.trim().length > 0 && !submittingPost
  }, [composerBody, submittingPost])

  useEffect(() => {
    void loadFeed('for_you', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadFeed(nextTab: 'for_you' | 'following', append = false) {
    if (append && !cursor) return

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const query = new URLSearchParams({
        tab: nextTab,
        limit: '20',
      })
      if (append && cursor) query.set('cursor', cursor)

      const res = await fetch(`/api/comunidade/feed?${query.toString()}`, {
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error('Não foi possível carregar o feed.')
      }

      const data = await res.json() as FeedResponse
      setCursor(data.cursor)
      setItems((prev) => {
        if (!append) return data.items
        const seen = new Set(prev.map(item => item.id))
        const fresh = data.items.filter(item => !seen.has(item.id))
        return [...prev, ...fresh]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feed.')
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  async function ensureFeedLoaded(nextTab: 'for_you' | 'following') {
    setTab(nextTab)
    setCursor(null)
    await loadFeed(nextTab, false)
  }

  async function createVeritas(payload: {
    kind: 'original' | 'reply' | 'quote'
    variant?: 'default' | 'reflection'
    body: string
    parent_post_id?: string
    media?: Array<{
      object_key: string
      mime_type: string
      bytes: number
    }>
  }) {
    const res = await fetch('/api/comunidade/veritas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null) as { detail?: string } | null
      throw new Error(data?.detail ?? 'Falha ao publicar Veritas.')
    }

    const data = await res.json() as { post: VeritasPost }
    return data.post
  }

  async function handleComposerSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmitComposer) return

    setSubmittingPost(true)
    setError(null)

    try {
      let mediaPayload: Array<{ object_key: string; mime_type: string; bytes: number }> = []

      if (composerAttachments.length > 0) {
        const files = composerAttachments.map(item => item.file)
        const presigns = await requestPresigns(files)
        await uploadWithPresign(files, presigns)
        mediaPayload = presigns.map(item => ({
          object_key: item.object_key,
          mime_type: item.mime_type,
          bytes: item.bytes,
        }))
      }

      const post = await createVeritas({
        kind: 'original',
        variant: variantReflection && canPublishReflection ? 'reflection' : 'default',
        body: composerBody.trim(),
        media: mediaPayload,
      })

      setItems(prev => [post, ...prev])
      setComposerBody('')
      setVariantReflection(false)
      for (const attachment of composerAttachments) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
      setComposerAttachments([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao publicar Veritas.')
    } finally {
      setSubmittingPost(false)
    }
  }

  function addComposerFiles(fileList: FileList | null) {
    if (!fileList) return
    const incoming = Array.from(fileList)

    const next: ComposerAttachment[] = []
    for (const file of incoming) {
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    setComposerAttachments(prev => {
      const merged = [...prev, ...next]
      return merged.slice(0, 6)
    })
  }

  function removeAttachmentAt(index: number) {
    setComposerAttachments(prev => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function toggleLike(post: VeritasPost) {
    // Optimistic: atualiza estado primeiro, chama API, reverte em erro.
    const willLike = !post.viewer.liked
    setItems(prev => prev.map(item => (
      item.id === post.id
        ? {
            ...item,
            viewer: { ...item.viewer, liked: willLike },
            metrics: {
              ...item.metrics,
              like_count: Math.max(0, item.metrics.like_count + (willLike ? 1 : -1)),
            },
          }
        : item
    )))

    const res = await fetch(`/api/comunidade/veritas/${post.id}/like`, {
      method: willLike ? 'POST' : 'DELETE',
    })

    if (!res.ok) {
      setItems(prev => prev.map(item => item.id === post.id ? post : item))
      setError('Falha ao curtir. Tente novamente.')
    }
  }

  async function toggleRepost(post: VeritasPost) {
    const willRepost = !post.viewer.reposted
    setItems(prev => prev.map(item => (
      item.id === post.id
        ? {
            ...item,
            viewer: { ...item.viewer, reposted: willRepost },
            metrics: {
              ...item.metrics,
              repost_count: Math.max(0, item.metrics.repost_count + (willRepost ? 1 : -1)),
            },
          }
        : item
    )))

    const res = await fetch(`/api/comunidade/veritas/${post.id}/repost`, {
      method: willRepost ? 'POST' : 'DELETE',
    })

    if (!res.ok) {
      setItems(prev => prev.map(item => item.id === post.id ? post : item))
      setError('Falha ao republicar. Tente novamente.')
    }
  }

  async function handleShareCross(post: VeritasPost) {
    const res = await fetch(`/api/comunidade/veritas/${post.id}/share-cross`, { method: 'POST' })
    if (!res.ok) return

    const data = await res.json() as {
      share: { title: string; text: string; url: string }
    }

    const absoluteUrl = new URL(data.share.url, window.location.origin).toString()
    await platformShare.text({
      title: data.share.title,
      text: data.share.text,
      url: absoluteUrl,
    })

    setItems(prev => prev.map(item => {
      if (item.id !== post.id) return item
      if (item.viewer.shared_cross) return item
      return {
        ...item,
        viewer: { ...item.viewer, shared_cross: true },
        metrics: {
          ...item.metrics,
          share_cross_count: item.metrics.share_cross_count + 1,
        },
      }
    }))
  }

  async function toggleFollow(authorId: string, followsNow: boolean) {
    const method = followsNow ? 'DELETE' : 'POST'
    const res = await fetch(`/api/comunidade/follows/${authorId}`, { method })
    if (!res.ok) return

    setItems(prev => prev.map(item => (
      item.author_user_id === authorId
        ? {
            ...item,
            viewer: {
              ...item.viewer,
              follows_author: !followsNow,
            },
          }
        : item
    )))
  }

  async function toggleMute(authorId: string, mutedNow: boolean) {
    const method = mutedNow ? 'DELETE' : 'POST'
    const res = await fetch(`/api/comunidade/mutes/${authorId}`, { method })
    if (!res.ok) return

    setItems(prev => prev.map(item => (
      item.author_user_id === authorId
        ? {
            ...item,
            viewer: {
              ...item.viewer,
              muted_author: !mutedNow,
            },
          }
        : item
    )))
  }

  async function submitReply(post: VeritasPost, body: string) {
    const replyBody = body.trim()
    if (!replyBody) return

    const res = await fetch('/api/comunidade/veritas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'reply',
        body: replyBody,
        parent_post_id: post.id,
      }),
    })

    if (!res.ok) {
      setError('Falha ao responder. Tente novamente.')
      return
    }

    setReplyDrafts(prev => ({ ...prev, [post.id]: '' }))
    setItems(prev => prev.map(item => (
      item.id === post.id
        ? {
            ...item,
            metrics: {
              ...item.metrics,
              reply_count: item.metrics.reply_count + 1,
            },
          }
        : item
    )))
  }

  function openQuoteModal(post: VeritasPost) {
    setQuoteTarget(post)
  }

  async function handleQuoteSubmit(body: string) {
    const target = quoteTarget
    if (!target) return

    const quote = await createVeritas({
      kind: 'quote',
      body,
      parent_post_id: target.id,
    })

    setItems(prev => [quote, ...prev])
    setItems(prev => prev.map(item => (
      item.id === target.id
        ? {
            ...item,
            metrics: {
              ...item.metrics,
              quote_count: item.metrics.quote_count + 1,
            },
          }
        : item
    )))
  }

  const onInit = items.length === 0 && !loading

  return (
    <div
      className="min-h-screen px-4 md:px-8 py-8 relative"
      style={{
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
        paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl mb-2"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Comunidade Veritas
            </h1>
            <p
              className="text-sm"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Publicações católicas para formar, partilhar e fortalecer a fé.
            </p>
          </div>

          <Link
            href="/comunidade/perfil/editar"
            className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: 'rgba(16,16,16,0.65)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <UserCog className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Meu perfil</span>
          </Link>
        </header>

        <div
          className="flex items-center gap-2 mb-4 sticky top-0 z-20 py-2 -mx-4 px-4 md:-mx-8 md:px-8"
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.88) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <button
            type="button"
            onClick={() => ensureFeedLoaded('for_you')}
            className="px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em]"
            style={{
              background: tab === 'for_you' ? 'rgba(201,168,76,0.14)' : 'rgba(16,16,16,0.65)',
              border: tab === 'for_you' ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(201,168,76,0.12)',
              color: tab === 'for_you' ? '#C9A84C' : '#8A8378',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Para você
          </button>
          <button
            type="button"
            onClick={() => ensureFeedLoaded('following')}
            className="px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em]"
            style={{
              background: tab === 'following' ? 'rgba(201,168,76,0.14)' : 'rgba(16,16,16,0.65)',
              border: tab === 'following' ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(201,168,76,0.12)',
              color: tab === 'following' ? '#C9A84C' : '#8A8378',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Seguindo
          </button>

          <div className="ml-auto flex items-center gap-2">
            {isModerator && (
              <Link
                href="/comunidade/admin/moderacao"
                aria-label="Moderação"
                title="Moderação"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: 'rgba(217,79,92,0.10)',
                  border: '1px solid rgba(217,79,92,0.28)',
                  color: '#D94F5C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Moderar</span>
              </Link>
            )}

            <Link
              href="/comunidade/buscar"
              aria-label="Buscar"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{
                background: 'rgba(16,16,16,0.65)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buscar</span>
            </Link>

            <NotificationsBell />

            <button
              type="button"
              onClick={() => loadFeed(tab, false)}
              aria-label="Atualizar feed"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{
                background: 'rgba(16,16,16,0.65)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        <TrendingHashtags />

        <form
          onSubmit={handleComposerSubmit}
          className="rounded-2xl p-4 md:p-5 mb-6"
          style={{
            background: 'rgba(16,16,16,0.78)',
            border: '1px solid rgba(201,168,76,0.16)',
          }}
        >
          <div className="relative">
            <textarea
              ref={composerRef}
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value.slice(0, 1000))}
              placeholder="Escreva seu Veritas... Use #hashtag e @menção."
              className="w-full min-h-28 resize-y rounded-xl p-3 text-sm"
              style={{
                background: 'rgba(10,10,10,0.65)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
            />
            <MentionAutocomplete
              inputRef={composerRef}
              value={composerBody}
              onInsert={(next) => setComposerBody(next.slice(0, 1000))}
            />
          </div>

          {composerAttachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {composerAttachments.map((attachment, index) => (
                <div key={`${attachment.file.name}-${index}`} className="relative rounded-xl overflow-hidden">
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.file.name}
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachmentAt(index)}
                    className="absolute top-1 right-1 rounded-lg px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: 'rgba(0,0,0,0.75)',
                      color: '#F2EDE4',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer"
              style={{
                background: 'rgba(16,16,16,0.6)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar mídia
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif"
                multiple
                className="hidden"
                onChange={(e) => addComposerFiles(e.target.files)}
              />
            </label>

            {canPublishReflection && (
              <button
                type="button"
                onClick={() => setVariantReflection(v => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: variantReflection
                    ? 'rgba(233,196,106,0.18)'
                    : 'rgba(16,16,16,0.6)',
                  border: variantReflection
                    ? '1px solid rgba(233,196,106,0.5)'
                    : '1px solid rgba(201,168,76,0.15)',
                  color: variantReflection ? '#E9C46A' : '#C9A84C',
                  fontFamily: 'Cinzel, serif',
                }}
                title="Publicar como Reflexão (visível apenas para clero publicar)"
              >
                <BookOpenText className="w-4 h-4" />
                {variantReflection ? 'Reflexão ativa' : 'Marcar como Reflexão'}
              </button>
            )}

            <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              {composerBody.trim().length}/1000
            </span>

            <button
              type="submit"
              disabled={!canSubmitComposer}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: '#0A0A0A',
                fontFamily: 'Cinzel, serif',
              }}
            >
              {submittingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Publicar Veritas
            </button>
          </div>
        </form>

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

        {onInit && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => loadFeed(tab, false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
              style={{
                background: 'rgba(16,16,16,0.65)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Carregar feed
            </button>
          </div>
        )}

        {loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {items.map((post) => (
              <VeritasCard
                key={post.id}
                post={post}
                viewerUserId={user?.id ?? null}
                replyDraft={replyDrafts[post.id] ?? ''}
                onReplyDraftChange={(value) => setReplyDrafts(prev => ({ ...prev, [post.id]: value }))}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onQuote={openQuoteModal}
                onShareCross={handleShareCross}
                onToggleFollow={toggleFollow}
                onToggleMute={toggleMute}
                onReplySubmit={submitReply}
              />
            ))}

            {!loading && items.length === 0 && (
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(16,16,16,0.65)',
                  border: '1px solid rgba(201,168,76,0.1)',
                }}
              >
                <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
                  Ainda não há Veritas neste feed.
                </p>
              </div>
            )}

            <InfiniteScrollSentinel
              onVisible={() => loadFeed(tab, true)}
              loading={loadingMore}
              hasMore={Boolean(cursor)}
            />
          </div>
        )}
      </div>

      <QuoteModal
        post={quoteTarget}
        open={quoteTarget !== null}
        onClose={() => setQuoteTarget(null)}
        onSubmit={handleQuoteSubmit}
      />
    </div>
  )
}
