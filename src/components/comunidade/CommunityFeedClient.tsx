/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
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
import { MapPin } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import VeritasCard from '@/components/comunidade/VeritasCard'
import { VeritasFeedSkeleton } from '@/components/comunidade/VeritasCardSkeleton'
import QuoteModal from '@/components/comunidade/QuoteModal'
import TrendingHashtags from '@/components/comunidade/TrendingHashtags'
import InfiniteScrollSentinel from '@/components/comunidade/InfiniteScrollSentinel'
import MentionAutocomplete from '@/components/comunidade/MentionAutocomplete'
import FormattingToolbar from '@/components/comunidade/FormattingToolbar'
import MarkdownPreview from '@/components/comunidade/MarkdownPreview'
import NotificationsBell from '@/components/comunidade/NotificationsBell'
import PullToRefresh from '@/components/mobile/PullToRefresh'
import { compressImage } from '@/lib/image/compress'

const SCROLL_STORAGE_KEY = 'veritasdei:comunidade:feed:scroll'

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

interface CommunityFeedClientProps {
  /** Feed "for_you" já resolvido no servidor — elimina o flash inicial. */
  initialFeed?: FeedResponse | null
}

export default function CommunityFeedClient({ initialFeed = null }: CommunityFeedClientProps = {}) {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription()
  const isClergy = profile
    ? ['padre', 'diacono', 'bispo', 'religioso'].includes(profile.community_role)
    : false
  const isAdmin = profile?.community_role === 'admin'
  const isModerator = profile?.community_role === 'moderator' || isAdmin
  // Regra: clero precisa estar verificado; admin pode sempre.
  const canPublishReflection = (isClergy && profile?.verified) || isAdmin
  const [variantReflection, setVariantReflection] = useState(false)
  const [tab, setTab] = useState<'for_you' | 'following' | 'nearby'>('for_you')
  const [nearbyStatus, setNearbyStatus] = useState<'idle' | 'prompting' | 'denied' | 'unavailable' | 'ready'>('idle')
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Sincroniza coords com o profile (useAuth pode carregar depois do mount).
  useEffect(() => {
    if (nearbyCoords) return
    if (profile?.location_lat != null && profile?.location_lng != null) {
      const lat = Number(profile.location_lat)
      const lng = Number(profile.location_lng)
      setNearbyCoords({ lat, lng })
      setNearbyStatus('ready')

      // Se coords existem mas cidade está faltando, dispara o backfill
      // server-side (Nominatim). Fire-and-forget.
      if (!profile.location_city || !profile.location_state) {
        void fetch('/api/comunidade/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        })
      }
    }
  }, [profile?.location_lat, profile?.location_lng, profile?.location_city, profile?.location_state, nearbyCoords])
  const [items, setItems] = useState<VeritasPost[]>(initialFeed?.items ?? [])
  const [cursor, setCursor] = useState<string | null>(initialFeed?.cursor ?? null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [composerOpen, setComposerOpen] = useState(false)
  const [composerBody, setComposerBody] = useState('')
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([])
  const [submittingPost, setSubmittingPost] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [quoteTarget, setQuoteTarget] = useState<VeritasPost | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const didRestoreScrollRef = useRef(false)

  const canSubmitComposer = useMemo(() => {
    return composerBody.trim().length > 0 && !submittingPost
  }, [composerBody, submittingPost])

  useEffect(() => {
    // Se o servidor já entregou o feed, pula o fetch inicial — economiza
    // um round-trip e elimina o flash de feed vazio pós-hidratação.
    if (initialFeed && initialFeed.items.length > 0) return
    void loadFeed('for_you', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll restoration: salva posição antes de sair, restaura após primeiro
  // render do feed. Chave única pra rota — evita colidir com outras páginas.
  useEffect(() => {
    function save() {
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY))
      } catch {
        // Silencioso.
      }
    }
    window.addEventListener('pagehide', save)
    window.addEventListener('beforeunload', save)
    return () => {
      save()
      window.removeEventListener('pagehide', save)
      window.removeEventListener('beforeunload', save)
    }
  }, [])

  useEffect(() => {
    if (didRestoreScrollRef.current) return
    if (loading || items.length === 0) return
    didRestoreScrollRef.current = true
    try {
      const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY)
      if (!raw) return
      const y = Number(raw)
      if (!Number.isFinite(y) || y <= 0) return
      // Next tick pra garantir layout pós-paint.
      requestAnimationFrame(() => window.scrollTo(0, y))
    } catch {
      // Silencioso.
    }
  }, [loading, items.length])

  async function loadFeed(nextTab: 'for_you' | 'following' | 'nearby', append = false, coords?: { lat: number; lng: number } | null) {
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
      const effectiveCoords = coords ?? nearbyCoords
      if (nextTab === 'nearby' && effectiveCoords) {
        query.set('lat', String(effectiveCoords.lat))
        query.set('lng', String(effectiveCoords.lng))
      }

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

  async function requestNearbyLocation(): Promise<{ lat: number; lng: number } | null> {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setNearbyStatus('unavailable')
      setError('Geolocalização não disponível neste dispositivo.')
      return null
    }

    setNearbyStatus('prompting')

    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setNearbyCoords({ lat, lng })
          setNearbyStatus('ready')

          // Persiste no perfil (fire-and-forget, não bloqueia o feed).
          void fetch('/api/comunidade/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
          })

          resolve({ lat, lng })
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setNearbyStatus('denied')
            setError('Permissão de localização negada.')
          } else {
            setNearbyStatus('unavailable')
            setError('Não foi possível obter sua localização.')
          }
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
      )
    })
  }

  async function ensureFeedLoaded(nextTab: 'for_you' | 'following' | 'nearby') {
    setTab(nextTab)
    setCursor(null)

    if (nextTab === 'nearby') {
      let coords = nearbyCoords
      if (!coords) {
        coords = await requestNearbyLocation()
      }
      if (!coords) {
        setItems([])
        return
      }
      await loadFeed(nextTab, false, coords)
      return
    }

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
      setComposerOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao publicar Veritas.')
    } finally {
      setSubmittingPost(false)
    }
  }

  function addComposerFiles(fileList: FileList | null) {
    if (!fileList) return
    const incoming = Array.from(fileList)

    // Insere já com preview do arquivo original (instantâneo), depois
    // substitui pelo comprimido em background — UX não bloqueia.
    const baseline: ComposerAttachment[] = incoming.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setComposerAttachments(prev => [...prev, ...baseline].slice(0, 6))

    // Comprime em paralelo. O resultado troca o File (preview continua,
    // só o bytes no upload é menor).
    for (const original of incoming) {
      void compressImage(original).then(result => {
        if (!result.compressed) return
        setComposerAttachments(prev => prev.map(item => {
          if (item.file !== original) return item
          URL.revokeObjectURL(item.previewUrl)
          return {
            file: result.file,
            previewUrl: URL.createObjectURL(result.file),
          }
        }))
      })
    }
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

  async function handleEditSubmit(target: VeritasPost, body: string) {
    const res = await fetch(`/api/comunidade/veritas/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) {
      const detail = await res.json().catch(() => null) as { detail?: string } | null
      throw new Error(detail?.detail ?? 'Falha ao editar.')
    }
    const data = await res.json() as { post: VeritasPost }
    setItems(prev => prev.map(i => i.id === target.id ? data.post : i))
  }

  async function handleDelete(post: VeritasPost) {
    // Remove otimista
    const previous = items
    setItems(prev => prev.filter(i => i.id !== post.id))
    const res = await fetch(`/api/comunidade/veritas/${post.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setItems(previous)
      setError('Falha ao apagar.')
    }
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
        <PullToRefresh onRefresh={async () => { await loadFeed(tab, false) }}>
        <header className="mb-4 hidden md:flex items-start justify-between gap-4">
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
        </header>

        <div
          className="sticky top-0 z-20 -mx-4 md:-mx-8 mb-3"
          style={{
            background: 'rgba(15,14,12,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-1 px-2 md:px-4">
            <button
              type="button"
              onClick={() => ensureFeedLoaded('for_you')}
              className="relative px-3 md:px-4 py-3 text-[13px] uppercase tracking-[0.14em]"
              style={{
                color: tab === 'for_you' ? '#F2EDE4' : '#8A8378',
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
                border: 'none',
              }}
            >
              Feed
              {tab === 'for_you' && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: '#C9A84C' }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => ensureFeedLoaded('following')}
              className="relative px-3 md:px-4 py-3 text-[13px] uppercase tracking-[0.14em]"
              style={{
                color: tab === 'following' ? '#F2EDE4' : '#8A8378',
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
                border: 'none',
              }}
            >
              Amigos
              {tab === 'following' && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: '#C9A84C' }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => ensureFeedLoaded('nearby')}
              className="relative px-3 md:px-4 py-3 text-[13px] uppercase tracking-[0.14em] inline-flex items-center gap-1.5"
              style={{
                color: tab === 'nearby' ? '#F2EDE4' : '#8A8378',
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
                border: 'none',
              }}
            >
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.6} />
              Próximo
              {tab === 'nearby' && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: '#C9A84C' }}
                />
              )}
            </button>

            <div className="ml-auto flex items-center gap-1 pr-2">
              {isModerator && (
                <Link
                  href="/comunidade/admin/moderacao"
                  aria-label="Moderação"
                  title="Moderação"
                  className="p-2 rounded-full"
                  style={{ color: '#D94F5C' }}
                >
                  <Shield className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </Link>
              )}

              <Link
                href="/comunidade/buscar"
                aria-label="Buscar"
                className="p-2 rounded-full"
                style={{ color: '#8A8378' }}
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>

              <NotificationsBell />

              <Link
                href="/perfil?edit=1"
                aria-label="Meu perfil"
                className="p-2 rounded-full"
                style={{ color: '#8A8378' }}
              >
                <UserCog className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>

              <button
                type="button"
                onClick={() => loadFeed(tab, false)}
                aria-label="Atualizar feed"
                className="p-2 rounded-full hidden md:inline-flex"
                style={{ color: '#8A8378' }}
              >
                <RefreshCw className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div style={{ height: '0.5px', background: 'rgba(242,237,228,0.08)' }} />
        </div>

        <TrendingHashtags />

        {!composerOpen && user && isPremium && (
          <button
            type="button"
            onClick={() => {
              setComposerOpen(true)
              setTimeout(() => composerRef.current?.focus(), 50)
            }}
            className="w-full flex items-center gap-3 mb-4 py-3 text-left transition-colors"
            style={{
              borderTop: '0.5px solid rgba(242,237,228,0.08)',
              borderBottom: '0.5px solid rgba(242,237,228,0.08)',
            }}
          >
            <span
              className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                background: profile?.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.10)',
              }}
            >
              {profile?.profile_image_url ? (
                <Image
                  src={profile.profile_image_url}
                  alt={profile?.name ?? 'Perfil'}
                  width={36}
                  height={36}
                  sizes="36px"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs" style={{ color: '#C9A84C' }}>†</span>
              )}
            </span>
            <span
              className="flex-1 text-[15px]"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Quais são as novidades?
            </span>
            <span
              className="text-xs uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
              style={{
                color: '#C9A84C',
                fontFamily: 'Cinzel, serif',
                border: '1px solid rgba(201,168,76,0.35)',
              }}
            >
              Publicar
            </span>
          </button>
        )}

        {!composerOpen && user && !isPremium && (
          <div
            className="flex items-center gap-3 mb-4 py-3"
            style={{
              borderTop: '0.5px solid rgba(242,237,228,0.08)',
              borderBottom: '0.5px solid rgba(242,237,228,0.08)',
            }}
          >
            <span
              className="flex-1 text-[13px] leading-snug"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Ler, curtir, repostar e compartilhar são livres. Para publicar e seguir, assine o plano Estudos.
            </span>
            <Link
              href="/planos"
              className="flex-shrink-0 text-xs uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
              style={{
                color: '#0F0E0C',
                fontFamily: 'Cinzel, serif',
                background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                fontWeight: 600,
              }}
            >
              Assinar
            </Link>
          </div>
        )}

        {!composerOpen && !user && (
          <div
            className="flex items-center gap-3 mb-4 py-3"
            style={{
              borderTop: '0.5px solid rgba(242,237,228,0.08)',
              borderBottom: '0.5px solid rgba(242,237,228,0.08)',
            }}
          >
            <span
              className="flex-1 text-[13px] leading-snug"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Entre para seguir, curtir e publicar.
            </span>
            <Link
              href="/login?next=/comunidade"
              className="flex-shrink-0 text-xs uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
              style={{
                color: '#C9A84C',
                fontFamily: 'Cinzel, serif',
                border: '1px solid rgba(201,168,76,0.35)',
              }}
            >
              Entrar
            </Link>
          </div>
        )}

        {composerOpen && (
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
              placeholder="Escreva seu Veritas... Use #hashtag, @menção, **negrito**, *itálico*."
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

          <div className="mt-2">
            <FormattingToolbar
              inputRef={composerRef}
              value={composerBody}
              onChange={(next) => setComposerBody(next.slice(0, 1000))}
              maxLength={1000}
            />
          </div>

          <MarkdownPreview value={composerBody} />

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
              type="button"
              onClick={() => setComposerOpen(false)}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{
                background: 'transparent',
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!canSubmitComposer}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em] disabled:opacity-50"
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
        )}

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

        {loading && items.length === 0 && (
          <div
            className="-mx-4 md:-mx-8 rounded-none overflow-hidden"
            style={{ borderTop: '0.5px solid rgba(242,237,228,0.08)' }}
          >
            <VeritasFeedSkeleton count={4} />
          </div>
        )}

        {!loading && (
          <div
            className="-mx-4 md:-mx-8"
            style={{ borderTop: items.length > 0 ? '0.5px solid rgba(242,237,228,0.08)' : undefined }}
          >
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
                onEditSubmit={handleEditSubmit}
                onDelete={handleDelete}
              />
            ))}

            {!loading && items.length === 0 && tab === 'nearby' && (nearbyStatus === 'denied' || nearbyStatus === 'unavailable') && (
              <div
                className="py-16 text-center px-6"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                <MapPin className="w-6 h-6 mx-auto mb-3" style={{ color: '#C9A84C' }} strokeWidth={1.4} />
                <p className="text-sm mb-3" style={{ color: '#E7DED1' }}>
                  Precisamos da sua localização para mostrar Veritas próximos.
                </p>
                <p className="text-xs mb-4">
                  {nearbyStatus === 'denied'
                    ? 'Você negou a permissão. Habilite nas configurações do navegador e tente novamente.'
                    : 'Não foi possível obter sua localização agora.'}
                </p>
                <button
                  type="button"
                  onClick={() => { void requestNearbyLocation().then(coords => { if (coords) void loadFeed('nearby', false, coords) }) }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em]"
                  style={{
                    background: 'rgba(16,16,16,0.65)',
                    border: '1px solid rgba(201,168,76,0.35)',
                    color: '#C9A84C',
                    fontFamily: 'Cinzel, serif',
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.6} />
                  Ativar localização
                </button>
              </div>
            )}

            {!loading && items.length === 0 && tab === 'nearby' && nearbyStatus === 'ready' && (
              <div
                className="py-16 text-center px-6"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                <MapPin className="w-6 h-6 mx-auto mb-3" style={{ color: '#C9A84C' }} strokeWidth={1.4} />
                <p className="text-sm" style={{ color: '#E7DED1' }}>
                  Ninguém postou perto de você ainda.
                </p>
                <p className="text-xs mt-2">
                  Seja o primeiro a compartilhar um Veritas na sua região.
                </p>
              </div>
            )}

            {!loading && items.length === 0 && tab !== 'nearby' && (
              <div
                className="py-16 text-center"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                Ainda não há Veritas neste feed.
              </div>
            )}

            <InfiniteScrollSentinel
              onVisible={() => loadFeed(tab, true)}
              loading={loadingMore}
              hasMore={Boolean(cursor)}
            />
          </div>
        )}
        </PullToRefresh>
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
