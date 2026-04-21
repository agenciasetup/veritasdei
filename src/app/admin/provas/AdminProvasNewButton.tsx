'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminProvasNewButton() {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [contentType, setContentType] = useState('dogmas')
  const [contentRef, setContentRef] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    if (!supabase) {
      setError('Cliente Supabase indisponível.')
      setSaving(false)
      return
    }
    const { data, error: err } = await supabase
      .from('study_quizzes')
      .insert({
        content_type: contentType.trim(),
        content_ref: contentRef.trim(),
        title: title.trim(),
        description: null,
        passing_score: 100,
        xp_bonus: 20,
        status: 'draft',
        created_by: user.id,
      })
      .select('id')
      .single()
    setSaving(false)
    if (err || !data) {
      setError(err?.message ?? 'Erro ao criar prova.')
      return
    }
    router.push(`/admin/provas/${(data as { id: string }).id}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
          color: '#0F0E0C',
          fontFamily: 'Cinzel, serif',
          fontWeight: 600,
        }}
      >
        <Plus className="w-4 h-4" />
        Nova prova
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          />
          <form
            onSubmit={handleCreate}
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
            }}
          >
            <header className="flex items-center justify-between mb-4">
              <h2
                className="text-sm tracking-[0.15em] uppercase"
                style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
              >
                Nova prova
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
              </button>
            </header>

            <div className="space-y-3">
              <Field label="Pilar (content_type)" hint="ex: dogmas, oracoes, rosario">
                <input
                  type="text"
                  required
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={fieldStyle}
                />
              </Field>
              <Field label="Referência (content_ref)" hint="ex: topic:dogmas-sobre-deus">
                <input
                  type="text"
                  required
                  value={contentRef}
                  onChange={(e) => setContentRef(e.target.value)}
                  placeholder="topic:..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={fieldStyle}
                />
              </Field>
              <Field label="Título">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Prova: ..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={fieldStyle}
                />
              </Field>
              {error ? (
                <p className="text-xs" style={{ color: '#C88B7C', fontFamily: 'Poppins, sans-serif' }}>
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={saving || !title.trim() || !contentRef.trim() || !contentType.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                  color: '#0F0E0C',
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Criando...' : 'Criar e editar'}
              </button>
              <p
                className="text-[11px] mt-2"
                style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
              >
                A prova começa como rascunho (status=draft). Você vai adicionar questões e publicar depois.
              </p>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="text-[11px] tracking-[0.1em] uppercase block mb-1"
        style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span
          className="block text-[11px] mt-1"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'var(--surface-3)',
  border: '1px solid var(--border-1)',
  color: 'var(--text-primary)',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
}
