'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Heart,
  Repeat2,
  MessageCircle,
  UserPlus,
  UserMinus,
  Quote,
  Bell,
  BellOff,
  BookOpenText,
  MoreHorizontal,
  Trash2,
  Pencil,
  Send,
} from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import type { VeritasPost } from '@/lib/community/types'
import { renderVeritasBody } from '@/lib/community/body-renderer'
import { VERITAS_MAX_BODY } from '@/lib/community/constants'
import RoleBadge from '@/components/comunidade/RoleBadge'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'
import MediaLightbox from '@/components/comunidade/MediaLightbox'
import FormattingToolbar from '@/components/comunidade/FormattingToolbar'
import ShareImageModal from '@/components/comunidade/ShareImageModal'
import { useHaptic } from '@/hooks/useHaptic'

export interface VeritasCardCallbacks {
  onLike?: (post: VeritasPost) => void
  onRepost?: (post: VeritasPost) => void
  onQuote?: (post: VeritasPost) => void
  onShareCross?: (post: VeritasPost) => void
  onToggleFollow?: (authorId: string, follows: boolean) => void
  onToggleMute?: (authorId: string, muted: boolean) => void
  onReplySubmit?: (post: VeritasPost, body: string) => Promise<void> | void
  onDelete?: (post: VeritasPost) => Promise<void> | void
  /** Edita o post — promise resolve após API ok, rejeita com mensagem de erro. */
  onEditSubmit?: (post: VeritasPost, body: string) => Promise<void>
  /** Callback para quando o usuário pede pra ver as respostas desta reply. */
  onExpandReplies?: (post: VeritasPost) => void
}

interface Props extends VeritasCardCallbacks {
  post: VeritasPost
  viewerUserId?: string | null
  replyDraft?: string
  onReplyDraftChange?: (value: string) => void
  // Quando true, esconde a barra inline de resposta (útil na página da thread
  // onde a resposta fica num composer dedicado acima).
  hideInlineReply?: boolean
  /**
   * Nível de indentação (0 = raiz no feed/thread, 1+ = resposta aninhada).
   * Usado pelo ThreadView pra desenhar a linha conectora à esquerda.
   */
  depth?: number
  /**
   * Label opcional embaixo da barra de ações (ex: "Ver 3 respostas"). Renderizado
   * apenas quando `onExpandReplies` está presente e depth < 2.
   */
  expandRepliesLabel?: string | null
  /** Estado controlado da expansão das sub-respostas. */
  repliesExpanded?: boolean
}

const TEXT_PRIMARY = '#F2EDE4'
const TEXT_MUTED = '#8A8378'
const TEXT_SUBTLE = '#7A7368'
const GOLD = '#C9A84C'
const HAIRLINE = 'rgba(242,237,228,0.08)'
const LIKE_COLOR = '#D94F5C'
const REPOST_COLOR = '#66BB6A'

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

interface ActionIconProps {
  onClick: () => void
  active?: boolean
  activeColor?: string
  count: number
  label: string
  fillWhenActive?: boolean
  children: React.ReactNode
}

