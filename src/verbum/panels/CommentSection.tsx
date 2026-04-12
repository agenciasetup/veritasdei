'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Trash2, Pencil, X, Check } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  type VerbumComment,
} from '../services/comment.service'

interface CommentSectionProps {
  flowId: string
  userId: string
  target: { nodeId?: string; edgeId?: string }
  isReadOnly: boolean
}

export default function CommentSection({ flowId, userId, target, isReadOnly }: CommentSectionProps) {
  const [comments, setComments] = useState<VerbumComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load comments
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getComments(flowId, target).then((data) => {
      if (!cancelled) {
        setComments(data)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [flowId, target.nodeId, target.edgeId])

  const handleAdd = useCallback(async () => {
    const content = newComment.trim()
    if (!content || submitting) return

    setSubmitting(true)
    const comment = await addComment(flowId, userId, content, target)
    if (comment) {
      setComments((prev) => [...prev, comment])
      setNewComment('')
    }
    setSubmitting(false)
    inputRef.current?.focus()
  }, [flowId, userId, target, newComment, submitting])

  const handleUpdate = useCallback(async (commentId: string) => {
    const content = editContent.trim()
    if (!content) return

    const success = await updateComment(commentId, content)
    if (success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content, updated_at: new Date().toISOString() } : c))
      )
    }
    setEditingId(null)
  }, [editContent])

  const handleDelete = useCallback(async (commentId: string) => {
    const success = await deleteComment(commentId)
    if (success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }, [])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div className="space-y-3">
      <div
        className="text-[10px] uppercase tracking-wider font-semibold"
        style={{ color: VERBUM_COLORS.text_muted }}
      >
        Comentarios ({comments.length})
      </div>

      {loading && (
        <div className="text-[11px] py-2" style={{ color: VERBUM_COLORS.text_muted }}>
          Carregando...
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={{
                background: 'rgba(201,168,76,0.15)',
                color: VERBUM_COLORS.ui_gold,
              }}
            >
              {(comment.user_name || 'U')[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] font-semibold truncate"
                  style={{ color: VERBUM_COLORS.text_primary }}
                >
                  {comment.user_name || 'Usuario'}
                </span>
                <span className="text-[9px]" style={{ color: VERBUM_COLORS.text_muted }}>
                  {formatTime(comment.created_at)}
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="flex gap-1 mt-1">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(comment.id)}
                    className="flex-1 px-2 py-0.5 rounded text-[11px] outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${VERBUM_COLORS.ui_border}`,
                      color: VERBUM_COLORS.text_primary,
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    className="p-0.5"
                    style={{ color: '#64B464' }}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-0.5"
                    style={{ color: VERBUM_COLORS.text_muted }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="text-[11px] mt-0.5 leading-relaxed"
                  style={{ color: VERBUM_COLORS.text_secondary }}
                >
                  {comment.content}
                </div>
              )}

              {/* Actions for own comments */}
              {comment.user_id === userId && editingId !== comment.id && (
                <div className="flex gap-2 mt-0.5">
                  <button
                    onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}
                    className="text-[9px] flex items-center gap-0.5"
                    style={{ color: VERBUM_COLORS.text_muted }}
                  >
                    <Pencil className="w-2.5 h-2.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-[9px] flex items-center gap-0.5"
                    style={{ color: VERBUM_COLORS.text_muted }}
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Apagar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add comment input */}
      {!isReadOnly && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleAdd() }}
          className="flex gap-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar comentario..."
            maxLength={2000}
            className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              color: VERBUM_COLORS.text_primary,
              fontFamily: 'Poppins, sans-serif',
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-2 py-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{
              background: 'rgba(201,168,76,0.1)',
              color: VERBUM_COLORS.ui_gold,
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  )
}
