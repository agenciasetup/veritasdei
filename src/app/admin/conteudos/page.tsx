'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, ChevronRight, Plus, Pencil, Trash2, Eye, EyeOff,
  ArrowLeft, Save, X, Image, GripVertical,
} from 'lucide-react'

type Level = 'groups' | 'topics' | 'subtopics' | 'items'

interface ContentGroup { id: string; slug: string; title: string; subtitle: string | null; description: string | null; icon: string | null; cover_url: string | null; sort_order: number; visible: boolean }
interface ContentTopic { id: string; group_id: string; slug: string; title: string; subtitle: string | null; description: string | null; icon: string | null; cover_url: string | null; sort_order: number; visible: boolean }
interface ContentSubtopic { id: string; topic_id: string; slug: string; title: string; subtitle: string | null; description: string | null; cover_url: string | null; sort_order: number; visible: boolean }
interface ContentItem { id: string; subtopic_id: string; kind: string; title: string | null; body: string; reference: string | null; image_url: string | null; sort_order: number; visible: boolean }

const KIND_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'verse', label: 'Versículo' },
  { value: 'prayer', label: 'Oração' },
  { value: 'definition', label: 'Definição' },
  { value: 'quote', label: 'Citação' },
  { value: 'image', label: 'Imagem' },
]

const BODY_MAX = 2000
const TITLE_MAX = 120
const SUBTITLE_MAX = 200
const DESC_MAX = 500

