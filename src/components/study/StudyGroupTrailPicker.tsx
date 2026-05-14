'use client'

/**
 * StudyGroupTrailPicker — modal pro dono escolher subtopics pra trilha do grupo.
 *
 * Fluxo: pilar → tópico → subtopic (cascading). O dono pode marcar/desmarcar
 * subtópicos; mudanças são persistidas via RPC ao confirmar.
 */

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Loader2, Plus, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Pillar {
  id: string
  slug: string
  title: string
}
interface Topic {
  id: string
  group_id: string
  slug: string
  title: string
}
interface Subtopic {
  id: string
  topic_id: string
  slug: string
  title: string
  subtitle: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  /** subtopics que já estão na trilha (pra disable + marcar) */
  pickedIds: Set<string>
  onAdd: (subtopicId: string) => Promise<boolean>
  onRemove: (subtopicId: string) => Promise<boolean>
}

export default function StudyGroupTrailPicker({
  open,
  onClose,
  pickedIds,
  onAdd,
  onRemove,
}: Props) {
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [activePillar, setActivePillar] = useState<string | null>(null)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    if (!supabase) return

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    ;(async () => {
      const [pg, tp] = await Promise.all([
        supabase
          .from('content_groups')
          .select('id, slug, title')
          .eq('visible', true)
          .order('sort_order'),
        supabase
          .from('content_topics')
          .select('id, group_id, slug, title')
          .eq('visible', true)
          .order('sort_order'),
      ])
      if (cancelled) return
      const pillarsData = (pg.data ?? []) as Pillar[]
      const topicsData = (tp.data ?? []) as Topic[]
      setPillars(pillarsData)
      setTopics(topicsData)
      if (pillarsData[0]) setActivePillar(pillarsData[0].id)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  // Carrega subtopics quando o tópico ativo muda
  useEffect(() => {
    if (!activeTopic) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubtopics([])
      return
    }
    const supabase = createClient()
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('content_subtopics')
        .select('id, topic_id, slug, title, subtitle')
        .eq('topic_id', activeTopic)
        .eq('visible', true)
        .order('sort_order')
      if (!cancelled) setSubtopics(((data ?? []) as Subtopic[]))
    })()
    return () => {
      cancelled = true
    }
  }, [activeTopic])

  const visibleTopics = useMemo(
    () => topics.filter((t) => t.group_id === activePillar),
    [topics, activePillar],
  )

  const filteredSubtopics = useMemo(() => {
    if (!search.trim()) return subtopics
    const q = search.toLowerCase()
    return subtopics.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.subtitle?.toLowerCase().includes(q) ?? false),
    )
  }, [subtopics, search])

  async function toggle(s: Subtopic) {
    setBusyId(s.id)
    if (pickedIds.has(s.id)) {
      await onRemove(s.id)
    } else {
      await onAdd(s.id)
    }
    setBusyId(null)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] md:h-[640px] flex flex-col"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between p-4 md:p-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {activeTopic ? (
              <button
                onClick={() => setActiveTopic(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5"
                style={{ color: 'var(--text-2)' }}
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
            <div className="min-w-0">
              <h2
                className="text-lg leading-tight"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-elegant)',
                  fontWeight: 500,
                }}
              >
                Trilha do grupo
              </h2>
              <p
                className="text-xs"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                Escolha lições pra guiar o estudo dos membros.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5"
            style={{ color: 'var(--text-2)' }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        ) : !activeTopic ? (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <aside
              className="md:w-56 md:border-r overflow-y-auto p-3 md:p-4 flex-shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <p
                className="text-[11px] mb-2 px-2"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Pilares
              </p>
              <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {pillars.map((p) => {
                  const isActive = p.id === activePillar
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setActivePillar(p.id)}
                        className="text-left text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors w-full"
                        style={{
                          background: isActive ? 'rgba(201,168,76,0.10)' : 'transparent',
                          color: isActive ? 'var(--accent)' : 'var(--text-2)',
                          fontFamily: 'var(--font-body)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {p.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
              {visibleTopics.length === 0 ? (
                <p
                  className="text-sm text-center py-10"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  Sem tópicos visíveis neste pilar.
                </p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleTopics.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveTopic(t.id)}
                        className="w-full text-left p-3 rounded-xl transition-colors hover:bg-white/[0.02]"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          color: 'var(--text-1)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <p className="text-sm leading-snug">{t.title}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div
              className="px-4 md:px-5 py-3 border-b flex items-center gap-2"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <Search
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'var(--text-3)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar lição…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
            <ul className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {filteredSubtopics.map((s) => {
                const picked = pickedIds.has(s.id)
                const busy = busyId === s.id
                return (
                  <li key={s.id} className="px-4 md:px-5 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm leading-snug"
                        style={{
                          color: 'var(--text-1)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {s.title}
                      </p>
                      {s.subtitle ? (
                        <p
                          className="text-xs mt-0.5 line-clamp-1"
                          style={{
                            color: 'var(--text-3)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {s.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => toggle(s)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs flex-shrink-0 transition-colors disabled:opacity-50"
                      style={{
                        background: picked
                          ? 'rgba(106,170,98,0.10)'
                          : 'rgba(201,168,76,0.10)',
                        border: picked
                          ? '1px solid rgba(106,170,98,0.30)'
                          : '1px solid rgba(201,168,76,0.30)',
                        color: picked ? 'var(--success)' : 'var(--accent)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : picked ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {picked ? 'Na trilha' : 'Adicionar'}
                    </button>
                  </li>
                )
              })}
              {filteredSubtopics.length === 0 ? (
                <li
                  className="px-4 py-10 text-sm text-center"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  Nada encontrado.
                </li>
              ) : null}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
