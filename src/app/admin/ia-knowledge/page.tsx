'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Plus, Pencil, Trash2, Search, RefreshCw,
  X, Save, Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  BookOpen, Check,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface KnowledgeEntry {
  id: string
  category: string
  topic: string
  core_teaching: string
  bible_references: string[]
  summary: string
  keywords: string[]
  catechism_references: string
  patristic_references: string
  theology_notes: string
  tradition_notes: string
  source_input: Record<string, string>
  status: string
  created_at: string
  updated_at: string
}

interface FormData {
  titulo: string
  fundamento: string
  baseBiblica: string
  baseCatecismo: string
  patristica: string
  teologia: string
  tradicao: string
}

interface ProcessedData {
  category: string
  topic: string
  core_teaching: string
  bible_references: string[]
  summary: string
  keywords: string[]
  catechism_references: string
  patristic_references: string
  theology_notes: string
  tradition_notes: string
}

interface Stats {
  totalEntries: number
  categories: Record<string, number>
  statusCounts: Record<string, number>
  lastUpdated: string | null
  integrity: { missingKeywords: number; emptyTeachings: number }
}

const EMPTY_FORM: FormData = {
  titulo: '', fundamento: '', baseBiblica: '',
  baseCatecismo: '', patristica: '', teologia: '', tradicao: '',
}

