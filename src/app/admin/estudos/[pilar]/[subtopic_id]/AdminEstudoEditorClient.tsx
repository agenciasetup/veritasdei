'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import type { StudyDeepdiveSection, StudyDeepdiveSource } from '@/lib/study/types'

interface Subtopic {
  id: string
  title: string
  description: string | null
  topic_id: string
}

interface Deepdive {
  id: string
  content_type: string
  content_ref: string
  sections: StudyDeepdiveSection[]
  sources: StudyDeepdiveSource[]
  status: 'draft' | 'review' | 'published' | 'archived'
  published_at: string | null
}

interface Props {
  pillarSlug: string
  subtopic: Subtopic
  initialDeepdive: Deepdive | null
}

export default function AdminEstudoEditorClient({
  pillarSlug,
  subtopic,
  initialDeepdive,
}: Props) {
  const [deepdive, setDeepdive] = useState<Deepdive | null>(initialDeepdive)
  const [busy, setBusy] = useState<'generate' | 'publish' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setBusy('generate')
    setError(null)
    try {
      const res = await fetch('/api/admin/estudos/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content_type: pillarSlug,
          content_ref: subtopic.id,
          subject_title: subtopic.title,
          subject_description: subtopic.description,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'Erro ao gerar')
        return
      }
      setDeepdive(payload.deepdive)
    } finally {
      setBusy(null)
    }
  }

  async function save(status: Deepdive['status']) {
    if (!deepdive) return
    setBusy(status === 'published' ? 'publish' : 'save')
    setError(null)
    try {
      const res = await fetch('/api/admin/estudos/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: deepdive.id,
          status,
          sections: deepdive.sections,
          sources: deepdive.sources,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'Erro ao salvar')
        return
      }
      setDeepdive(payload.deepdive)
    } finally {
      setBusy(null)
    }
  }

  function updateSection(idx: number, patch: Partial<StudyDeepdiveSection>) {
    if (!deepdive) return
    const next = [...deepdive.sections]
    next[idx] = { ...next[idx], ...patch }
    setDeepdive({ ...deepdive, sections: next })
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href={`/admin/estudos/${pillarSlug}`}
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: 'var(--gold)', fontFamily: 'Poppins, sans-serif' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao pilar
      </Link>

      <header className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          {subtopic.title}
        </h1>
        {subtopic.description ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {subtopic.description}
          </p>
        ) : null}
        <div className="flex items-center gap-2 mt-3">
          <StatusChip status={deepdive?.status || 'empty'} />
          {deepdive?.published_at ? (
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
            >
              publicado em{' '}
              {new Date(deepdive.published_at).toLocaleDateString('pt-BR')}
            </span>
          ) : null}
        </div>
      </header>

      {error ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm"
          style={{
            background: 'rgba(127,29,29,0.15)',
            border: '1px solid rgba(127,29,29,0.3)',
            color: 'var(--wine-light)',
          }}
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={generate}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            color: '#0F0E0C',
            fontFamily: 'Cinzel, serif',
            fontWeight: 600,
          }}
        >
          <Sparkles className="w-4 h-4" />
          {busy === 'generate' ? 'Gerando...' : deepdive ? 'Regenerar com IA' : 'Gerar com IA'}
        </button>

        {deepdive ? (
          <>
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: 'var(--gold)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Save className="w-4 h-4" />
              Salvar rascunho
            </button>
            <button
              type="button"
              onClick={() => save('published')}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#4ade80',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Publicar
            </button>
          </>
        ) : null}
      </div>

      {deepdive ? (
        <div className="space-y-5">
          {deepdive.sections.map((section, idx) => (
            <div
              key={`${section.slug}-${idx}`}
              className="rounded-lg p-4"
              style={{
                background: 'rgba(20,18,14,0.5)',
                border: '1px solid rgba(201,168,76,0.1)',
              }}
            >
              <div className="grid grid-cols-[120px_1fr] gap-3 mb-3">
                <input
                  value={section.slug}
                  onChange={(e) => updateSection(idx, { slug: e.target.value })}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    background: 'rgba(15,14,12,0.8)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: 'var(--gold)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                />
                <input
                  value={section.title}
                  onChange={(e) => updateSection(idx, { title: e.target.value })}
                  className="px-2 py-1 rounded text-sm"
                  style={{
                    background: 'rgba(15,14,12,0.8)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                />
              </div>
              <textarea
                value={section.body}
                onChange={(e) => updateSection(idx, { body: e.target.value })}
                rows={10}
                className="w-full resize-y rounded px-3 py-2 text-sm leading-relaxed"
                style={{
                  background: 'rgba(15,14,12,0.8)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: '#E8E2D8',
                  fontFamily: 'Poppins, sans-serif',
                }}
              />
            </div>
          ))}

          <details
            className="rounded-lg p-4"
            style={{
              background: 'rgba(20,18,14,0.5)',
              border: '1px solid rgba(201,168,76,0.1)',
            }}
          >
            <summary
              className="cursor-pointer text-sm"
              style={{ color: 'var(--gold)', fontFamily: 'Poppins, sans-serif' }}
            >
              Fontes ({deepdive.sources.length})
            </summary>
            <textarea
              value={JSON.stringify(deepdive.sources, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as StudyDeepdiveSource[]
                  setDeepdive({ ...deepdive, sources: parsed })
                } catch {
                  // JSON inválido — mantém último estado válido
                }
              }}
              rows={8}
              className="w-full mt-3 resize-y rounded px-3 py-2 text-xs font-mono"
              style={{
                background: 'rgba(15,14,12,0.8)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#E8E2D8',
              }}
            />
          </details>
        </div>
      ) : (
        <p
          className="text-center py-16"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          Nenhum conteúdo gerado ainda. Clique em &quot;Gerar com IA&quot; para começar.
        </p>
      )}
    </main>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    published: { color: '#4ade80', label: 'Publicado' },
    review: { color: '#C9A84C', label: 'Em revisão' },
    draft: { color: '#B8A488', label: 'Rascunho' },
    archived: { color: '#7A7368', label: 'Arquivado' },
    empty: { color: '#7A7368', label: 'Sem conteúdo' },
  }
  const style = map[status] || map.empty
  return (
    <span
      className="text-[11px] tracking-[0.1em] uppercase px-2 py-1 rounded"
      style={{
        color: style.color,
        background: `${style.color}15`,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {style.label}
    </span>
  )
}