function ActionIcon({
  onClick,
  active,
  activeColor = TEXT_MUTED,
  count,
  label,
  fillWhenActive = false,
  children,
}: ActionIconProps) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      transition={{ duration: 0.12 }}
      className="inline-flex items-center gap-1.5 px-1 py-1 -mx-1 rounded-md"
      style={{
        color: active ? activeColor : TEXT_MUTED,
        background: 'transparent',
        border: 'none',
        fontFamily: 'Poppins, sans-serif',
        minHeight: 44,
      }}
      data-active={active ? 'true' : 'false'}
      data-fill={active && fillWhenActive ? 'true' : 'false'}
    >
      {children}
      {count > 0 && (
        <span className="text-[13px] tabular-nums" style={{ color: active ? activeColor : TEXT_MUTED }}>
          {count}
        </span>
      )}
    </motion.button>
  )
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
  onEditSubmit,
  onExpandReplies,
  hideInlineReply = false,
  depth = 0,
  expandRepliesLabel = null,
  repliesExpanded = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(post.body)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const editInputRef = useRef<HTMLTextAreaElement | null>(null)
  const { pulse } = useHaptic()

  useEffect(() => {
    if (editing) {
      setEditBody(post.body)
      setEditError(null)
      // Foco no textarea quando entra em modo edição.
      requestAnimationFrame(() => {
        const el = editInputRef.current
        if (!el) return
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      })
    }
  }, [editing, post.body])

  async function handleSaveEdit() {
    if (!onEditSubmit) return
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === post.body.trim() || trimmed.length > VERITAS_MAX_BODY) return
    setEditSaving(true)
    setEditError(null)
    try {
      await onEditSubmit(post, trimmed)
      setEditing(false)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Falha ao salvar.')
    } finally {
      setEditSaving(false)
    }
  }

  function cancelEdit() {
    setEditing(false)
    setEditBody(post.body)
    setEditError(null)
  }

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
  const handleLabel = post.author.public_handle
    ? `@${post.author.public_handle}`
    : '#sem-handle'

  const hasMenu =
    (isOwnPost && (onEditSubmit || onDelete)) ||
    (!isOwnPost && (onToggleFollow || onToggleMute))

  // Indentação visual para sub-respostas: empurra o conteúdo e desenha
  // uma linha conectora dourada à esquerda, alinhada com o avatar do pai.
  const indentPx = depth > 0 ? Math.min(depth, 2) * 32 : 0

  return (
    <article
      className="relative veritas-item"
      style={{
        padding: '16px 20px',
        paddingLeft: `${20 + indentPx}px`,
        borderBottom: `0.5px solid ${HAIRLINE}`,
        background: isReflection
          ? 'linear-gradient(180deg, rgba(201,168,76,0.05) 0%, rgba(15,14,12,0) 55%)'
          : 'transparent',
        borderLeft: isReflection ? `2px solid ${GOLD}` : undefined,
        contentVisibility: 'auto',
        containIntrinsicSize: '260px',
      }}
    >
      {/* Linha conectora (thread) para sub-respostas — discreta, dourada. */}
      {depth > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${20 + (depth - 1) * 32 + 18}px`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'linear-gradient(180deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.08) 100%)',
          }}
        />
      )}

      {/* Marca d'água sutil de cruz no Reflexão — reforça identidade sem ruído. */}
      {isReflection && (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            right: 18,
            top: 14,
            width: 56,
            height: 56,
            opacity: 0.05,
            color: '#C9A84C',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M10 2h4v7h7v4h-7v9h-4v-9H3v-4h7V2z"
            fill="currentColor"
          />
        </svg>
      )}

      {isReflection && (
        <div
          className="inline-flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.14em]"
          style={{
            color: '#E9C46A',
            fontFamily: 'Cinzel, serif',
          }}
        >
          <BookOpenText className="w-3 h-3" strokeWidth={1.5} />
          Reflexão
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link
          href={profileHref}
          className="flex-shrink-0 relative rounded-full overflow-hidden"
          style={{
            width: 36,
            height: 36,
            background: post.author.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.10)',
            boxShadow: post.author.verified ? `0 0 0 1.5px rgba(233,196,106,0.55)` : undefined,
          }}
        >
          {post.author.profile_image_url ? (
            <Image
              src={post.author.profile_image_url}
              alt={post.author.name ?? 'Perfil'}
              width={36}
              height={36}
              sizes="36px"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full">
              <CrossIcon size="sm" />
            </span>
          )}
        </Link>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header linha 1: nome, badges, timestamp, menu */}
          <div className="flex items-center gap-1.5 min-w-0">
            {profileHref !== '#' ? (
              <Link
                href={profileHref}
                className="text-[15px] font-medium hover:underline truncate"
                style={{ color: TEXT_PRIMARY, fontFamily: 'Poppins, sans-serif' }}
              >
                {post.author.name ?? 'Membro Veritas'}
              </Link>
            ) : (
              <span
                className="text-[15px] font-medium truncate"
                style={{ color: TEXT_PRIMARY, fontFamily: 'Poppins, sans-serif' }}
              >
                {post.author.name ?? 'Membro Veritas'}
              </span>
            )}
            {post.author.verified && <VerifiedBadge size={14} />}
            <RoleBadge role={post.author.community_role} size="sm" />
            <span
              className="text-[13px] flex-shrink-0"
              style={{ color: TEXT_SUBTLE, fontFamily: 'Poppins, sans-serif' }}
            >
              · {formatRelative(post.created_at)}
            </span>

            {hasMenu && (
              <div ref={menuRef} className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setMenuOpen(o => !o)}
                  aria-label="Mais opções"
                  className="p-1.5 rounded-full"
                  style={{
                    color: TEXT_MUTED,
                    background: menuOpen ? 'rgba(201,168,76,0.08)' : 'transparent',
                  }}
                >
                  <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-1 w-48 rounded-xl overflow-hidden z-20"
                    style={{
                      background: 'rgba(20,18,14,0.98)',
                      border: '1px solid rgba(201,168,76,0.22)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
                    }}
                  >
                    {!isOwnPost && onToggleFollow && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          onToggleFollow(post.author_user_id, post.viewer.follows_author)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-left hover:bg-[rgba(201,168,76,0.08)]"
                        style={{
                          color: post.viewer.follows_author ? TEXT_MUTED : GOLD,
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        {post.viewer.follows_author
                          ? <UserMinus className="w-4 h-4" strokeWidth={1.5} />
                          : <UserPlus className="w-4 h-4" strokeWidth={1.5} />
                        }
                        {post.viewer.follows_author ? 'Deixar de seguir' : 'Seguir'}
                      </button>
                    )}
                    {!isOwnPost && onToggleMute && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          onToggleMute(post.author_user_id, post.viewer.muted_author)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-left hover:bg-[rgba(201,168,76,0.08)]"
                        style={{
                          color: post.viewer.muted_author ? '#B6B9C4' : TEXT_MUTED,
                          fontFamily: 'Poppins, sans-serif',
                          borderTop: onToggleFollow ? '1px solid rgba(201,168,76,0.08)' : undefined,
                        }}
                      >
                        {post.viewer.muted_author
                          ? <Bell className="w-4 h-4" strokeWidth={1.5} />
                          : <BellOff className="w-4 h-4" strokeWidth={1.5} />
                        }
                        {post.viewer.muted_author ? 'Reativar notificações' : 'Silenciar'}
                      </button>
                    )}
                    {isOwnPost && onEditSubmit && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setEditing(true) }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-left hover:bg-[rgba(201,168,76,0.08)]"
                        style={{ color: TEXT_PRIMARY, fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.5} /> Editar
                      </button>
                    )}
                    {isOwnPost && onDelete && (
                      <button
                        type="button"
                        onClick={async () => {
                          setMenuOpen(false)
                          if (confirm('Apagar este Veritas? Essa ação não pode ser desfeita.')) {
                            await onDelete(post)
                          }
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-left hover:bg-[rgba(217,79,92,0.08)]"
                        style={{
                          color: LIKE_COLOR,
                          fontFamily: 'Poppins, sans-serif',
                          borderTop: onEditSubmit ? '1px solid rgba(201,168,76,0.08)' : undefined,
                        }}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} /> Apagar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Handle secundário */}
          <p
            className="text-[13px] truncate -mt-0.5"
            style={{ color: TEXT_SUBTLE, fontFamily: 'Poppins, sans-serif' }}
          >
            {handleLabel}
          </p>

          {/* Corpo — modo visualização ou edição inline */}
          {editing ? (
            <div className="mt-2">
              <textarea
                ref={editInputRef}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value.slice(0, VERITAS_MAX_BODY + 50))}
                className="w-full min-h-24 resize-y rounded-xl p-3 text-[15px] leading-[22px]"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: TEXT_PRIMARY,
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    void handleSaveEdit()
                  }
                }}
              />
              <div className="mt-2 flex items-center justify-between">
                <FormattingToolbar
                  inputRef={editInputRef}
                  value={editBody}
                  onChange={setEditBody}
                  maxLength={VERITAS_MAX_BODY + 50}
                />
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] tabular-nums"
                    style={{
                      color: editBody.trim().length > VERITAS_MAX_BODY ? LIKE_COLOR : TEXT_SUBTLE,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {editBody.trim().length}/{VERITAS_MAX_BODY}
                  </span>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{
                      color: TEXT_MUTED,
                      background: 'transparent',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={
                      editSaving ||
                      editBody.trim().length === 0 ||
                      editBody.trim() === post.body.trim() ||
                      editBody.trim().length > VERITAS_MAX_BODY
                    }
                    className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-[0.12em] disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                      color: '#0A0A0A',
                      fontFamily: 'Cinzel, serif',
                    }}
                  >
                    {editSaving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
              {editError && (
                <p
                  className="mt-2 text-[12px]"
                  style={{ color: LIKE_COLOR, fontFamily: 'Poppins, sans-serif' }}
                >
                  {editError}
                </p>
              )}
            </div>
          ) : (
            <Link
              href={`/comunidade/veritas/${post.id}`}
              className="block mt-1.5"
              style={{ color: TEXT_PRIMARY, fontFamily: 'Poppins, sans-serif' }}
            >
              <p className="text-[15px] leading-[22px] whitespace-pre-line">
                {renderVeritasBody(post.body)}
              </p>
              {post.edited_at && (
                <span
                  className="inline-block mt-1 text-[11px]"
                  style={{ color: TEXT_SUBTLE }}
                  title={new Date(post.edited_at).toLocaleString('pt-BR')}
                >
                  editado {formatRelative(post.edited_at)}
                </span>
              )}
            </Link>
          )}

          {/* Quoted/reposted parent — nested compacto */}
          {post.parent && (post.kind === 'quote' || post.kind === 'repost') && (
            <Link
              href={`/comunidade/veritas/${post.parent.id}`}
              className="block mt-3 rounded-xl p-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{
                border: '1px solid rgba(242,237,228,0.10)',
              }}
            >
              <div
                className="flex items-center gap-2 mb-1 text-[13px]"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 20,
                    height: 20,
                    background: post.parent.author.profile_image_url
                      ? 'transparent'
                      : 'rgba(201,168,76,0.10)',
                  }}
                >
                  {post.parent.author.profile_image_url ? (
                    <Image
                      src={post.parent.author.profile_image_url}
                      alt=""
                      width={20}
                      height={20}
                      sizes="20px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CrossIcon size="xs" />
                  )}
                </div>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>
                  {post.parent.author.name ?? 'Membro'}
                </span>
                {post.parent.author.verified && <VerifiedBadge size={12} />}
                <span style={{ color: TEXT_SUBTLE }}>
                  {post.parent.author.public_handle ? `@${post.parent.author.public_handle}` : '#sem-handle'}
                  {' · '}{formatRelative(post.parent.created_at)}
                </span>
              </div>
              <p
                className="text-[14px] leading-[20px] whitespace-pre-line line-clamp-6"
                style={{ color: '#B8B0A2', fontFamily: 'Poppins, sans-serif' }}
              >
                {renderVeritasBody(post.parent.body)}
              </p>
              {post.parent.media.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {post.parent.media.slice(0, 2).map(media => (
                    <div
                      key={media.id}
                      className="rounded-lg overflow-hidden"
                      style={{ aspectRatio: '16 / 10', position: 'relative' }}
                    >
                      <Image
                        src={media.variants.thumb}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 40vw, 220px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Link>
          )}

          {/* Mídia principal */}
          {post.media.length > 0 && (
            <div
              className={`mt-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
            >
              {post.media.map((media, idx) => (
                <button
                  key={media.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setLightboxIndex(idx)
                  }}
                  className="rounded-xl overflow-hidden block relative"
                  style={{
                    aspectRatio: post.media.length === 1 ? '4 / 3' : '1 / 1',
                    border: '1px solid rgba(242,237,228,0.06)',
                  }}
                  aria-label="Abrir mídia"
                >
                  <Image
                    src={media.variants.feed}
                    alt="Mídia do Veritas"
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
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

          <ShareImageModal
            post={shareOpen ? post : null}
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            onAction={(target) => {
              // Dispara a métrica existente de share-cross uma única vez.
              if (!target.viewer.shared_cross && onShareCross) {
                onShareCross(target)
              }
            }}
          />

          {/* Barra de ações */}
          <div className="mt-3 flex items-center gap-6 -ml-1">
            {onReplySubmit && post.metrics.reply_count >= 0 && (
              <Link
                href={`/comunidade/veritas/${post.id}`}
                className="inline-flex items-center gap-1.5 text-[13px]"
                style={{ color: TEXT_MUTED, fontFamily: 'Poppins, sans-serif', minHeight: 44 }}
                aria-label="Responder"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                {post.metrics.reply_count > 0 && (
                  <span className="tabular-nums">{post.metrics.reply_count}</span>
                )}
              </Link>
            )}

            {onRepost && (
              <ActionIcon
                onClick={() => { pulse('light'); onRepost(post) }}
                active={post.viewer.reposted}
                activeColor={REPOST_COLOR}
                count={post.metrics.repost_count}
                label="Repostar"
              >
                <Repeat2
                  className="w-5 h-5"
                  strokeWidth={post.viewer.reposted ? 2 : 1.5}
                />
              </ActionIcon>
            )}

            {onLike && (
              <ActionIcon
                onClick={() => { pulse('light'); onLike(post) }}
                active={post.viewer.liked}
                activeColor={LIKE_COLOR}
                count={post.metrics.like_count}
                label="Curtir"
                fillWhenActive
              >
                <Heart
                  className="w-5 h-5"
                  strokeWidth={1.5}
                  fill={post.viewer.liked ? LIKE_COLOR : 'none'}
                />
              </ActionIcon>
            )}

            {onQuote && (
              <ActionIcon
                onClick={() => onQuote(post)}
                count={post.metrics.quote_count}
                label="Citar"
              >
                <Quote className="w-5 h-5" strokeWidth={1.5} />
              </ActionIcon>
            )}

            {onShareCross && (
              <ActionIcon
                onClick={() => setShareOpen(true)}
                active={post.viewer.shared_cross}
                activeColor={GOLD}
                count={post.metrics.share_cross_count}
                label="Compartilhar"
              >
                <Send className="w-5 h-5" strokeWidth={1.5} />
              </ActionIcon>
            )}
          </div>

          {/* Toggle "Ver N respostas" — renderizado só pelo ThreadView. */}
          {onExpandReplies && expandRepliesLabel && (
            <button
              type="button"
              onClick={() => onExpandReplies(post)}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px]"
              style={{
                color: GOLD,
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
                border: 'none',
                padding: 0,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 24,
                  height: 1,
                  background: 'rgba(201,168,76,0.35)',
                }}
              />
              {repliesExpanded ? 'Ocultar respostas' : expandRepliesLabel}
            </button>
          )}

          {/* Resposta inline (feed apenas) */}
          {!hideInlineReply && onReplySubmit && onReplyDraftChange && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={replyDraft}
                onChange={(e) => onReplyDraftChange(e.target.value)}
                placeholder="Responder..."
                className="flex-1 bg-transparent text-[14px] py-2"
                style={{
                  color: TEXT_PRIMARY,
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                  borderBottom: `1px solid ${HAIRLINE}`,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && replyDraft.trim()) {
                    e.preventDefault()
                    void onReplySubmit(post, replyDraft.trim())
                  }
                }}
              />
              {replyDraft.trim() && (
                <button
                  type="button"
                  onClick={() => onReplySubmit(post, replyDraft.trim())}
                  className="p-2 rounded-full"
                  aria-label="Enviar resposta"
                  style={{ color: GOLD }}
                >
                  <Send className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
