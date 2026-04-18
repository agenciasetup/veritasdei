'use client'

import {
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TopicOption = {
  id: string
  slug: string
  title: string
  subtopics: Array<{ id: string; slug: string; title: string }>
}

type PrayerRow = {
  id: string
  slug: string | null
  title: string | null
  visible: boolean
  subtopic_id: string
  updated_at: string | null
  subtopic: {
    slug: string
    title: string | null
    topic: {
      slug: string
      title: string | null
    } | null
  } | null
}

const GROUP_SLUG = 'oracoes'

export default function AdminOracoesPage() {
  const supabase = useMemo(() => createClient(), [])

  const [topics, setTopics] = useState<TopicOption[]>([])
  const [rows, setRows] = useState<PrayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterTopic, setFilterTopic] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const [topicsRes, itemsRes] = await Promise.all([
        supabase
          .from('content_topics')
          .select(`
            id, slug, title,
            group:content_groups!inner ( slug ),
            subtopics:content_subtopics ( id, slug, title, sort_order )
          `)
          .eq('group.slug', GROUP_SLUG)
          .eq('visible', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('content_items')
          .select(`
            id, slug, title, visible, subtopic_id, updated_at,
            subtopic:content_subtopics!inner (
              slug, title,
              topic:content_topics!inner (
                slug, title,
                group:content_groups!inner ( slug )
              )
            )
          `)
          .eq('subtopic.topic.group.slug', GROUP_SLUG)
          .order('updated_at', { ascending: false }),
      ])

      const topicsRaw = (topicsRes.data ?? []) as unknown as Array<{
        id: string
        slug: string
        title: string | null
        subtopics: Array<{ id: string; slug: string; title: string | null; sort_order: number }>
      }>
      setTopics(
        topicsRaw.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title ?? t.slug,
          subtopics: (t.subtopics ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((s) => ({ id: s.id, slug: s.slug, title: s.title ?? s.slug })),
        }))
      )

      const itemsRaw = (itemsRes.data ?? []) as unknown as PrayerRow[]
      setRows(itemsRaw)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (filterTopic && row.subtopic?.topic?.slug !== filterTopic) return false
      if (!q) return true
      return (
        (row.title ?? '').toLowerCase().includes(q) ||
        (row.slug ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, query, filterTopic])

  const toggleVisible = async (row: PrayerRow) => {
    if (!supabase) return
    // otimista
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, visible: !r.visible } : r))
    )
    const { error } = await supabase
      .from('content_items')
      .update({ visible: !row.visible })
      .eq('id', row.id)
    if (error) {
      // reverte
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, visible: row.visible } : r))
      )
    }
  }

  const handleDelete = async () => {
    if (!supabase || !deleteId) return
    const id = deleteId
    setDeleteId(null)
    const { error } = await supabase.from('content_items').delete().eq('id', id)
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id))
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      {/* Heading + criar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-xl md:text-2xl"
            style={{
              fontFamily: 'Cinzel, serif',
              color: '#F2EDE4',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Orações
          </h1>
          <p
            className="text-sm mt-1"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#8A8378',
            }}
          >
            {rows.length} {rows.length === 1 ? 'oração' : 'orações'} na biblioteca.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all active:scale-95"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            background: 'linear-gradient(135deg, #D9C077, #A88B3A)',
            color: '#0F0E0C',
            boxShadow: '0 4px 14px rgba(201,168,76,0.25)',
          }}
        >
          <Plus className="w-4 h-4" />
          Nova oração
        </button>
      </header>

      {/* Busca + filtro */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label
          className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{
            background: 'rgba(20,18,14,0.55)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: '#C9A84C' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou slug…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#F2EDE4',
            }}
          />
        </label>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm min-w-[160px]"
          style={{
            fontFamily: 'Poppins, sans-serif',
            background: 'rgba(20,18,14,0.55)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#F2EDE4',
          }}
        >
          <option value="">Todas as categorias</option>
          {topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(20,18,14,0.4)',
          border: '1px solid rgba(201,168,76,0.12)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: '#C9A84C' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <p
            className="text-center py-10 text-sm"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#8A8378',
            }}
          >
            Nenhuma oração encontrada.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'rgba(201,168,76,0.08)' }}>
            {filtered.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      fontSize: '0.95rem',
                      color: '#F2EDE4',
                      fontWeight: 600,
                    }}
                  >
                    {row.title ?? row.slug ?? '(sem título)'}
                  </p>
                  <p
                    className="truncate text-[11px] mt-0.5"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      color: '#8A8378',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {row.subtopic?.topic?.title ?? '—'} · {row.subtopic?.title ?? '—'}
                    {row.slug ? ` · /oracoes/${row.slug}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleVisible(row)}
                  aria-label={row.visible ? 'Ocultar' : 'Publicar'}
                  className="inline-flex items-center justify-center rounded-lg w-8 h-8 transition-colors active:scale-90"
                  style={{
                    background: row.visible
                      ? 'rgba(76,175,80,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      row.visible ? 'rgba(76,175,80,0.3)' : 'rgba(201,168,76,0.15)'
                    }`,
                    color: row.visible ? '#66BB6A' : '#8A8378',
                  }}
                >
                  {row.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <Link
                  href={`/admin/oracoes/${row.id}/editor`}
                  aria-label="Editar"
                  className="inline-flex items-center justify-center rounded-lg w-8 h-8 transition-colors active:scale-90"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    color: '#C9A84C',
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteId(row.id)}
                  aria-label="Deletar"
                  className="inline-flex items-center justify-center rounded-lg w-8 h-8 transition-colors active:scale-90"
                  style={{
                    background: 'rgba(217,79,92,0.08)',
                    border: '1px solid rgba(217,79,92,0.25)',
                    color: '#D94F5C',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal criar */}
      {createOpen && (
        <CreateModal
          topics={topics}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false)
            window.location.href = `/admin/oracoes/${id}/editor`
          }}
        />
      )}

      {/* Confirm deletar */}
      {deleteId && (
        <ConfirmDelete
          onCancel={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

// ─────────────────────────── Create Modal ───────────────────────────

function CreateModal({
  topics,
  onClose,
  onCreated,
}: {
  topics: TopicOption[]
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  const [subtopicId, setSubtopicId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtopicOptions = useMemo(() => {
    const out: Array<{ id: string; label: string }> = []
    for (const t of topics) {
      for (const s of t.subtopics) {
        out.push({ id: s.id, label: `${t.title} · ${s.title}` })
      }
    }
    return out
  }, [topics])

  const onTitleChange = (v: string) => {
    setTitle(v)
    if (!slugDirty) setSlug(slugify(v))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    const trimmedSlug = slug.trim()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || !trimmedSlug || !subtopicId) {
      setError('Preencha título, slug e categoria.')
      return
    }

    setSaving(true)
    // Checa slug duplicado
    const { data: existing } = await supabase
      .from('content_items')
      .select('id')
      .eq('slug', trimmedSlug)
      .maybeSingle()
    if (existing) {
      setSaving(false)
      setError('Já existe uma oração com esse slug.')
      return
    }

    const { data, error: insertError } = await supabase
      .from('content_items')
      .insert({
        subtopic_id: subtopicId,
        kind: 'prayer',
        slug: trimmedSlug,
        title: trimmedTitle,
        body: '', // editor preenche depois
        visible: false,
        sort_order: 100,
      })
      .select('id')
      .single()

    setSaving(false)
    if (insertError || !data) {
      setError(insertError?.message ?? 'Falha ao criar.')
      return
    }
    onCreated(data.id as string)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-5"
        style={{
          background: '#141210',
          border: '1px solid rgba(201,168,76,0.22)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.1rem',
              color: '#F2EDE4',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Nova oração
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex items-center justify-center rounded-lg w-8 h-8 active:scale-90"
            style={{ color: '#8A8378' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Título">
            <input
              autoFocus
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
              placeholder="Ex: Oração a São Miguel Arcanjo"
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value))
                setSlugDirty(true)
              }}
              maxLength={120}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
              placeholder="oracao-sao-miguel"
            />
            <p
              className="text-[11px] mt-1"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              URL final: /oracoes/{slug || '…'}
            </p>
          </Field>
          <Field label="Categoria">
            <select
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
            >
              <option value="">Selecione…</option>
              {subtopicOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <p
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
              style={{
                color: '#D94F5C',
                fontFamily: 'Poppins, sans-serif',
                background: 'rgba(217,79,92,0.08)',
                border: '1px solid rgba(217,79,92,0.25)',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#8A8378',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(201,168,76,0.12)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm disabled:opacity-60"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                background: 'linear-gradient(135deg, #D9C077, #A88B3A)',
                color: '#0F0E0C',
              }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar e editar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ────────────────────────── Confirm Delete ──────────────────────────

function ConfirmDelete({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-5"
        style={{
          background: '#141210',
          border: '1px solid rgba(217,79,92,0.3)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" style={{ color: '#D94F5C' }} />
          <h2
            style={{
              fontFamily: 'Cinzel, serif',
              color: '#F2EDE4',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Deletar oração?
          </h2>
        </div>
        <p
          className="text-sm mb-4"
          style={{ fontFamily: 'Poppins, sans-serif', color: '#B8AFA2' }}
        >
          A oração será removida permanentemente. Essa ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-sm"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#8A8378',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(201,168,76,0.12)',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-sm"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: 'rgba(217,79,92,0.15)',
              color: '#D94F5C',
              border: '1px solid rgba(217,79,92,0.35)',
            }}
          >
            Deletar
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────── helpers ──────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] uppercase tracking-[0.12em]"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif',
  background: '#0A0A0A',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