// ─── Main Page ───────────────────────────────────────────────────
export default function IAKnowledgePage() {
  // List state
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalStep, setModalStep] = useState<'form' | 'review'>('form')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [processed, setProcessed] = useState<ProcessedData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null)

  // ─── Fetch entries ─────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (search) params.set('search', search)
      if (filterCategory) params.set('category', filterCategory)

      const res = await fetch(`/api/admin/knowledge?${params}`)
      const json = await res.json()
      if (res.ok) {
        setEntries(json.data)
        setTotal(json.total)
        setCategories(json.categories ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, filterCategory])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // ─── Stats ─────────────────────────────────────────────────────
  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/admin/knowledge/stats')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
    setLoadingStats(false)
  }

  // ─── Process with AI ──────────────────────────────────────────
  const handleProcess = async () => {
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setProcessed(json.processed)
      setModalStep('review')
    } catch {
      setError('Erro de conexão ao processar com IA.')
    } finally {
      setProcessing(false)
    }
  }

  // ─── Save entry ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!processed) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...processed,
        source_input: form,
        status: 'active',
      }

      const url = editingId
        ? `/api/admin/knowledge/${editingId}`
        : '/api/admin/knowledge'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }

      closeModal()
      fetchEntries()
    } catch {
      setError('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete entry ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta entrada? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: 'DELETE' })
      if (res.ok) fetchEntries()
    } catch { /* ignore */ }
    setDeleting(null)
  }

  // ─── Edit entry (load into form) ──────────────────────────────
  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id)
    // Try to load source_input if available, otherwise map from structured fields
    if (entry.source_input && Object.keys(entry.source_input).length > 0) {
      setForm({
        titulo: entry.source_input.titulo ?? entry.topic,
        fundamento: entry.source_input.fundamento ?? entry.core_teaching,
        baseBiblica: entry.source_input.baseBiblica ?? (entry.bible_references ?? []).join(', '),
        baseCatecismo: entry.source_input.baseCatecismo ?? entry.catechism_references ?? '',
        patristica: entry.source_input.patristica ?? entry.patristic_references ?? '',
        teologia: entry.source_input.teologia ?? entry.theology_notes ?? '',
        tradicao: entry.source_input.tradicao ?? entry.tradition_notes ?? '',
      })
    } else {
      setForm({
        titulo: entry.topic,
        fundamento: entry.core_teaching,
        baseBiblica: (entry.bible_references ?? []).join(', '),
        baseCatecismo: entry.catechism_references ?? '',
        patristica: entry.patristic_references ?? '',
        teologia: entry.theology_notes ?? '',
        tradicao: entry.tradition_notes ?? '',
      })
    }
    // Pre-load processed data for direct edit
    setProcessed({
      category: entry.category,
      topic: entry.topic,
      core_teaching: entry.core_teaching,
      bible_references: entry.bible_references ?? [],
      summary: entry.summary,
      keywords: entry.keywords ?? [],
      catechism_references: entry.catechism_references ?? '',
      patristic_references: entry.patristic_references ?? '',
      theology_notes: entry.theology_notes ?? '',
      tradition_notes: entry.tradition_notes ?? '',
    })
    setModalStep('form')
    setModalOpen(true)
  }

  // ─── Close modal ───────────────────────────────────────────────
  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setProcessed(null)
    setModalStep('form')
    setError(null)
  }

  // ─── Open create modal ────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setProcessed(null)
    setModalStep('form')
    setError(null)
    setModalOpen(true)
  }

  const totalPages = Math.ceil(total / 15)

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6" style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            Base de Conhecimento IA
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats}
            disabled={loadingStats}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
            {loadingStats
              ? <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
              : <RefreshCw className="w-3 h-3" />}
            Verificar IA
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}>
            <Plus className="w-4 h-4" /> Nova Entrada
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.08)' }}>
          <div className="flex flex-wrap gap-4 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <div><span style={{ color: '#7A7368' }}>Total:</span> <span style={{ color: '#F2EDE4' }}>{stats.totalEntries}</span></div>
            <div><span style={{ color: '#7A7368' }}>Última atualização:</span> <span style={{ color: '#F2EDE4' }}>{stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString('pt-BR') : '—'}</span></div>
            {stats.integrity.missingKeywords > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" style={{ color: '#D94F5C' }} />
                <span style={{ color: '#D94F5C' }}>{stats.integrity.missingKeywords} sem keywords</span>
              </div>
            )}
            {stats.integrity.emptyTeachings > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" style={{ color: '#D94F5C' }} />
                <span style={{ color: '#D94F5C' }}>{stats.integrity.emptyTeachings} com ensino vazio</span>
              </div>
            )}
          </div>
          {Object.keys(stats.categories).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <span key={cat} className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                  {cat} ({count})
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por tema, resumo ou ensino..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.08)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
          className="px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.08)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none', minWidth: 160 }}
        >
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Entry list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#7A736830' }} />
          <p className="text-sm">Nenhuma entrada encontrada</p>
          <p className="text-xs mt-1">Adicione conhecimento para enriquecer a IA</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="rounded-xl overflow-hidden transition-all"
              style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.08)' }}>
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px]"
                      style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                      {entry.category}
                    </span>
                    {entry.status === 'draft' && (
                      <span className="px-2 py-0.5 rounded text-[10px]"
                        style={{ background: 'rgba(217,79,92,0.1)', color: '#D94F5C' }}>rascunho</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium truncate" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                    {entry.topic}
                  </h3>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    {entry.summary}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); handleEdit(entry) }}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ color: '#7A7368' }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(entry.id) }}
                    disabled={deleting === entry.id}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ color: deleting === entry.id ? '#7A736850' : '#D94F5C' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedId === entry.id ? <ChevronUp className="w-4 h-4" style={{ color: '#7A7368' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#7A7368' }} />}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === entry.id && (
                <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid rgba(201,168,76,0.06)' }}>
                  {/* Keywords */}
                  {entry.keywords && entry.keywords.length > 0 && (
                    <div>
                      <span className="text-[10px] tracking-wider uppercase" style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}>Keywords</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {entry.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px]"
                            style={{ background: 'rgba(201,168,76,0.06)', color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Bible refs */}
                  {entry.bible_references && entry.bible_references.length > 0 && (
                    <div>
                      <span className="text-[10px] tracking-wider uppercase" style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}>Referências Bíblicas</span>
                      <p className="text-xs mt-1" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                        {entry.bible_references.join(' | ')}
                      </p>
                    </div>
                  )}
                  {/* Core teaching preview */}
                  <div>
                    <span className="text-[10px] tracking-wider uppercase" style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}>Ensino Central</span>
                    <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', maxHeight: 120, overflow: 'auto' }}>
                      {entry.core_teaching}
                    </p>
                  </div>
                  {/* Catechism */}
                  {entry.catechism_references && (
                    <div>
                      <span className="text-[10px] tracking-wider uppercase" style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}>Catecismo</span>
                      <p className="text-xs mt-1" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>{entry.catechism_references}</p>
                    </div>
                  )}
                  {/* Patristic */}
                  {entry.patristic_references && (
                    <div>
                      <span className="text-[10px] tracking-wider uppercase" style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}>Patrística</span>
                      <p className="text-xs mt-1" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>{entry.patristic_references}</p>
                    </div>
                  )}
                  <div className="text-[10px] pt-1" style={{ color: '#7A736850', fontFamily: 'Poppins, sans-serif' }}>
                    Criado: {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                    {entry.updated_at && <> | Atualizado: {new Date(entry.updated_at).toLocaleDateString('pt-BR')}</>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
            Anterior
          </button>
          <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
            Próxima
          </button>
        </div>
      )}

      {/* ─── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.12)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
              <div className="flex items-center gap-2">
                {modalStep === 'form' ? <Brain className="w-4 h-4" style={{ color: '#C9A84C' }} /> : <Sparkles className="w-4 h-4" style={{ color: '#C9A84C' }} />}
                <h2 className="text-sm font-bold tracking-wider" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                  {modalStep === 'form'
                    ? (editingId ? 'Editar Entrada' : 'Nova Entrada')
                    : 'Revisão — Resultado da IA'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg" style={{ color: '#7A7368' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.2)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {error}
                </div>
              )}

              {modalStep === 'form' ? (
                <>
                  <ModalField label="Título" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))} placeholder="Ex: Eucaristia, Batismo, Confissão..." max={120} />
                  <ModalTextarea label="O que é / Fundamento / Mensagem" value={form.fundamento} onChange={v => setForm(f => ({ ...f, fundamento: v }))} placeholder="Explicação completa do ensinamento..." max={5000} rows={6} />
                  <ModalTextarea label="Base Bíblica" value={form.baseBiblica} onChange={v => setForm(f => ({ ...f, baseBiblica: v }))} placeholder="Mt 26:26-28, Jo 6:53-56..." max={2000} rows={3} />
                  <ModalTextarea label="Base do Catecismo (CIC)" value={form.baseCatecismo} onChange={v => setForm(f => ({ ...f, baseCatecismo: v }))} placeholder="CIC 1322-1419, CIC 1374..." max={2000} rows={3} />
                  <ModalTextarea label="Patrística" value={form.patristica} onChange={v => setForm(f => ({ ...f, patristica: v }))} placeholder="Santo Inácio de Antioquia, São João Crisóstomo..." max={2000} rows={3} />
                  <ModalTextarea label="Teologia Católica" value={form.teologia} onChange={v => setForm(f => ({ ...f, teologia: v }))} placeholder="São Tomás de Aquino, Suma Teológica..." max={2000} rows={3} />
                  <ModalTextarea label="Tradição" value={form.tradicao} onChange={v => setForm(f => ({ ...f, tradicao: v }))} placeholder="Didaquê, Concílios, práticas da Igreja primitiva..." max={2000} rows={3} />
                </>
              ) : processed ? (
                <>
                  <ModalField label="Categoria" value={processed.category} onChange={v => setProcessed(p => p ? { ...p, category: v } : p)} placeholder="Categoria" max={50} />
                  <ModalField label="Tópico" value={processed.topic} onChange={v => setProcessed(p => p ? { ...p, topic: v } : p)} placeholder="Tópico" max={120} />
                  <ModalTextarea label="Ensino Central (core_teaching)" value={processed.core_teaching} onChange={v => setProcessed(p => p ? { ...p, core_teaching: v } : p)} placeholder="" max={8000} rows={8} />
                  <ModalField label="Referências Bíblicas (separar por vírgula)" value={processed.bible_references.join(', ')} onChange={v => setProcessed(p => p ? { ...p, bible_references: v.split(',').map(s => s.trim()).filter(Boolean) } : p)} placeholder="Mt 26:26-28, Jo 6:53-56" max={1000} />
                  <ModalTextarea label="Resumo" value={processed.summary} onChange={v => setProcessed(p => p ? { ...p, summary: v } : p)} placeholder="" max={500} rows={2} />
                  <ModalField label="Keywords (separar por vírgula)" value={processed.keywords.join(', ')} onChange={v => setProcessed(p => p ? { ...p, keywords: v.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } : p)} placeholder="eucaristia, presença real, ..." max={500} />
                  <ModalTextarea label="Referências do Catecismo" value={processed.catechism_references} onChange={v => setProcessed(p => p ? { ...p, catechism_references: v } : p)} placeholder="" max={2000} rows={2} />
                  <ModalTextarea label="Referências Patrísticas" value={processed.patristic_references} onChange={v => setProcessed(p => p ? { ...p, patristic_references: v } : p)} placeholder="" max={2000} rows={2} />
                  <ModalTextarea label="Notas Teológicas" value={processed.theology_notes} onChange={v => setProcessed(p => p ? { ...p, theology_notes: v } : p)} placeholder="" max={2000} rows={2} />
                  <ModalTextarea label="Notas da Tradição" value={processed.tradition_notes} onChange={v => setProcessed(p => p ? { ...p, tradition_notes: v } : p)} placeholder="" max={2000} rows={2} />
                </>
              ) : null}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}>
              <button onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                {modalStep === 'form' ? (
                  <button onClick={handleProcess}
                    disabled={processing || !form.titulo || !form.fundamento}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                    style={{
                      background: processing ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                      color: processing ? '#7A7368' : '#0A0A0A',
                      fontFamily: 'Poppins, sans-serif',
                    }}>
                    {processing
                      ? <><div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} /> Processando...</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Processar com IA</>}
                  </button>
                ) : (
                  <>
                    <button onClick={() => setModalStep('form')}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                      <Sparkles className="w-3 h-3" /> Reprocessar
                    </button>
                    <button onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                      style={{
                        background: saving ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                        color: saving ? '#7A7368' : '#0A0A0A',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                      {saving
                        ? <><div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} /> Salvando...</>
                        : <><Save className="w-3.5 h-3.5" /> Salvar</>}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable form components (matching conteudos pattern) ───────
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
