/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import {
  Heart,
  Repeat2,
  MessageSquare,
  UserPlus,
  UserMinus,
  Quote,
  Bell,
  BellOff,
  BookOpenText,
  MoreHorizontal,
  Trash2,
  Pencil,
} from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import type { VeritasPost } from '@/lib/community/types'
import { renderVeritasBody } from '@/lib/community/body-renderer'
import RoleBadge from '@/components/comunidade/RoleBadge'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'
import MediaLightbox from '@/components/comunidade/MediaLightbox'

export interface VeritasCardCallbacks {
  onLike?: (post: VeritasPost) => void
  onRepost?: (post: VeritasPost) => void
  onQuote?: (post: VeritasPost) => void
  onShareCross?: (post: VeritasPost) => void
  onToggleFollow?: (authorId: string, follows: boolean) => void
  onToggleMute?: (authorId: string, muted: boolean) => void
  onReplySubmit?: (post: VeritasPost, body: string) => Promise<void> | void
  onDelete?: (post: VeritasPost) => Promise<void> | void
  onEdit?: (post: VeritasPost) => void
}

interface Props extends VeritasCardCallbacks {
  post: VeritasPost
  viewerUserId?: string | null
  replyDraft?: string
  onReplyDraftChange?: (value: string) => void
  // Quando true, esconde a barra inline de resposta (útil na página da thread
  // onde a resposta fica num composer dedicado acima).
  hideInlineReply?: boolean
}

