'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import VeritasCard from '@/components/comunidade/VeritasCard'
import QuoteModal from '@/components/comunidade/QuoteModal'
import MentionAutocomplete from '@/components/comunidade/MentionAutocomplete'
import FormattingToolbar from '@/components/comunidade/FormattingToolbar'
import type { VeritasPost } from '@/lib/community/types'
import { VERITAS_MAX_BODY } from '@/lib/community/constants'
import { share as platformShare } from '@/lib/platform'

interface ThreadResponse {
  post: VeritasPost
  replies: VeritasPost[]
  pagination: { next_cursor: string | null; limit: number }
}

interface SubReplyState {
  items: VeritasPost[]
  cursor: string | null
  loading: boolean
  expanded: boolean
}

const MAX_DEPTH = 2

export default function ThreadView({ postId }: { postId: string }) {
  const { user } = useAuth()
  const [post, setPost] = useState<VeritasPost | null>(null)
  const [ancestors, setAncestors] = useState<VeritasPost[]>([])
  const [replies, setReplies] = useState<VeritasPost[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [quoteTarget, setQuoteTarget] = useState<VeritasPost | null>(null)
  const [subReplies, setSubReplies] = useState<Record<string, SubReplyState>>({})

  async function fetchThread(id: string): Promise<ThreadResponse> {
    const res = await fetch(`/api/comunidade/veritas/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Falha ao carregar Veritas')
    return res.json()
  }

  async function loadAncestors(startParentId: string | null) {
    const chain: VeritasPost[] = []
    let current = startParentId
    while (current && chain.length < 20) {
      try {
        const r = await fetch(`/api/comunidade/veritas/${current}`, { cache: 'no-store' })
        if (!r.ok) break
        const data = (await r.json()) as ThreadResponse
        chain.unshift(data.post)
        current = data.post.parent_post_id
      } catch {
        break
      }
    }
    setAncestors(chain)
  }

  async function loadInitial() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchThread(postId)
      setPost(data.post)
      setReplies(data.replies)
      setCursor(data.pagination.next_cursor)
      setSubReplies({})
      if (data.post.parent_post_id) {
        void loadAncestors(data.post.parent_post_id)
      } else {
        setAncestors([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function loadMoreReplies() {
    if (!cursor) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({ cursor, limit: '20' })
      const res = await fetch(`/api/comunidade/veritas/${postId}?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar mais')
      const data = (await res.json()) as ThreadResponse
      setReplies(prev => {
        const seen = new Set(prev.map(r => r.id))
        return [...prev, ...data.replies.filter(r => !seen.has(r.id))]
      })
      setCursor(data.pagination.next_cursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleSubReplies(target: VeritasPost) {
    const existing = subReplies[target.id]
    // Já carregou e está aberto? Colapsa sem refetch.
    if (existing && existing.expanded) {
      setSubReplies(prev => ({
        ...prev,
        [target.id]: { ...existing, expanded: false },
      }))
      return
    }
    // Já carregou antes? Só reabre.
    if (existing && !existing.loading && existing.items.length > 0) {
      setSubReplies(prev => ({
        ...prev,
        [target.id]: { ...existing, expanded: true },
      }))
      return
    }
    // Primeira vez: fetch.
    setSubReplies(prev => ({
      ...prev,
      [target.id]: {
        items: existing?.items ?? [],
        cursor: null,
        loading: true,
        expanded: true,
      },
    }))
    try {
      const data = await fetchThread(target.id)
      setSubReplies(prev => ({
        ...prev,
        [target.id]: {
          items: data.replies,
          cursor: data.pagination.next_cursor,
          loading: false,
          expanded: true,
        },
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar respostas')
      setSubReplies(prev => ({
        ...prev,
        [target.id]: {
          items: existing?.items ?? [],
          cursor: null,
          loading: false,
          expanded: false,
        },
      }))
    }
  }

  function updatePostById(id: string, updater: (p: VeritasPost) => VeritasPost) {
    if (post && post.id === id) setPost(updater(post))
    setAncestors(prev => prev.map(p => p.id === id ? updater(p) : p))
    setReplies(prev => prev.map(p => p.id === id ? updater(p) : p))
    setSubReplies(prev => {
      const next: Record<string, SubReplyState> = {}
      for (const [parentId, state] of Object.entries(prev)) {
        next[parentId] = {
          ...state,
          items: state.items.map(p => p.id === id ? updater(p) : p),
        }
      }
      return next
    })
  }

  async function toggleLike(target: VeritasPost) {
    const willLike = !target.viewer.liked
    updatePostById(target.id, p => ({
      ...p,
      viewer: { ...p.viewer, liked: willLike },
      metrics: { ...p.metrics, like_count: Math.max(0, p.metrics.like_count + (willLike ? 1 : -1)) },
    }))
    const res = await fetch(`/api/comunidade/veritas/${target.id}/like`, {
      method: willLike ? 'POST' : 'DELETE',
    })
    if (!res.ok) {
      updatePostById(target.id, () => target)
      setError('Falha ao curtir')
    }
  }

  async function toggleRepost(target: VeritasPost) {
    const willRepost = !target.viewer.reposted
    updatePostById(target.id, p => ({
      ...p,
      viewer: { ...p.viewer, reposted: willRepost },
      metrics: { ...p.metrics, repost_count: Math.max(0, p.metrics.repost_count + (willRepost ? 1 : -1)) },
    }))
    const res = await fetch(`/api/comunidade/veritas/${target.id}/repost`, {
      method: willRepost ? 'POST' : 'DELETE',
    })
    if (!res.ok) {
      updatePostById(target.id, () => target)
      setError('Falha ao republicar')
    }
  }

  async function handleShareCross(target: VeritasPost) {
    const res = await fetch(`/api/comunidade/veritas/${target.id}/share-cross`, { method: 'POST' })
    if (!res.ok) return
    const data = (await res.json()) as { share: { title: string; text: string; url: string } }
    const absoluteUrl = new URL(data.share.url, window.location.origin).toString()
    await platformShare.text({ title: data.share.title, text: data.share.text, url: absoluteUrl })
    updatePostById(target.id, p => (
      p.viewer.shared_cross ? p : {
        ...p,
        viewer: { ...p.viewer, shared_cross: true },
        metrics: { ...p.metrics, share_cross_count: p.metrics.share_cross_count + 1 },
      }
    ))
  }

  async function handleReplySubmit() {
    const trimmed = replyBody.trim()
    if (!trimmed || !post) return
    setSubmittingReply(true)
    setError(null)
    try {
      const res = await fetch('/api/comunidade/veritas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'reply', body: trimmed, parent_post_id: post.id }),
      })
      if (!res.ok) throw new Error('Falha ao responder')
      const data = (await res.json()) as { post: VeritasPost }
      setReplies(prev => [...prev, data.post])
      setPost(p => p ? {
        ...p,
        metrics: { ...p.metrics, reply_count: p.metrics.reply_count + 1 },
      } : p)
      setReplyBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSubmittingReply(false)
    }
  }

  async function handleQuoteSubmit(body: string) {
    if (!quoteTarget) return
    const res = await fetch('/api/comunidade/veritas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'quote', body, parent_post_id: quoteTarget.id }),
    })
    if (!res.ok) throw new Error('Falha ao citar')
    updatePostById(quoteTarget.id, p => ({
      ...p,
      metrics: { ...p.metrics, quote_count: p.metrics.quote_count + 1 },
    }))
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
    updatePostById(target.id, () => data.post)
  }

  async function handleDelete(target: VeritasPost) {
    if (!confirm('Apagar este Veritas? Essa ação não pode ser desfeita.')) return
    const res = await fetch(`/api/comunidade/veritas/${target.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Falha ao apagar.')
      return
    }
    // Remove da lista de replies e de qualquer sub-reply cacheada.
    setReplies(prev => prev.filter(r => r.id !== target.id))
    setSubReplies(prev => {
      const next: Record<string, SubReplyState> = {}
      for (const [parentId, state] of Object.entries(prev)) {
        next[parentId] = {
          ...state,
          items: state.items.filter(r => r.id !== target.id),
        }
      }
      return next
    })
  }

  const viewerId = user?.id ?? null
  const remaining = VERITAS_MAX_BODY - replyBody.trim().length
  const canSubmitReply = replyBody.trim().length > 0 && remaining >= 0 && !submittingReply

  // Renderização recursiva de uma resposta com suas sub-respostas.
  function renderReplyNode(reply: VeritasPost, depth: number) {
    const subState = subReplies[reply.id]
    const expanded = subState?.expanded ?? false
    const childrenLoading = subState?.loading ?? false
    const replyCount = reply.metrics.reply_count

    // Só mostramos o toggle se existem respostas e ainda podemos aninhar mais.
    const canExpand = replyCount > 0 && depth < MAX_DEPTH
    const expandLabel = canExpand
      ? `Ver ${replyCount} ${replyCount === 1 ? 'resposta' : 'respostas'}`
      : null

    return (
      <div key={reply.id}>
        <VeritasCard
          post={reply}
          viewerUserId={viewerId}
          depth={depth}
          onLike={toggleLike}
          onRepost={toggleRepost}
          onQuote={setQuoteTarget}
          onShareCross={handleShareCross}
          onEditSubmit={handleEditSubmit}
          onDelete={handleDelete}
          onExpandReplies={canExpand ? () => toggleSubReplies(reply) : undefined}
          expandRepliesLabel={expandLabel}
          repliesExpanded={expanded}
          hideInlineReply
        />
        {expanded && (
          <>
            {childrenLoading && (
              <div
                className="flex items-center gap-2 py-3"
                style={{
                  paddingLeft: `${20 + (depth + 1) * 32}px`,
                  color: '#8A8378',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
              </div>
            )}
            {subState?.items.map(child => renderReplyNode(child, depth + 1))}
            {/* Profundidade máxima: oferece abrir thread completa do item. */}
            {depth + 1 >= MAX_DEPTH && subState?.items.some(c => c.metrics.reply_count > 0) && (
              <div
                style={{
                  paddingLeft: `${20 + (depth + 1) * 32}px`,
                  paddingTop: 4,
                  paddingBottom: 8,
                }}
              >
                <Link
                  href={`/comunidade/veritas/${reply.id}`}
                  className="text-[12px]"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Abrir thread completa →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    )
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

        {!loading && !post && !error && (
          <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
            Veritas não encontrado.
          </p>
        )}

        {!loading && post && (
          <>
            {ancestors.length > 0 && (
              <div className="mb-4" style={{ opacity: 0.8 }}>
                {ancestors.map(ancestor => (
                  <VeritasCard
                    key={ancestor.id}
                    post={ancestor}
                    viewerUserId={viewerId}
                    onLike={toggleLike}
                    onRepost={toggleRepost}
                    onQuote={setQuoteTarget}
                    onShareCross={handleShareCross}
                    hideInlineReply
                  />
                ))}
                <div
                  className="flex items-center gap-2 pl-5 py-2"
                  style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                >
                  <div
                    className="w-0.5 h-6"
                    style={{ background: 'rgba(201,168,76,0.2)' }}
                  />
                  <span className="text-xs">em resposta a</span>
                </div>
              </div>
            )}

            <div className="mb-6 -mx-4 md:-mx-8">
              <VeritasCard
                post={post}
                viewerUserId={viewerId}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onQuote={setQuoteTarget}
                onShareCross={handleShareCross}
                onEditSubmit={handleEditSubmit}
                onDelete={handleDelete}
                hideInlineReply
              />
            </div>

            <div
              className="rounded-2xl p-4 mb-6"
              style={{
                background: 'rgba(16,16,16,0.78)',
                border: '1px solid rgba(201,168,76,0.16)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" style={{ color: '#C9A84C' }} />
                <span
                  className="text-xs uppercase tracking-[0.12em]"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  Responder
                </span>
              </div>
              <div className="relative">
                <textarea
                  ref={replyInputRef}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value.slice(0, VERITAS_MAX_BODY + 50))}
                  placeholder="Escreva sua resposta... @menção, **negrito**, *itálico*."
                  className="w-full min-h-20 resize-y rounded-xl p-3 text-sm"
                  style={{
                    background: 'rgba(10,10,10,0.65)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                  }}
                />
                <MentionAutocomplete
                  inputRef={replyInputRef}
                  value={replyBody}
                  onInsert={(next) => setReplyBody(next.slice(0, VERITAS_MAX_BODY + 50))}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <FormattingToolbar
                  inputRef={replyInputRef}
                  value={replyBody}
                  onChange={setReplyBody}
                  maxLength={VERITAS_MAX_BODY + 50}
                />
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{
                      color: remaining < 0 ? '#D94F5C' : '#7A7368',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {replyBody.trim().length}/{VERITAS_MAX_BODY}
                  </span>
                  <button
                    type="button"
                    onClick={handleReplySubmit}
                    disabled={!canSubmitReply}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em] disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                      color: '#0A0A0A',
                      fontFamily: 'Cinzel, serif',
                    }}
                  >
                    {submittingReply && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Responder
                  </button>
                </div>
              </div>
            </div>

            {replies.length > 0 && (
              <h2
                className="text-sm mb-3 uppercase tracking-[0.12em]"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                Respostas ({post.metrics.reply_count})
              </h2>
            )}

            <div className="-mx-4 md:-mx-8">
              {replies.map(reply => renderReplyNode(reply, 0))}

              {cursor && (
                <div className="flex justify-center pt-4 px-4 md:px-8">
                  <button
                    type="button"
                    onClick={loadMoreReplies}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
                    style={{
                      background: 'rgba(16,16,16,0.65)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      color: '#C9A84C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Carregar mais respostas
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <QuoteModal
        post={quoteTarget}
        open={quoteTarget !== null}
        onClose={() => setQuoteTarget(null)}
        onSubmit={handleQuoteSubmit}
      />
    </main>
  )
}
