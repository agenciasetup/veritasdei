'use client'

import { useEffect, useState } from 'react'
import { X, Plus, Save, Trash2, NotebookPen } from 'lucide-react'
import { useStudyNotes, type StudyNote } from '@/lib/study/useStudyNotes'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  contentType: string
  contentRef: string
  contentTitle: string
}

export default function StudyNotesPanel({
  open,
  onClose,
  contentType,
  contentRef,
  contentTitle,
}: Props) {
  const { user } = useAuth()
  const { notes, loading, saving, create, update, remove } = useStudyNotes(
    open ? contentType : null,
    open ? contentRef : null,
  )
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null)

  useEffect(() => {
    if (!open) {
      setDraft('')
      setEditing(null)
    }
  }, [open])

  if (!open) return null

  async function handleCreate() {
    if (!draft.trim()) return
    await create(draft)
    setDraft('')
  }

  async function handleSaveEdit() {
    if (!editing || !editing.body.trim()) return
    await update(editing.id, editing.body)
    setEditing(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Painel de anotações"
    >
      <button
        type="button"
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar painel"
      />
      <aside
        className="w-full max-w-md flex flex-col h-full overflow-hidden"
        style={{
          background: 'rgba(15,14,12,0.98)',
          borderLeft: '1px solid rgba(201,168,76,0.18)',
        }}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}
        >
          <div>
            <div
              className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              Minhas anotações
            </div>
            <p
              className="text-sm mt-1 line-clamp-1"
              style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
            >
              {contentTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </header>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <p style={{ color: 'var(--text-muted)' }}>
              Entre na sua conta para salvar anotações.
            </p>
          </div>
        ) : (
          <>
            <div
              className="p-5"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva sua reflexão, pergunta ou aplicação pessoal..."
                rows={4}
                maxLength={10000}
                className="w-full resize-none rounded-lg px-4 py-3 text-sm leading-relaxed outline-none focus:ring-1"
                style={{
                  background: 'rgba(20,18,14,0.6)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: '#E8E2D8',
                  fontFamily: 'Poppins, sans-serif',
                }}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!draft.trim() || saving}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                  color: '#0F0E0C',
                  fontFamily: 'Cinzel, serif',
                }}
              >
                <Plus className="w-4 h-4" />
                Adicionar anotação
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loading ? (
                <p
                  className="text-center text-sm py-8"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Carregando...
                </p>
              ) : notes.length === 0 ? (
                <p
                  className="text-center text-sm py-8"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Nenhuma anotação ainda. Registre suas reflexões aqui — só você as vê.
                </p>
              ) : (
                notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    editing={editing?.id === note.id ? editing : null}
                    onStartEdit={() => setEditing({ id: note.id, body: note.body })}
                    onChangeEdit={(body) =>
                      setEditing(editing ? { ...editing, body } : null)
                    }
                    onCancelEdit={() => setEditing(null)}
                    onSaveEdit={handleSaveEdit}
                    onDelete={() => remove(note.id)}
                    saving={saving}
                  />
                ))
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function NoteCard({
  note,
  editing,
  onStartEdit,
  onChangeEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  saving,
}: {
  note: StudyNote
  editing: { id: string; body: string } | null
  onStartEdit: () => void
  onChangeEdit: (body: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  saving: boolean
}) {
  const isEditing = Boolean(editing)
  const updated = new Date(note.updated_at)

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'rgba(20,18,14,0.6)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {isEditing && editing ? (
        <>
          <textarea
            value={editing.body}
            onChange={(e) => onChangeEdit(e.target.value)}
            rows={4}
            maxLength={10000}
            className="w-full resize-none rounded-lg px-3 py-2 text-sm leading-relaxed outline-none"
            style={{
              background: 'rgba(15,14,12,0.8)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#E8E2D8',
              fontFamily: 'Poppins, sans-serif',
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={saving || !editing.body.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
              style={{
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: 'var(--gold)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Save className="w-3.5 h-3.5" />
              Salvar
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{
              color: '#E8E2D8',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 300,
            }}
          >
            {note.body}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
            >
              {updated.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onStartEdit}
                className="px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-1 rounded transition-colors hover:bg-red-500/10"
                aria-label="Remover anotação"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
