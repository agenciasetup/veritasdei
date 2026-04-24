'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react'

type Appeal = {
  id: string
  post_id: string | null
  report_id: string | null
  reason: string
  status: 'pending' | 'upheld' | 'denied' | 'dismissed'
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
}

export function AppealsList() {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      const res = await fetch('/api/comunidade/appeals')
      if (res.ok) {
        const data = await res.json()
        setAppeals(data.appeals ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return (
    <div className="space-y-4">
      {formOpen ? (
        <NewAppealForm
          onCancel={() => setFormOpen(false)}
          onCreated={() => {
            setFormOpen(false)
            void reload()
          }}
        />
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <Plus className="w-4 h-4" />
          Nova apelação
        </button>
      )}

      {loading ? (
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Carregando...
        </p>
      ) : appeals.length === 0 ? (
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Nenhuma apelação registrada ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {appeals.map((a) => (
            <li
              key={a.id}
              className="p-3 rounded-lg text-xs"
              style={{
                background: 'rgba(201,168,76,0.04)',
                border: '1px solid rgba(201,168,76,0.08)',
                color: '#B8AFA2',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{formatDateTime(a.created_at)}</span>
                <StatusChip status={a.status} />
              </div>
              <p className="mt-2" style={{ color: '#F2EDE4' }}>
                {a.reason}
              </p>
              {a.resolution_note && (
                <p className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(201,168,76,0.08)', color: '#7A7368' }}>
                  Resposta da equipe: {a.resolution_note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NewAppealForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [postId, setPostId] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (reason.trim().length < 10) {
      setError('Descreva sua apelação com pelo menos 10 caracteres.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/comunidade/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId.trim() || undefined,
          reason: reason.trim(),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.detail ?? body?.error ?? 'Não foi possível enviar.')
        return
      }
      onCreated()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="p-4 rounded-xl space-y-3"
      style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)' }}
    >
      <label className="block text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
        ID do post (se aplicável)
        <input
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          placeholder="opcional"
          className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
          }}
        />
      </label>
      <label className="block text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
        Por que você acredita que a decisão foi equivocada?
        <textarea
          required
          minLength={10}
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </label>
      {error && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          style={{ background: '#C9A84C', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.04em' }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Enviar apelação
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ background: 'transparent', color: '#7A7368', fontFamily: 'Poppins, sans-serif', border: '1px solid rgba(201,168,76,0.15)' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function StatusChip({ status }: { status: Appeal['status'] }) {
  const config: Record<Appeal['status'], { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'em análise', bg: 'rgba(201,168,76,0.12)', color: '#C9A84C', icon: <Clock className="w-3 h-3" /> },
    upheld: { label: 'acolhida', bg: 'rgba(16,185,129,0.12)', color: '#10b981', icon: <CheckCircle2 className="w-3 h-3" /> },
    denied: { label: 'negada', bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: <XCircle className="w-3 h-3" /> },
    dismissed: { label: 'arquivada', bg: 'rgba(122,115,104,0.2)', color: '#7A7368', icon: <XCircle className="w-3 h-3" /> },
  }
  const c = config[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
      style={{ background: c.bg, color: c.color }}
    >
      {c.icon} {c.label}
    </span>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
