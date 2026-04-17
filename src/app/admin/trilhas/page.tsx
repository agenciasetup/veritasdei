'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap, Plus, Pencil, Trash2, Eye, EyeOff,
  Save, X, ChevronDown, ChevronUp, GripVertical, Link2, FileText, Download,
  MoreVertical,
} from 'lucide-react'
import BottomSheet from '@/components/mobile/BottomSheet'
import { WIPE_CONFIRM_HEADER, WIPE_CONFIRM_VALUE } from '@/lib/api/seed-wipe'

interface Trail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  difficulty: string
  color: string
  icon_name: string
  sort_order: number
  visible: boolean
}

interface TrailStep {
  id: string
  trail_id: string
  label: string
  description: string | null
  content_subtopic_id: string | null
  custom_content: string | null
  sort_order: number
}

interface ContentGroup { id: string; title: string }
interface ContentTopic { id: string; group_id: string; title: string }
interface ContentSubtopic { id: string; topic_id: string; title: string; description: string | null }

const DIFFICULTY_OPTIONS = ['Iniciante', 'Intermediário', 'Avançado']
const COLOR_OPTIONS = ['#C9A84C', '#8B3145', '#4A7C59', '#5B6FA9', '#A85C3C', '#7B5EA7']
const ICON_OPTIONS = ['GraduationCap', 'Droplets', 'Church', 'Heart', 'Shield', 'Flame', 'Crown', 'Star', 'Sparkles', 'ScrollText', 'BookOpen', 'Globe']

