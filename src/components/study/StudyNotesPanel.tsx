'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Send,
  Trash2,
  Check,
  Lock,
  Globe,
  Users,
  MessageCircle,
  Pencil,
  ChevronDown,
} from 'lucide-react'
import {
  useStudyNotes,
  type StudyNote,
  type NoteVisibility,
  type StudyNoteAuthor,
} from '@/lib/study/useStudyNotes'
import { useMyStudyGroups } from '@/lib/study/useStudyGroups'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  contentType: string
  contentRef: string
  contentTitle: string
}

const VISIBILITY_META: Record<NoteVisibility, { label: string; Icon: typeof Lock; color: string }> = {
  private: { label: 'Privada', Icon: Lock, color: '#938B80' },
  group: { label: 'Grupo', Icon: Users, color: '#C9A84C' },
  public: { label: 'Pública', Icon: Globe, color: '#8BB58B' },
}

export default function StudyNotesPanel({
  open,
  onClose,
  contentType,
  contentRef,
  contentTitle,
}: Props) {
  const { user } = useAuth()
  const { notes, loading, saving, create, update, remove, setVisibility } = useStudyNotes(
    open ? contentType : null,
    open ? contentRef : null,
  )
  const { groups } = useMyStudyGroups()

  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const [draft, setDraft] = useState('')
  const [draftVisibility, setDraftVisibility] = useState<NoteVisibility>('private')
  const [draftGroupId, setDraftGroupId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft('')
       
      setEditing(null)
       
      setReplyTo(null)
       
      setReplyBody('')
    }
  }, [open])

  // Escape fecha o modal + lock scroll enquanto aberto.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const firstGroupId = groups[0]?.id ?? null
  useEffect(() => {
    if (draftVisibility === 'group' && !draftGroupId && firstGroupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftGroupId(firstGroupId)
    }
  }, [draftVisibility, draftGroupId, firstGroupId])

  if (!open || !mounted) return null

  async function handleCreate() {
    if (!draft.trim()) return
    const ok = await create({
      body: draft,
      visibility: draftVisibility,
      groupId: draftVisibility === 'group' ? draftGroupId : null,
    })
    if (ok) {
      setDraft('')
    }
  }

  async function handleSaveEdit() {
    if (!editing || !editing.body.trim()) return
    await update(editing.id, editing.body)
    setEditing(null)
  }

  async function handleSendReply() {
    if (!replyTo || !replyBody.trim()) return
    const parent = notes.find((n) => n.id === replyTo)
    if (!parent) return
    const ok = await create({
      body: replyBody,
      visibility: parent.visibility,
      groupId: parent.group_id,
      parentNoteId: parent.id,
    })
    if (ok) {
      setReplyTo(null)
      setReplyBody('')
    }
  }

  const canUseGroup = groups.length > 0

  const overlay = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Anotações e discussão"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className="relative w-full sm:max-w-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
          borderRadius: 'clamp(0px, 2vw, 20px)',
          height: '100dvh',
          maxHeight: 'min(720px, 100dvh)',
        }}
      >
        <header
          className="flex items-start justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-1)' }}
        >
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Discussão
            </div>
            <p
              className="text-sm mt-1 line-clamp-1"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              {contentTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-2)' }} />
          </button>
        </header>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
            <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              Entre na sua conta para salvar anotações e participar da discussão.
            </p>
          </div>
        ) : (
          <>
            {/* Lista de anotações */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
              {loading ? (
                <p
                  className="text-center text-sm py-8"
                  style={{ color: 'var(--text-3)' }}
                >
                  Carregando anotações...
                </p>
              ) : notes.length === 0 ? (
                <p
                  className="text-center text-sm py-12"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  Nenhuma anotação ainda. Seja o primeiro a compartilhar uma reflexão —
                  privada só pra você ou pública pra comunidade.
                </p>
              ) : (
                notes.map((note) => (
                  <NoteThread
                    key={note.id}
                    note={note}
                    currentUserId={user.id}
                    editing={editing?.id === note.id ? editing : null}
                    onStartEdit={(n) => setEditing({ id: n.id, body: n.body })}
                    onChangeEdit={(body) =>
                      setEditing(editing ? { ...editing, body } : null)
                    }
                    onCancelEdit={() => setEditing(null)}
                    onSaveEdit={handleSaveEdit}
                    onDelete={(id) => remove(id)}
                    onReply={(id) => {
                      setReplyTo(id)
                      setReplyBody('')
                    }}
                    replyOpenFor={replyTo}
                    replyBody={replyBody}
                    onChangeReply={setReplyBody}
                    onCancelReply={() => {
                      setReplyTo(null)
                      setReplyBody('')
                    }}
                    onSendReply={handleSendReply}
                    onChangeVisibility={(id, v, groupId) =>
                      setVisibility(id, v, groupId)
                    }
                    availableGroups={groups.map((g) => ({ id: g.id, name: g.name }))}
                    saving={saving}
                  />
                ))
              )}
            </div>

            {/* Compose box — sticky bottom */}
            <div
              className="px-4 sm:px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] flex-shrink-0"
              style={{
                background: 'var(--surface-2)',
                borderTop: '1px solid var(--border-1)',
              }}
            >
              <div
                className="rounded-xl p-3"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-1)',
                }}
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva sua reflexão, pergunta ou aplicação..."
                  rows={2}
                  maxLength={10000}
                  className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
                  style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                  <VisibilitySelector
                    value={draftVisibility}
                    onChange={setDraftVisibility}
                    groupId={draftGroupId}
                    onGroupChange={setDraftGroupId}
                    groups={groups.map((g) => ({ id: g.id, name: g.name }))}
                    canUseGroup={canUseGroup}
                  />
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!draft.trim() || saving || (draftVisibility === 'group' && !draftGroupId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-all disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                      color: '#0F0E0C',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

/* ────────────────────────────────────────────────────────────────────── */

function NoteThread(props: {
  note: StudyNote
  currentUserId: string
  editing: { id: string; body: string } | null
  onStartEdit: (n: StudyNote) => void
  onChangeEdit: (body: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: (id: string) => void
  onReply: (id: string) => void
  replyOpenFor: string | null
  replyBody: string
  onChangeReply: (body: string) => void
  onCancelReply: () => void
  onSendReply: () => void
  onChangeVisibility: (id: string, v: NoteVisibility, groupId?: string | null) => void
  availableGroups: Array<{ id: string; name: string }>
  saving: boolean
}) {
  const { note } = props
  const isReplyOpen = props.replyOpenFor === note.id

  return (
    <article className="flex flex-col gap-3">
      <NoteCard {...props} note={note} depth={0} />
      {note.replies.length > 0 ? (
        <div className="pl-10 sm:pl-12 flex flex-col gap-3">
          {note.replies.map((r) => (
            <NoteCard
              key={r.id}
              {...props}
              note={r}
              depth={1}
            />
          ))}
        </div>
      ) : null}
      {isReplyOpen ? (
        <div className="pl-10 sm:pl-12">
          <div
            className="rounded-xl p-3"
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-1)',
            }}
          >
            <textarea
              value={props.replyBody}
              onChange={(e) => props.onChangeReply(e.target.value)}
              placeholder="Responder..."
              rows={2}
              maxLength={10000}
              autoFocus
              className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={props.onCancelReply}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={props.onSendReply}
                disabled={!props.replyBody.trim() || props.saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
                style={{
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Send className="w-3 h-3" />
                Responder
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

/* ────────────────────────────────────────────────────────────────────── */

function NoteCard(props: {
  note: StudyNote
  currentUserId: string
  editing: { id: string; body: string } | null
  onStartEdit: (n: StudyNote) => void
  onChangeEdit: (body: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: (id: string) => void
  onReply: (id: string) => void
  onChangeVisibility: (id: string, v: NoteVisibility, groupId?: string | null) => void
  availableGroups: Array<{ id: string; name: string }>
  saving: boolean
  depth: 0 | 1
}) {
  const { note, currentUserId, editing, depth } = props
  const isMine = note.user_id === currentUserId
  const isEditing = editing?.id === note.id
  const VisMeta = VISIBILITY_META[note.visibility]
  const isReply = depth === 1

  return (
    <div
      className="flex gap-3"
      style={{
        opacity: 1,
      }}
    >
      <AuthorAvatar author={note.author} />
      <div className="flex-1 min-w-0">
        <header className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          >
            {note.author?.name || note.author?.public_handle || 'Usuário'}
          </span>
          {note.author?.public_handle ? (
            <span
              className="text-xs"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              @{note.author.public_handle}
            </span>
          ) : null}
          <span
            className="text-xs"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            · {formatRelative(note.created_at)}
          </span>
          {!isReply ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(201,168,76,0.08)',
                color: VisMeta.color,
                fontFamily: 'var(--font-body)',
              }}
              aria-label={`Visibilidade: ${VisMeta.label}`}
            >
              <VisMeta.Icon className="w-3 h-3" />
              {VisMeta.label}
            </span>
          ) : null}
        </header>

        {isEditing && editing ? (
          <div className="mt-2">
            <textarea
              value={editing.body}
              onChange={(e) => props.onChangeEdit(e.target.value)}
              rows={3}
              maxLength={10000}
              className="w-full resize-none rounded-lg px-3 py-2 text-sm leading-relaxed outline-none"
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border-1)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={props.onSaveEdit}
                disabled={props.saving || !editing.body.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Check className="w-3 h-3" />
                Salvar
              </button>
              <button
                type="button"
                onClick={props.onCancelEdit}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-sm leading-relaxed whitespace-pre-line mt-1"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            {note.body}
          </p>
        )}

        {!isEditing ? (
          <footer className="flex items-center gap-1 mt-2 -ml-2">
            {!isReply ? (
              <ActionButton icon={MessageCircle} label="Responder" onClick={() => props.onReply(note.id)} />
            ) : null}
            {isMine ? (
              <>
                {!isReply ? (
                  <VisibilityChanger
                    value={note.visibility}
                    onChange={(v, groupId) => props.onChangeVisibility(note.id, v, groupId)}
                    groups={props.availableGroups}
                    currentGroupId={note.group_id}
                  />
                ) : null}
                <ActionButton icon={Pencil} label="Editar" onClick={() => props.onStartEdit(note)} />
                <ActionButton
                  icon={Trash2}
                  label="Excluir"
                  onClick={() => {
                    if (window.confirm('Excluir esta anotação?')) props.onDelete(note.id)
                  }}
                  danger
                />
              </>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── */

function AuthorAvatar({ author }: { author: StudyNoteAuthor | null }) {
  const initials = (author?.name || author?.public_handle || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        background: 'var(--surface-3)',
        border: '1px solid var(--border-1)',
      }}
    >
      {author?.profile_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.profile_image_url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof MessageCircle
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] tracking-wide transition-colors hover:bg-white/5"
      style={{
        color: danger ? '#C88B7C' : 'var(--text-3)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function VisibilitySelector({
  value,
  onChange,
  groupId,
  onGroupChange,
  groups,
  canUseGroup,
}: {
  value: NoteVisibility
  onChange: (v: NoteVisibility) => void
  groupId: string | null
  onGroupChange: (id: string | null) => void
  groups: Array<{ id: string; name: string }>
  canUseGroup: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const Meta = VISIBILITY_META[value]
  const display = useMemo(() => {
    if (value === 'group') {
      const g = groups.find((g) => g.id === groupId)
      return g ? g.name : 'Escolher grupo'
    }
    return Meta.label
  }, [value, groups, groupId, Meta.label])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
        style={{
          background: 'transparent',
          border: '1px solid var(--border-1)',
          color: Meta.color,
          fontFamily: 'var(--font-body)',
        }}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <Meta.Icon className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{display}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute left-0 bottom-full mb-1 w-56 rounded-xl p-1 z-50"
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-1)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.3)',
            }}
          >
            <MenuItem
              icon={Lock}
              label="Privada — só eu vejo"
              active={value === 'private'}
              onClick={() => {
                onChange('private')
                setMenuOpen(false)
              }}
            />
            <MenuItem
              icon={Globe}
              label="Pública — todos que estudam essa lição"
              active={value === 'public'}
              onClick={() => {
                onChange('public')
                setMenuOpen(false)
              }}
            />
            {canUseGroup ? (
              <>
                <div
                  className="my-1 h-px"
                  style={{ background: 'var(--border-2)' }}
                />
                <p
                  className="px-3 py-1 text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  Meus grupos
                </p>
                {groups.map((g) => (
                  <MenuItem
                    key={g.id}
                    icon={Users}
                    label={g.name}
                    active={value === 'group' && groupId === g.id}
                    onClick={() => {
                      onChange('group')
                      onGroupChange(g.id)
                      setMenuOpen(false)
                    }}
                  />
                ))}
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Lock
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors hover:bg-white/5"
      style={{
        color: active ? 'var(--accent)' : 'var(--text-2)',
        fontFamily: 'var(--font-body)',
        background: active ? 'rgba(201,168,76,0.06)' : 'transparent',
      }}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {active ? <Check className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent)' }} /> : null}
    </button>
  )
}

function VisibilityChanger({
  value,
  onChange,
  groups,
  currentGroupId,
}: {
  value: NoteVisibility
  onChange: (v: NoteVisibility, groupId?: string | null) => void
  groups: Array<{ id: string; name: string }>
  currentGroupId: string | null
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const Meta = VISIBILITY_META[value]
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors hover:bg-white/5"
        style={{
          color: Meta.color,
          fontFamily: 'var(--font-body)',
        }}
        aria-label="Mudar visibilidade"
      >
        <Meta.Icon className="w-3.5 h-3.5" />
        {Meta.label}
      </button>
      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute left-0 top-full mt-1 w-56 rounded-xl p-1 z-50"
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-1)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.3)',
            }}
          >
            <MenuItem
              icon={Lock}
              label="Tornar privada"
              active={value === 'private'}
              onClick={() => {
                onChange('private', null)
                setMenuOpen(false)
              }}
            />
            <MenuItem
              icon={Globe}
              label="Publicar pra todos"
              active={value === 'public'}
              onClick={() => {
                onChange('public', null)
                setMenuOpen(false)
              }}
            />
            {groups.length > 0 ? (
              <>
                <div className="my-1 h-px" style={{ background: 'var(--border-2)' }} />
                {groups.map((g) => (
                  <MenuItem
                    key={g.id}
                    icon={Users}
                    label={`Compartilhar com ${g.name}`}
                    active={value === 'group' && currentGroupId === g.id}
                    onClick={() => {
                      onChange('group', g.id)
                      setMenuOpen(false)
                    }}
                  />
                ))}
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── */

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: diffD > 180 ? '2-digit' : undefined })
}
