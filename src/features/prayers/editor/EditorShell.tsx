'use client'

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ArrowLeft, Check, Loader2, Save, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { parsePrayerBody } from '../parser'
import type { Block } from '../types'
import BlockInserter from './BlockInserter'
import { createBlock } from './factory'
import MetaPanel, { type PrayerMetaDraft } from './MetaPanel'
import { serializeBlocks } from './serializer'
import SortableBlock from './SortableBlock'
import { createClient } from '@/lib/supabase/client'

type Identified = { id: string; block: Block }

type PrayerMeta = {
  id: string
  title: string | null
  slug: string | null
  visible: boolean
}

const uid = () => Math.random().toString(36).slice(2, 10)

/**
 * Canvas editor — shell principal da página de edição de oração.
 * Carrega body do banco, parseia em blocos, mantém em state local,
 * salva serializando de volta pra body. Round-trip garantido pelo
 * parser ↔ serializer compartilhado.
 */
const emptyMeta: PrayerMetaDraft = {
  latinTitle: '',
  latinBody: '',
  audioUrl: '',
  videoUrl: '',
  keywords: [],
  scriptureRefs: [],
  metaDescription: '',
  indulgenceNote: '',
  iconName: '',
}

export default function EditorShell({ prayerId }: { prayerId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [meta, setMeta] = useState<PrayerMeta | null>(null)
  const [draft, setDraft] = useState<PrayerMetaDraft>(emptyMeta)
  const [items, setItems] = useState<Identified[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metaOpen, setMetaOpen] = useState(false)

  // Carrega a oração
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data, error: dbError } = await supabase
        .from('content_items')
        .select(
          'id, title, slug, visible, body, latin_title, latin_body, audio_url, video_url, keywords, scripture_refs, meta_description, indulgence_note, icon_name'
        )
        .eq('id', prayerId)
        .maybeSingle()
      if (cancelled) return
      if (dbError || !data) {
        setError(dbError?.message ?? 'Oração não encontrada.')
        setLoading(false)
        return
      }
      const row = data as {
        id: string
        title: string | null
        slug: string | null
        visible: boolean
        body: string
        latin_title: string | null
        latin_body: string | null
        audio_url: string | null
        video_url: string | null
        keywords: string[] | null
        scripture_refs: string[] | null
        meta_description: string | null
        indulgence_note: string | null
        icon_name: string | null
      }
      setMeta({ id: row.id, title: row.title, slug: row.slug, visible: row.visible })
      setDraft({
        latinTitle: row.latin_title ?? '',
        latinBody: row.latin_body ?? '',
        audioUrl: row.audio_url ?? '',
        videoUrl: row.video_url ?? '',
        keywords: row.keywords ?? [],
        scriptureRefs: row.scripture_refs ?? [],
        metaDescription: row.meta_description ?? '',
        indulgenceNote: row.indulgence_note ?? '',
        iconName: row.icon_name ?? '',
      })
      const parsed = parsePrayerBody(row.body)
      setItems(parsed.map((b) => ({ id: uid(), block: b })))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase, prayerId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id)
      const newIdx = prev.findIndex((i) => i.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      setDirty(true)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  const updateBlock = (id: string, next: Block) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { id, block: next } : i)))
    setDirty(true)
  }

  const removeBlock = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDirty(true)
  }

  const insertBlock = (type: Block['type'], atEnd = true) => {
    setItems((prev) => {
      const next = { id: uid(), block: createBlock(type) }
      return atEnd ? [...prev, next] : [next, ...prev]
    })
    setDirty(true)
  }

  const updateMeta = (next: PrayerMetaDraft) => {
    setDraft(next)
    setDirty(true)
  }

  const handleSave = useCallback(async () => {
    if (!supabase || saving) return
    setSaving(true)
    setError(null)
    const body = serializeBlocks(items.map((i) => i.block))
    const payload = {
      body,
      latin_title: draft.latinTitle.trim() || null,
      latin_body: draft.latinBody.trim() || null,
      audio_url: draft.audioUrl.trim() || null,
      video_url: draft.videoUrl.trim() || null,
      keywords: draft.keywords,
      scripture_refs: draft.scriptureRefs,
      meta_description: draft.metaDescription.trim() || null,
      indulgence_note: draft.indulgenceNote.trim() || null,
      icon_name: draft.iconName || null,
      updated_at: new Date().toISOString(),
    }
    const { error: dbError } = await supabase
      .from('content_items')
      .update(payload)
      .eq('id', prayerId)
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setDirty(false)
    setSavedAt(new Date())
  }, [supabase, saving, items, draft, prayerId])

  // Ctrl/Cmd+S pra salvar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
      </div>
    )
  }

  if (!meta) {
    return (
      <p
        className="text-center py-10"
        style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}
      >
        {error ?? 'Oração não encontrada.'}
      </p>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <header
        className="sticky top-[58px] z-30 flex items-center gap-3 -mx-4 md:mx-0 px-4 md:px-0 py-3"
        style={{
          background: 'rgba(13,13,13,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
        }}
      >
        <Link
          href="/admin/oracoes"
          aria-label="Voltar"
          className="inline-flex items-center justify-center rounded-lg w-9 h-9 transition-colors active:scale-90"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#8A8378',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1
            className="truncate"
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.05rem',
              color: '#F2EDE4',
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}
          >
            {meta.title ?? '(sem título)'}
          </h1>
          <p
            className="text-[11px] truncate mt-0.5"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#8A8378',
              letterSpacing: '0.04em',
            }}
          >
            {meta.slug ? `/oracoes/${meta.slug}` : 'sem slug'} ·{' '}
            {meta.visible ? 'Publicada' : 'Rascunho'}
            {savedAt && !dirty && ' · Salvo'}
            {dirty && ' · Alterações não salvas'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMetaOpen(true)}
          aria-label="Metadados"
          className="inline-flex items-center justify-center rounded-lg w-9 h-9 transition-colors active:scale-90"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#C9A84C',
          }}
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm disabled:opacity-50"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            background:
              dirty && !saving
                ? 'linear-gradient(135deg, #D9C077, #A88B3A)'
                : 'rgba(201,168,76,0.08)',
            color: dirty && !saving ? '#0F0E0C' : '#8A8378',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : dirty ? (
            <Save className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {saving ? 'Salvando' : dirty ? 'Salvar' : 'Salvo'}
          </span>
        </button>
      </header>

      {error && (
        <p
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            color: '#D94F5C',
            background: 'rgba(217,79,92,0.08)',
            border: '1px solid rgba(217,79,92,0.25)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {error}
        </p>
      )}

      {/* Canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {items.length === 0 && (
              <p
                className="text-center py-8 rounded-xl"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  color: '#8A8378',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(201,168,76,0.12)',
                }}
              >
                Adicione o primeiro bloco abaixo.
              </p>
            )}
            {items.map(({ id, block }) => (
              <SortableBlock
                key={id}
                id={id}
                block={block}
                onChange={(b) => updateBlock(id, b)}
                onDelete={() => removeBlock(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Inserter */}
      <div className="pt-2">
        <BlockInserter onInsert={(type) => insertBlock(type, true)} />
      </div>

      <MetaPanel
        open={metaOpen}
        meta={draft}
        onChange={updateMeta}
        onClose={() => setMetaOpen(false)}
      />
    </div>
  )
}