export default function AdminTrilhasPage() {
  const supabase = createClient()

  // Trails list
  const [trails, setTrails] = useState<Trail[]>([])
  const [loading, setLoading] = useState(true)

  // Edit trail modal
  const [editingTrail, setEditingTrail] = useState<Partial<Trail> | null>(null)
  const [trailMode, setTrailMode] = useState<'create' | 'edit'>('create')
  const [saving, setSaving] = useState(false)

  // Steps management
  const [expandedTrailId, setExpandedTrailId] = useState<string | null>(null)
  const [steps, setSteps] = useState<TrailStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(false)

  // Step editor
  const [editingStep, setEditingStep] = useState<Partial<TrailStep> | null>(null)
  const [stepMode, setStepMode] = useState<'create' | 'edit'>('create')

  // Content picker
  const [contentGroups, setContentGroups] = useState<ContentGroup[]>([])
  const [contentTopics, setContentTopics] = useState<ContentTopic[]>([])
  const [contentSubtopics, setContentSubtopics] = useState<ContentSubtopic[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  // Mobile action menus
  const [trailActions, setTrailActions] = useState<Trail | null>(null)
  const [stepActions, setStepActions] = useState<TrailStep | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')

  // Seed state
  const [seedingTrails, setSeedingTrails] = useState(false)
  const [seedMsg, setSeedMsg] = useState<string | null>(null)

  // Ensure tables exist
  const [tablesReady, setTablesReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const ensureTables = useCallback(async () => {
    if (!supabase) return
    // Try to query trails table; if it fails, we need to create it
    const { error } = await supabase.from('trails').select('id').limit(1)
    if (error && error.code === '42P01') {
      setInitError('As tabelas de trilhas ainda não existem. Execute o SQL de migração no Supabase.')
      return
    }
    setTablesReady(true)
  }, [supabase])

  useEffect(() => { ensureTables() }, [ensureTables])

  const fetchTrails = useCallback(async () => {
    if (!supabase || !tablesReady) return
    setLoading(true)
    const { data } = await supabase.from('trails').select('*').order('sort_order')
    setTrails((data as Trail[]) ?? [])
    setLoading(false)
  }, [supabase, tablesReady])

  useEffect(() => { fetchTrails() }, [fetchTrails])

  const fetchSteps = useCallback(async (trailId: string) => {
    if (!supabase) return
    setStepsLoading(true)
    const { data } = await supabase
      .from('trail_steps')
      .select('*')
      .eq('trail_id', trailId)
      .order('sort_order')
    setSteps((data as TrailStep[]) ?? [])
    setStepsLoading(false)
  }, [supabase])

  // Load content groups for picker
  useEffect(() => {
    if (!supabase) return
    supabase.from('content_groups').select('id, title').order('sort_order').then(({ data }: { data: ContentGroup[] | null }) => {
      setContentGroups(data ?? [])
    })
  }, [supabase])

  useEffect(() => {
    if (!supabase || !selectedGroupId) { setContentTopics([]); return }
    supabase.from('content_topics').select('id, group_id, title').eq('group_id', selectedGroupId).order('sort_order').then(({ data }: { data: ContentTopic[] | null }) => {
      setContentTopics(data ?? [])
    })
  }, [supabase, selectedGroupId])

  useEffect(() => {
    if (!supabase || !selectedTopicId) { setContentSubtopics([]); return }
    supabase.from('content_subtopics').select('id, topic_id, title, description').eq('topic_id', selectedTopicId).order('sort_order').then(({ data }: { data: ContentSubtopic[] | null }) => {
      setContentSubtopics(data ?? [])
    })
  }, [supabase, selectedTopicId])

  // Trail CRUD
  const handleSaveTrail = async () => {
    if (!supabase || !editingTrail) return
    setSaving(true)
    const payload = {
      title: editingTrail.title || '',
      subtitle: editingTrail.subtitle || null,
      description: editingTrail.description || null,
      difficulty: editingTrail.difficulty || 'Iniciante',
      color: editingTrail.color || '#C9A84C',
      icon_name: editingTrail.icon_name || 'GraduationCap',
      sort_order: editingTrail.sort_order ?? 0,
      visible: editingTrail.visible ?? true,
    }
    if (trailMode === 'create') {
      await supabase.from('trails').insert(payload)
    } else {
      await supabase.from('trails').update(payload).eq('id', editingTrail.id)
    }
    setSaving(false)
    setEditingTrail(null)
    fetchTrails()
  }

  const handleDeleteTrail = async (id: string) => {
    if (!supabase || !confirm('Deletar trilha e todas as etapas?')) return
    await supabase.from('trails').delete().eq('id', id)
    if (expandedTrailId === id) setExpandedTrailId(null)
    fetchTrails()
  }

  const handleToggleTrailVisible = async (id: string, current: boolean) => {
    if (!supabase) return
    await supabase.from('trails').update({ visible: !current }).eq('id', id)
    fetchTrails()
  }

  const handleSeedTrails = async () => {
    if (!confirm('Importar as trilhas padrão? Isso SUBSTITUI todas as trilhas existentes (apaga + reimporta).')) return
    // Segunda confirmação textual — reduz clique acidental em operação destrutiva.
    const typed = prompt('Para confirmar, digite APAGAR:')
    if (typed !== 'APAGAR') {
      setSeedMsg('Operação cancelada.')
      return
    }
    setSeedingTrails(true)
    setSeedMsg(null)
    try {
      // Header de confirmação é exigido pelo servidor quando já existem
      // trails (DELETE implícito antes do re-insert).
      const res = await fetch('/api/admin/seed?trails=true', {
        method: 'POST',
        headers: { [WIPE_CONFIRM_HEADER]: WIPE_CONFIRM_VALUE },
      })
      const data = await res.json()
      setSeedMsg(data.message || data.error || 'Erro desconhecido')
      if (data.success) fetchTrails()
      if (data.sql) setSeedMsg(data.error + '\n\nVeja o SQL necessário no console.')
    } catch {
      setSeedMsg('Erro de rede')
    }
    setSeedingTrails(false)
  }

  // Step CRUD
  const handleSaveStep = async () => {
    if (!supabase || !editingStep || !expandedTrailId) return
    setSaving(true)
    const payload = {
      trail_id: expandedTrailId,
      label: editingStep.label || '',
      description: editingStep.description || null,
      content_subtopic_id: editingStep.content_subtopic_id || null,
      custom_content: editingStep.custom_content || null,
      sort_order: editingStep.sort_order ?? 0,
    }
    if (stepMode === 'create') {
      await supabase.from('trail_steps').insert(payload)
    } else {
      await supabase.from('trail_steps').update(payload).eq('id', editingStep.id)
    }
    setSaving(false)
    setEditingStep(null)
    fetchSteps(expandedTrailId)
  }

  const handleDeleteStep = async (id: string) => {
    if (!supabase || !expandedTrailId || !confirm('Deletar etapa?')) return
    await supabase.from('trail_steps').delete().eq('id', id)
    fetchSteps(expandedTrailId)
  }

  const toggleExpand = (trailId: string) => {
    if (expandedTrailId === trailId) {
      setExpandedTrailId(null)
    } else {
      setExpandedTrailId(trailId)
      fetchSteps(trailId)
    }
  }

  if (initError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-5 h-5" style={{ color: '#C9A84C' }} />
          <h1 className="text-lg font-bold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            Trilhas de Aprendizado
          </h1>
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'rgba(217,79,92,0.08)', border: '1px solid rgba(217,79,92,0.2)' }}>
          <p className="text-sm mb-4" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>{initError}</p>
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap" style={{ color: '#B8AFA2', fontFamily: 'monospace' }}>{`-- Execute no Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  difficulty TEXT DEFAULT 'Iniciante',
  color TEXT DEFAULT '#C9A84C',
  icon_name TEXT DEFAULT 'GraduationCap',
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trail_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  content_subtopic_id UUID REFERENCES content_subtopics(id) ON DELETE SET NULL,
  custom_content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read trails" ON trails FOR SELECT USING (visible = true);
CREATE POLICY "Admin manage trails" ON trails FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public read trail_steps" ON trail_steps FOR SELECT USING (true);
CREATE POLICY "Admin manage trail_steps" ON trail_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);`}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5" style={{ color: '#C9A84C' }} />
          <h1 className="text-lg font-bold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            Trilhas de Aprendizado
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSeedTrails} disabled={seedingTrails}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif', opacity: seedingTrails ? 0.5 : 1 }}>
            {seedingTrails ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} /> : <Download className="w-4 h-4" />}
            {seedingTrails ? 'Importando...' : 'Importar Trilhas Padrão'}
          </button>
          <button onClick={() => { setEditingTrail({ title: '', difficulty: 'Iniciante', color: '#C9A84C', icon_name: 'GraduationCap', sort_order: 0, visible: true }); setTrailMode('create') }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}>
            <Plus className="w-4 h-4" /> Nova Trilha
          </button>
        </div>
      </div>

      {/* Seed message */}
      {seedMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: seedMsg.includes('sucesso') ? 'rgba(76,175,80,0.1)' : 'rgba(217,79,92,0.1)', border: seedMsg.includes('sucesso') ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(217,79,92,0.2)', color: seedMsg.includes('sucesso') ? '#66BB6A' : '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
          {seedMsg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      )}

      {/* Trail list */}
      {!loading && trails.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(16,16,16,0.5)', border: '1px solid rgba(201,168,76,0.08)' }}>
          <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: '#7A7368', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>Nenhuma trilha criada</p>
        </div>
      )}

      {!loading && trails.map((trail) => (
        <div key={trail.id} className="mb-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl group"
            style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.08)', opacity: trail.visible ? 1 : 0.5 }}>
            <GripVertical className="w-4 h-4 flex-shrink-0 opacity-30" style={{ color: '#7A7368' }} />
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: trail.color }} />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(trail.id)}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>{trail.title}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>{trail.difficulty}</span>
              </div>
              {trail.subtitle && <p className="text-xs" style={{ color: '#7A7368' }}>{trail.subtitle}</p>}
            </div>
            <button onClick={() => toggleExpand(trail.id)}
              className="p-2 rounded-lg touch-target active:scale-95"
              style={{ color: '#8A8378' }}
              aria-label={expandedTrailId === trail.id ? 'Recolher' : 'Expandir'}>
              {expandedTrailId === trail.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleToggleTrailVisible(trail.id, trail.visible)} className="p-1.5 rounded-lg" style={{ color: '#7A7368' }}>
                {trail.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setEditingTrail(trail); setTrailMode('edit') }} className="p-1.5 rounded-lg" style={{ color: '#7A7368' }}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDeleteTrail(trail.id)} className="p-1.5 rounded-lg" style={{ color: '#D94F5C' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile [⋮] */}
            <button onClick={() => setTrailActions(trail)}
              className="md:hidden flex items-center justify-center rounded-lg active:scale-95 touch-target-lg"
              style={{ color: '#8A8378', width: 40, height: 40 }}
              aria-label="Mais ações">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded Steps */}
          {expandedTrailId === trail.id && (
            <div className="ml-6 mt-2 space-y-2">
              {stepsLoading && (
                <div className="p-4 text-center">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin mx-auto"
                    style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
                </div>
              )}

              {!stepsLoading && steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg group"
                  style={{ background: 'rgba(20,18,14,0.5)', border: '1px solid rgba(201,168,76,0.06)' }}>
                  <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${trail.color}20`, color: trail.color, fontFamily: 'Cinzel, serif' }}>
                    {step.sort_order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>{step.label}</p>
                    {step.description && <p className="text-xs" style={{ color: '#7A7368' }}>{step.description}</p>}
                    {step.content_subtopic_id && (
                      <span className="inline-flex items-center gap-1 text-[10px] mt-1" style={{ color: '#C9A84C' }}>
                        <Link2 className="w-3 h-3" /> Vinculado a conteúdo
                      </span>
                    )}
                    {step.custom_content && !step.content_subtopic_id && (
                      <span className="inline-flex items-center gap-1 text-[10px] mt-1" style={{ color: '#7A7368' }}>
                        <FileText className="w-3 h-3" /> Conteúdo personalizado
                      </span>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => {
                      setEditingStep(step)
                      setStepMode('edit')
                      if (step.content_subtopic_id) {
                        setSelectedGroupId('')
                        setSelectedTopicId('')
                      }
                    }} className="p-1 rounded" style={{ color: '#7A7368' }}>
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteStep(step.id)} className="p-1 rounded" style={{ color: '#D94F5C' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <button onClick={() => setStepActions(step)}
                    className="md:hidden flex items-center justify-center rounded-lg active:scale-95 touch-target-lg"
                    style={{ color: '#8A8378', width: 36, height: 36 }}
                    aria-label="Ações da etapa">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {!stepsLoading && (
                <button onClick={() => {
                  setEditingStep({ label: '', description: '', sort_order: steps.length + 1, custom_content: '', content_subtopic_id: null })
                  setStepMode('create')
                  setSelectedGroupId('')
                  setSelectedTopicId('')
                }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                  style={{ color: '#C9A84C', border: '1px dashed rgba(201,168,76,0.2)', fontFamily: 'Poppins, sans-serif' }}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Trail Edit Modal */}
      {editingTrail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                {trailMode === 'create' ? 'Nova Trilha' : 'Editar Trilha'}
              </h2>
              <button onClick={() => setEditingTrail(null)} className="p-1" style={{ color: '#7A7368' }}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <FieldInput label="Título" value={editingTrail.title || ''} onChange={v => setEditingTrail({ ...editingTrail, title: v })} placeholder="Nome da trilha" />
              <FieldInput label="Subtítulo" value={editingTrail.subtitle || ''} onChange={v => setEditingTrail({ ...editingTrail, subtitle: v })} placeholder="Resumo curto" />
              <FieldTextarea label="Descrição" value={editingTrail.description || ''} onChange={v => setEditingTrail({ ...editingTrail, description: v })} placeholder="Descrição detalhada" rows={3} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Dificuldade</label>
                  <select value={editingTrail.difficulty || 'Iniciante'} onChange={e => setEditingTrail({ ...editingTrail, difficulty: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}>
                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d} style={{ background: '#0A0A0A' }}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Ordem</label>
                  <input type="number" value={editingTrail.sort_order ?? 0} onChange={e => setEditingTrail({ ...editingTrail, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setEditingTrail({ ...editingTrail, color: c })}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{ background: c, border: editingTrail.color === c ? '2px solid #F2EDE4' : '2px solid transparent', opacity: editingTrail.color === c ? 1 : 0.5 }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Ícone</label>
                <select value={editingTrail.icon_name || 'GraduationCap'} onChange={e => setEditingTrail({ ...editingTrail, icon_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}>
                  {ICON_OPTIONS.map(i => <option key={i} value={i} style={{ background: '#0A0A0A' }}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
              <button onClick={() => setEditingTrail(null)} className="px-4 py-2.5 rounded-xl text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>Cancelar</button>
              <button onClick={handleSaveTrail} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: saving ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)', color: saving ? '#7A7368' : '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}>
                <Save className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Edit Modal */}
      {editingStep && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                {stepMode === 'create' ? 'Nova Etapa' : 'Editar Etapa'}
              </h2>
              <button onClick={() => setEditingStep(null)} className="p-1" style={{ color: '#7A7368' }}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <FieldInput label="Título da Etapa" value={editingStep.label || ''} onChange={v => setEditingStep({ ...editingStep, label: v })} placeholder="Ex: Os Dez Mandamentos" />
              <FieldInput label="Descrição" value={editingStep.description || ''} onChange={v => setEditingStep({ ...editingStep, description: v })} placeholder="Resumo curto da etapa" />

              <div>
                <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>Ordem</label>
                <input type="number" value={editingStep.sort_order ?? 0} onChange={e => setEditingStep({ ...editingStep, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
              </div>

              {/* Content source selector */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(10,10,10,0.4)', border: '1px solid rgba(201,168,76,0.08)' }}>
                <p className="text-[10px] mb-3 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                  Vincular a Conteúdo Existente (opcional)
                </p>

                <div className="space-y-3">
                  <select value={selectedGroupId} onChange={e => { setSelectedGroupId(e.target.value); setSelectedTopicId(''); setEditingStep({ ...editingStep, content_subtopic_id: null }) }}
                    className="w-full px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}>
                    <option value="" style={{ background: '#0A0A0A' }}>Selecione um grupo...</option>
                    {contentGroups.map(g => <option key={g.id} value={g.id} style={{ background: '#0A0A0A' }}>{g.title}</option>)}
                  </select>

                  {contentTopics.length > 0 && (
                    <select value={selectedTopicId} onChange={e => { setSelectedTopicId(e.target.value); setEditingStep({ ...editingStep, content_subtopic_id: null }) }}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}>
                      <option value="" style={{ background: '#0A0A0A' }}>Selecione um tópico...</option>
                      {contentTopics.map(t => <option key={t.id} value={t.id} style={{ background: '#0A0A0A' }}>{t.title}</option>)}
                    </select>
                  )}

                  {contentSubtopics.length > 0 && (
                    <select value={editingStep.content_subtopic_id || ''} onChange={e => setEditingStep({ ...editingStep, content_subtopic_id: e.target.value || null })}
                      className="w-full px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}>
                      <option value="" style={{ background: '#0A0A0A' }}>Selecione um subtópico...</option>
                      {contentSubtopics.map(s => <option key={s.id} value={s.id} style={{ background: '#0A0A0A' }}>{s.title}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <FieldTextarea label="Conteúdo Personalizado (se não vinculado)" value={editingStep.custom_content || ''} onChange={v => setEditingStep({ ...editingStep, custom_content: v })} placeholder="Texto da etapa..." rows={6} />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
              <button onClick={() => setEditingStep(null)} className="px-4 py-2.5 rounded-xl text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>Cancelar</button>
              <button onClick={handleSaveStep} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: saving ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)', color: saving ? '#7A7368' : '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}>
                <Save className="w-4 h-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile actions — trilha */}
      <BottomSheet
        open={trailActions !== null}
        onDismiss={() => setTrailActions(null)}
        detents={[0.42]}
        initialDetent={0}
        label="Ações da trilha"
      >
        {trailActions && (
          <div className="pt-2 pb-6">
            <h3 className="text-base font-semibold mb-3 truncate"
              style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}>
              {trailActions.title}
            </h3>
            <div className="flex flex-col gap-1">
              <TrailActionRow
                icon={<Pencil className="w-4 h-4" style={{ color: '#C9A84C' }} />}
                label="Editar trilha"
                onClick={() => {
                  setEditingTrail(trailActions)
                  setTrailMode('edit')
                  setTrailActions(null)
                }}
              />
              <TrailActionRow
                icon={trailActions.visible
                  ? <EyeOff className="w-4 h-4" style={{ color: '#8A8378' }} />
                  : <Eye className="w-4 h-4" style={{ color: '#C9A84C' }} />}
                label={trailActions.visible ? 'Ocultar' : 'Mostrar'}
                onClick={() => {
                  handleToggleTrailVisible(trailActions.id, trailActions.visible)
                  setTrailActions(null)
                }}
              />
              <TrailActionRow
                icon={<Trash2 className="w-4 h-4" style={{ color: '#D94F5C' }} />}
                label="Excluir trilha"
                danger
                onClick={() => {
                  const id = trailActions.id
                  setTrailActions(null)
                  handleDeleteTrail(id)
                }}
              />
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Mobile actions — etapa */}
      <BottomSheet
        open={stepActions !== null}
        onDismiss={() => setStepActions(null)}
        detents={[0.32]}
        initialDetent={0}
        label="Ações da etapa"
      >
        {stepActions && (
          <div className="pt-2 pb-6">
            <h3 className="text-base font-semibold mb-3 truncate"
              style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}>
              {stepActions.label}
            </h3>
            <div className="flex flex-col gap-1">
              <TrailActionRow
                icon={<Pencil className="w-4 h-4" style={{ color: '#C9A84C' }} />}
                label="Editar etapa"
                onClick={() => {
                  setEditingStep(stepActions)
                  setStepMode('edit')
                  setSelectedGroupId('')
                  setSelectedTopicId('')
                  setStepActions(null)
                }}
              />
              <TrailActionRow
                icon={<Trash2 className="w-4 h-4" style={{ color: '#D94F5C' }} />}
                label="Excluir etapa"
                danger
                onClick={() => {
                  const id = stepActions.id
                  setStepActions(null)
                  handleDeleteStep(id)
                }}
              />
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function TrailActionRow({ icon, label, onClick, danger }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-left active:scale-[0.98] touch-target-lg"
      style={{
        background: danger ? 'rgba(217,79,92,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${danger ? 'rgba(217,79,92,0.18)' : 'rgba(201,168,76,0.08)'}`,
        color: danger ? '#D94F5C' : '#F2EDE4',
        fontFamily: 'Poppins, sans-serif',
      }}>
      <span className="w-6 flex items-center justify-center">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

// ─── Shared field components ───
function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows: number }) {
  return (
    <div>
      <label className="block text-[10px] mb-1.5 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
        style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }} />
    </div>
  )
}