function formatRelative(dateIso: string): string {
  const now = Date.now()
  const ts = new Date(dateIso).getTime()
  const diffMin = Math.max(1, Math.floor((now - ts) / 60000))
  if (diffMin < 60) return `${diffMin}m`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}d`
}

export default function VeritasCard({
  post,
  viewerUserId,
  replyDraft = '',
  onReplyDraftChange,
  onLike,
  onRepost,
  onQuote,
  onShareCross,
  onToggleFollow,
  onToggleMute,
  onReplySubmit,
  onDelete,
  onEdit,
  hideInlineReply = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])
  const profileHref = post.author.public_handle
    ? `/comunidade/@${post.author.public_handle}`
    : post.author.user_number
      ? `/comunidade/p/${post.author.user_number}`
      : '#'

  const isOwnPost = viewerUserId === post.author_user_id
  const isReflection = post.variant === 'reflection'

  return (
    <article
      className="rounded-2xl p-5 transition-colors hover:bg-[rgba(20,20,20,0.85)] relative"
      style={{
        background: isReflection
          ? 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, rgba(16,16,16,0.78) 35%)'
          : 'rgba(16,16,16,0.75)',
        border: isReflection
          ? '1px solid rgba(233,196,106,0.32)'
          : '1px solid rgba(201,168,76,0.14)',
        boxShadow: isReflection ? '0 0 0 1px rgba(201,168,76,0.08) inset' : undefined,
      }}
    >
      {isReflection && (
        <div
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] mb-3"
          style={{
            background: 'rgba(233,196,106,0.14)',
            border: '1px solid rgba(233,196,106,0.5)',
            color: '#E9C46A',
            fontFamily: 'Cinzel, serif',
          }}
        >
          <BookOpenText className="w-3 h-3" />
          Reflexão
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <Link
          href={profileHref}
          className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            background: post.author.profile_image_url
              ? 'transparent'
              : 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: post.author.verified
              ? '0 0 0 1.5px rgba(233,196,106,0.5)'
              : undefined,
          }}
        >
          {post.author.profile_image_url ? (
            <img
              src={post.author.profile_image_url}
              alt={post.author.name ?? 'Perfil'}
              className="w-full h-full object-cover"
            />
          ) : (
            <CrossIcon size="sm" />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {profileHref !== '#' ? (
              <Link
                href={profileHref}
                className="text-sm font-medium hover:underline"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                {post.author.name ?? 'Membro Veritas'}
              </Link>
            ) : (
              <span className="text-sm font-medium" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                {post.author.name ?? 'Membro Veritas'}
              </span>
            )}
            {post.author.verified && <VerifiedBadge size={14} />}
            <RoleBadge role={post.author.community_role} size="sm" />
          </div>
          <p className="text-xs" style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
            {post.author.public_handle ? `@${post.author.public_handle}` : '#sem-handle'} · {formatRelative(post.created_at)}
          </p>
        </div>

        {!isOwnPost && (onToggleFollow || onToggleMute) && (
          <div className="flex items-center gap-1.5">
            {onToggleFollow && (
              <button
                type="button"
                onClick={() => onToggleFollow(post.author_user_id, post.viewer.follows_author)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]"
                style={{
                  background: 'rgba(16,16,16,0.6)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: post.viewer.follows_author ? '#8A8378' : '#C9A84C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {post.viewer.follows_author ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {post.viewer.follows_author ? 'Seguindo' : 'Seguir'}
              </button>
            )}

            {onToggleMute && (
              <button
                type="button"
                onClick={() => onToggleMute(post.author_user_id, post.viewer.muted_author)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]"
                style={{
                  background: post.viewer.muted_author ? 'rgba(107,114,128,0.2)' : 'rgba(16,16,16,0.6)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: post.viewer.muted_author ? '#B6B9C4' : '#8A8378',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {post.viewer.muted_author ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                {post.viewer.muted_author ? 'Silenciado' : 'Silenciar'}
              </button>
            )}
          </div>
        )}

        {isOwnPost && (onEdit || onDelete) && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Mais opções"
              className="p-1.5 rounded-lg"
              style={{
                color: '#8A8378',
                background: menuOpen ? 'rgba(201,168,76,0.10)' : 'transparent',
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl overflow-hidden z-20"
                style={{
                  background: 'rgba(16,16,16,0.96)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                }}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit(post) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left"
                    style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false)
                      if (confirm('Apagar este Veritas? Essa ação não pode ser desfeita.')) {
                        await onDelete(post)
                      }
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left"
                    style={{
                      color: '#D94F5C',
                      fontFamily: 'Poppins, sans-serif',
                      borderTop: onEdit ? '1px solid rgba(201,168,76,0.08)' : undefined,
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Apagar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        href={`/comunidade/veritas/${post.id}`}
        className="block"
        style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
      >
        <p className="text-sm whitespace-pre-line leading-relaxed">
          {renderVeritasBody(post.body)}
        </p>
        {post.edited_at && (
          <span
            className="inline-block mt-1 text-[10px]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            title={new Date(post.edited_at).toLocaleString('pt-BR')}
          >
            editado {formatRelative(post.edited_at)}
          </span>
        )}
      </Link>

      {post.parent && (post.kind === 'quote' || post.kind === 'repost') && (
        <Link
          href={`/comunidade/veritas/${post.parent.id}`}
          className="block mt-3 rounded-xl p-3 transition-colors hover:bg-[rgba(10,10,10,0.8)]"
          style={{
            background: 'rgba(10,10,10,0.55)',
            border: '1px solid rgba(201,168,76,0.14)',
          }}
        >
          <div
            className="flex items-center gap-2 mb-1.5 text-xs"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <div
              className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                background: post.parent.author.profile_image_url
                  ? 'transparent'
                  : 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              {post.parent.author.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.parent.author.profile_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <CrossIcon size="xs" />
              )}
            </div>
            <span style={{ color: '#F2EDE4', fontWeight: 500 }}>
              {post.parent.author.name ?? 'Membro'}
            </span>
            {post.parent.author.verified && <VerifiedBadge size={12} />}
            <span style={{ color: '#7A7368' }}>
              {post.parent.author.public_handle
                ? `@${post.parent.author.public_handle}`
                : '#sem-handle'}
              {' · '}{formatRelative(post.parent.created_at)}
            </span>
          </div>
          <p
            className="text-sm whitespace-pre-line leading-relaxed line-clamp-6"
            style={{ color: '#B8B0A2', fontFamily: 'Poppins, sans-serif' }}
          >
            {renderVeritasBody(post.parent.body)}
          </p>
          {post.parent.media.length > 0 && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {post.parent.media.slice(0, 2).map(media => (
                <div
                  key={media.id}
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(201,168,76,0.12)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.variants.feed}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-32 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </Link>
      )}

      {post.media.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {post.media.map((media, idx) => (
            <button
              key={media.id}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setLightboxIndex(idx)
              }}
              className="rounded-xl overflow-hidden block"
              style={{ border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <img
                src={media.variants.feed}
                alt="Mídia do Veritas"
                loading="lazy"
                decoding="async"
                className="w-full h-56 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          items={post.media}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {onLike && (
          <button
            type="button"
            onClick={() => onLike(post)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-transform active:scale-95"
            style={{
              background: post.viewer.liked ? 'rgba(217,79,92,0.14)' : 'rgba(16,16,16,0.6)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: post.viewer.liked ? '#D94F5C' : '#8A8378',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Heart className="w-3.5 h-3.5" fill={post.viewer.liked ? '#D94F5C' : 'none'} /> {post.metrics.like_count}
          </button>
        )}

        {onRepost && (
          <button
            type="button"
            onClick={() => onRepost(post)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-transform active:scale-95"
            style={{
              background: post.viewer.reposted ? 'rgba(102,187,106,0.14)' : 'rgba(16,16,16,0.6)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: post.viewer.reposted ? '#66BB6A' : '#8A8378',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Repeat2 className="w-3.5 h-3.5" /> {post.metrics.repost_count}
          </button>
        )}

        {onQuote && (
          <button
            type="button"
            onClick={() => onQuote(post)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: 'rgba(16,16,16,0.6)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#8A8378',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Quote className="w-3.5 h-3.5" /> {post.metrics.quote_count}
          </button>
        )}

        {onShareCross && (
          <button
            type="button"
            onClick={() => onShareCross(post)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: post.viewer.shared_cross ? 'rgba(201,168,76,0.14)' : 'rgba(16,16,16,0.6)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <CrossIcon size="xs" /> {post.metrics.share_cross_count}
          </button>
        )}
      </div>

      {post.metrics.reply_count > 0 && (
        <div className="mt-3">
          <Link
            href={`/comunidade/veritas/${post.id}`}
            className="inline-flex items-center gap-1.5 text-xs hover:underline"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ver {post.metrics.reply_count} {post.metrics.reply_count === 1 ? 'resposta' : 'respostas'}
          </Link>
        </div>
      )}

      {!hideInlineReply && onReplySubmit && onReplyDraftChange && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" style={{ color: '#8A8378' }} />
            <input
              type="text"
              value={replyDraft}
              onChange={(e) => onReplyDraftChange(e.target.value)}
              placeholder="Responder..."
              className="flex-1 px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'rgba(10,10,10,0.65)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && replyDraft.trim()) {
                  e.preventDefault()
                  void onReplySubmit(post, replyDraft.trim())
                }
              }}
            />
            <button
              type="button"
              onClick={() => replyDraft.trim() && onReplySubmit(post, replyDraft.trim())}
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'rgba(201,168,76,0.14)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Responder
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