export default function AdminConteudosPage() {
  const supabase = createClient()

  // Navigation state
  const [level, setLevel] = useState<Level>('groups')
  const [selectedGroup, setSelectedGroup] = useState<ContentGroup | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<ContentTopic | null>(null)
  const [selectedSubtopic, setSelectedSubtopic] = useState<ContentSubtopic | null>(null)

  // Data
  const [groups, setGroups] = useState<ContentGroup[]>([])
  const [topics, setTopics] = useState<ContentTopic[]>([])
  const [subtopics, setSubtopics] = useState<ContentSubtopic[]>([])
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Edit modal
  const [editing, setEditing] = useState<Record<string, string | number | boolean | null> | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [saving, setSaving] = useState(false)

  // Breadcrumb
  const breadcrumb = [
    { label: 'Conteúdos', onClick: () => { setLevel('groups'); setSelectedGroup(null); setSelectedTopic(null); setSelectedSubtopic(null) } },
    ...(selectedGroup ? [{ label: selectedGroup.title, onClick: () => { setLevel('topics'); setSelectedTopic(null); setSelectedSubtopic(null) } }] : []),
    ...(selectedTopic ? [{ label: selectedTopic.title, onClick: () => { setLevel('subtopics'); setSelectedSubtopic(null) } }] : []),
    ...(selectedSubtopic ? [{ label: selectedSubtopic.title, onClick: () => {} }] : []),
  ]

  // Fetch data based on level
  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)

    if (level === 'groups') {
      const { data } = await supabase.from('content_groups').select('*').order('sort_order')
      setGroups((data as ContentGroup[]) ?? [])
    } else if (level === 'topics' && selectedGroup) {
      const { data } = await supabase.from('content_topics').select('*').eq('group_id', selectedGroup.id).order('sort_order')
      setTopics((data as ContentTopic[]) ?? [])
    } else if (level === 'subtopics' && selectedTopic) {
      const { data } = await supabase.from('content_subtopics').select('*').eq('topic_id', selectedTopic.id).order('sort_order')
      setSubtopics((data as ContentSubtopic[]) ?? [])
    } else if (level === 'items' && selectedSubtopic) {
      const { data } = await supabase.from('content_items').select('*').eq('subtopic_id', selectedSubtopic.id).order('sort_order')
      setItems((data as ContentItem[]) ?? [])
    }

    setLoading(false)
  }, [supabase, level, selectedGroup, selectedTopic, selectedSubtopic])

  useEffect(() => { fetchData() }, [fetchData])

  const tableName = level === 'groups' ? 'content_groups' : level === 'topics' ? 'content_topics' : level === 'subtopics' ? 'content_subtopics' : 'content_items'

  const handleSave = async () => {
    if (!supabase || !editing) return
    setSaving(true)

    const payload = { ...editing }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    if (editMode === 'create') {
      // Add parent FK
      if (level === 'topics' && selectedGroup) payload.group_id = selectedGroup.id
      if (level === 'subtopics' && selectedTopic) payload.topic_id = selectedTopic.id
      if (level === 'items' && selectedSubtopic) payload.subtopic_id = selectedSubtopic.id

      await supabase.from(tableName).insert(payload)
    } else {
      await supabase.from(tableName).update(payload).eq('id', editing.id)
    }

    setSaving(false)
    setEditing(null)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm('Tem certeza? Isso vai deletar todo o conteúdo filho.')) return
    await supabase.from(tableName).delete().eq('id', id)
    fetchData()
  }

  const handleToggleVisible = async (id: string, current: boolean) => {
    if (!supabase) return
    await supabase.from(tableName).update({ visible: !current }).eq('id', id)
    fetchData()
  }

  const openCreate = () => {
    const base: Record<string, string | number | boolean | null> = { title: '', subtitle: '', description: '', sort_order: 0, visible: true }
    if (level === 'groups') { base.slug = ''; base.icon = '' }
    if (level === 'topics') { base.slug = ''; base.icon = '' }
    if (level === 'subtopics') { base.slug = '' }
    if (level === 'items') { base.kind = 'text'; base.body = ''; base.reference = ''; delete base.description }
    setEditing(base)
    setEditMode('create')
  }

  const openEdit = (item: Record<string, unknown>) => {
    setEditing(item as Record<string, string | number | boolean | null>)
    setEditMode('edit')
  }

  const navigate = (item: ContentGroup | ContentTopic | ContentSubtopic) => {
    if (level === 'groups') {
      setSelectedGroup(item as ContentGroup)
      setLevel('topics')
    } else if (level === 'topics') {
      setSelectedTopic(item as ContentTopic)
      setLevel('subtopics')
    } else if (level === 'subtopics') {
      setSelectedSubtopic(item as ContentSubtopic)
      setLevel('items')
    }
  }

  const goBack = () => {
    if (level === 'items') { setLevel('subtopics'); setSelectedSubtopic(null) }
    else if (level === 'subtopics') { setLevel('topics'); setSelectedTopic(null) }
    else if (level === 'topics') { setLevel('groups'); setSelectedGroup(null) }
  }

  const currentData = level === 'groups' ? groups : level === 'topics' ? topics : level === 'subtopics' ? subtopics : items
  const levelLabel = level === 'groups' ? 'Grupo' : level === 'topics' ? 'Tópico' : level === 'subtopics' ? 'Sub-tópico' : 'Conteúdo'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: '#7A7368' }} />}
            <button onClick={b.onClick}
              className="text-xs transition-colors hover:underline"
              style={{ color: i === breadcrumb.length - 1 ? '#C9A84C' : '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              {b.label}
            </button>
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {level !== 'groups' && (
            <button onClick={goBack} className="p-2 rounded-lg" style={{ color: '#7A7368' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <FileText className="w-5 h-5" style={{ color: '#C9A84C' }} />
          <h1 className="text-lg font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            {level === 'groups' ? 'Conteúdos' : selectedGroup?.title}
          </h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}>
          <Plus className="w-4 h-4" />
          Novo {levelLabel}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && currentData.length === 0 && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: 'rgba(16,16,16,0.5)', border: '1px solid rgba(201,168,76,0.08)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#7A7368', opacity: 0.4 }} />
          <p className="text-sm mb-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Nenhum {levelLabel.toLowerCase()} encontrado
          </p>
          <p className="text-xs" style={{ color: '#7A736870' }}>
            Clique em &quot;Novo {levelLabel}&quot; para criar o primeiro
          </p>
        </div>
      )}

      {/* List */}
      {!loading && currentData.length > 0 && (
        <div className="space-y-2">
          {currentData.map((item: Record<string, unknown>) => (
            <div key={item.id as string}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
              style={{
                background: 'rgba(16,16,16,0.6)',
                border: '1px solid rgba(201,168,76,0.08)',
                opacity: (item.visible as boolean) ? 1 : 0.5,
              }}>
              <GripVertical className="w-4 h-4 flex-shrink-0 opacity-30" style={{ color: '#7A7368' }} />

              {/* Cover thumbnail */}
              {(item.cover_url || item.image_url) && (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ border: '1px solid rgba(201,168,76,0.1)' }}>
                  <img src={(item.cover_url ?? item.image_url) as string} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => level !== 'items' ? navigate(item as ContentGroup) : openEdit(item)}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                    {(item.title ?? item.body ?? '—') as string}
                  </p>
                  {level === 'items' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
                      {(item.kind as string)}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-xs truncate" style={{ color: '#7A7368' }}>{item.subtitle as string}</p>
                )}
                {item.reference && (
                  <p className="text-xs" style={{ color: '#C9A84C80' }}>{item.reference as string}</p>
                )}
              </div>

              {/* Navigate arrow for non-items */}
              {level !== 'items' && (
                <button onClick={() => navigate(item as ContentGroup)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#C9A84C' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleVisible(item.id as string, item.visible as boolean)}
                  className="p-1.5 rounded-lg" style={{ color: '#7A7368' }}
                  title={(item.visible as boolean) ? 'Ocultar' : 'Mostrar'}>
                  {(item.visible as boolean) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg" style={{ color: '#7A7368' }}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id as string)} className="p-1.5 rounded-lg" style={{ color: '#D94F5C' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)' }}>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                {editMode === 'create' ? `Novo ${levelLabel}` : `Editar ${levelLabel}`}
              </h2>
              <button onClick={() => setEditing(null)} className="p-1" style={{ color: '#7A7368' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Slug (groups, topics, subtopics) */}
              {'slug' in editing && (
                <ModalField label="Slug (URL)" value={(editing.slug as string) ?? ''} max={60}
                  onChange={v => setEditing({ ...editing, slug: v })} placeholder="ex: dogmas" />
              )}

              {/* Title */}
              {'title' in editing && (
                <ModalField label="Título" value={(editing.title as string) ?? ''} max={TITLE_MAX}
                  onChange={v => setEditing({ ...editing, title: v })} placeholder="Título do conteúdo" />
              )}

              {/* Subtitle */}
              {'subtitle' in editing && (
                <ModalField label="Subtítulo" value={(editing.subtitle as string) ?? ''} max={SUBTITLE_MAX}
                  onChange={v => setEditing({ ...editing, subtitle: v })} placeholder="Subtítulo opcional" />
              )}

              {/* Description */}
              {'description' in editing && (
                <ModalTextarea label="Descrição" value={(editing.description as string) ?? ''} max={DESC_MAX}
                  onChange={v => setEditing({ ...editing, description: v })} placeholder="Descrição breve" rows={3} />
              )}

              {/* Kind (items only) */}
              {'kind' in editing && (
                <div>
                  <label className="block text-[10px] mb-1.5 tracking-wider uppercase"
                    style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Tipo</label>
                  <select value={(editing.kind as string) ?? 'text'}
                    onChange={e => setEditing({ ...editing, kind: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}>
                    {KIND_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0A0A0A' }}>{o.label}</option>)}
                  </select>
                </div>
              )}

              {/* Body (items only) */}
              {'body' in editing && (
                <ModalTextarea label="Conteúdo" value={(editing.body as string) ?? ''} max={BODY_MAX}
                  onChange={v => setEditing({ ...editing, body: v })} placeholder="Texto do conteúdo..." rows={6} />
              )}

              {/* Reference (items only) */}
              {'reference' in editing && (
                <ModalField label="Referência" value={(editing.reference as string) ?? ''} max={100}
                  onChange={v => setEditing({ ...editing, reference: v })} placeholder="Ex: Jo 3,16 ou CIC §1030" />
              )}

              {/* Icon */}
              {'icon' in editing && (
                <ModalField label="Ícone (nome lucide)" value={(editing.icon as string) ?? ''} max={40}
                  onChange={v => setEditing({ ...editing, icon: v })} placeholder="Ex: church, book-open" />
              )}

              {/* Cover URL */}
              {'cover_url' in editing && (
                <ModalField label="URL da Imagem Cover (900x400)" value={(editing.cover_url as string) ?? ''} max={500}
                  onChange={v => setEditing({ ...editing, cover_url: v })} placeholder="https://..." />
              )}

              {/* Image URL (items) */}
              {'image_url' in editing && (
                <ModalField label="URL da Imagem" value={(editing.image_url as string) ?? ''} max={500}
                  onChange={v => setEditing({ ...editing, image_url: v })} placeholder="https://..." />
              )}

              {/* Sort order */}
              <div>
                <label className="block text-[10px] mb-1.5 tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Ordem</label>
                <input type="number" value={(editing.sort_order as number) ?? 0}
                  onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4"
              style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
              <button onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl text-xs"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: saving ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                  color: saving ? '#7A7368' : '#0A0A0A', fontFamily: 'Poppins, sans-serif',
                }}>
                {saving ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} />
                  : <><Save className="w-4 h-4" /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalField({ label, value, onChange, placeholder, max }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>{label}</label>
        <span className="text-[10px]" style={{ color: value.length > max * 0.9 ? '#D94F5C' : '#7A736850' }}>{value.length}/{max}</span>
      </div>
      <input type="text" value={value} onChange={e => e.target.value.length <= max && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
    </div>
  )
}

function ModalTextarea({ label, value, onChange, placeholder, max, rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number; rows: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>{label}</label>
        <span className="text-[10px]" style={{ color: value.length > max * 0.9 ? '#D94F5C' : '#7A736850' }}>{value.length}/{max}</span>
      </div>
      <textarea value={value} onChange={e => e.target.value.length <= max && onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
        style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
    </div>
  )
}
