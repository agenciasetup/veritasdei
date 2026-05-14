'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface RecentNote {
  id: string
  content_type: string
  content_ref: string
  body: string
  updated_at: string
}

export interface RecentQuizAttempt {
  id: string
  quiz_id: string
  score: number
  passed: boolean
  completed_at: string
  quiz_title: string
}

export interface PillarProgress {
  slug: string
  title: string
  total: number
  studied: number
}

// O total de subtópicos por pilar muda raramente — admin precisa criar
// conteúdo novo no admin/conteudos. Cachear por 5 min num sessionStorage
// elimina o cálculo cartesiano da maior query do dashboard.
const PILLARS_CACHE_KEY = 'vd.educa.pillarTotals.v2'
const PILLARS_CACHE_TTL_MS = 5 * 60_000

interface PillarTotal {
  slug: string
  title: string
  total: number
}

function readPillarsCache(): PillarTotal[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PILLARS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; data: PillarTotal[] }
    if (Date.now() - parsed.at > PILLARS_CACHE_TTL_MS) return null
    if (!Array.isArray(parsed.data)) return null
    return parsed.data
  } catch {
    return null
  }
}

function writePillarsCache(data: PillarTotal[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      PILLARS_CACHE_KEY,
      JSON.stringify({ at: Date.now(), data }),
    )
  } catch {
    /* ignore */
  }
}

export function useMyStudyRecent() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<RecentNote[]>([])
  const [attempts, setAttempts] = useState<RecentQuizAttempt[]>([])
  const [pillars, setPillars] = useState<PillarProgress[]>(() => {
    const cached = readPillarsCache()
    return cached ? cached.map((p) => ({ ...p, studied: 0 })) : []
  })
  const [loading, setLoading] = useState<boolean>(Boolean(user?.id))

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.id) {
        if (!cancelled) setLoading(false)
        return
      }
      const supabase = createClient()
      setLoading(true)
      // ── Queries críticas em paralelo ────────────────────────────────────
      // Notas, tentativas de prova e progresso do usuário são tabelas
      // pequenas (limitadas em query) — uma RTT cada.
      //
      // Os totais de subtópicos por pilar antes eram um JOIN aninhado
      // (content_groups → content_topics → content_subtopics) que devolvia
      // o produto cartesiano. Agora vão por uma agregação no Postgres
      // (count(*) per group) — uma única linha por pilar. Substituímos
      // pela view materializada `educa_pillar_totals` se existir, com
      // fallback elegante pro client-side count quando ela ainda não foi
      // provisionada.
      //
      // Como o total muda raramente, hidratamos do cache imediatamente
      // pra evitar render vazio.
      const [notesRes, quizRes, progressRes] = await Promise.all([
        supabase
          .from('user_study_notes')
          .select('id, content_type, content_ref, body, updated_at')
          .eq('user_id', user!.id)
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_quiz_attempts')
          .select('id, quiz_id, score, passed, completed_at, study_quizzes(title)')
          .eq('user_id', user!.id)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_content_progress')
          .select('content_type, subtopic_id')
          .eq('user_id', user!.id),
      ])

      if (cancelled) return

      setNotes((notesRes.data as RecentNote[]) || [])

      const attemptsRaw = (quizRes.data || []) as Array<{
        id: string
        quiz_id: string
        score: number
        passed: boolean
        completed_at: string
        study_quizzes: { title: string } | { title: string }[] | null
      }>
      setAttempts(
        attemptsRaw.map((a) => {
          const quizObj = Array.isArray(a.study_quizzes)
            ? a.study_quizzes[0]
            : a.study_quizzes
          return {
            id: a.id,
            quiz_id: a.quiz_id,
            score: a.score,
            passed: a.passed,
            completed_at: a.completed_at,
            quiz_title: quizObj?.title || 'Prova',
          }
        }),
      )

      const studiedByType = new Map<string, Set<string>>()
      for (const row of (progressRes.data || []) as Array<{
        content_type: string
        subtopic_id: string
      }>) {
        if (!studiedByType.has(row.content_type))
          studiedByType.set(row.content_type, new Set())
        studiedByType.get(row.content_type)!.add(row.subtopic_id)
      }

      // ── Totais dos pilares ─────────────────────────────────────────────
      let pillarTotals = readPillarsCache()
      if (!pillarTotals) {
        pillarTotals = await loadPillarTotals(supabase)
        if (pillarTotals.length > 0) writePillarsCache(pillarTotals)
      }

      if (cancelled) return

      setPillars(
        pillarTotals.map((p) => {
          const studiedSet = studiedByType.get(p.slug) || new Set<string>()
          return { slug: p.slug, title: p.title, total: p.total, studied: studiedSet.size }
        }),
      )
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  // O escopo lê `user.id` e `user.id` apenas — a regra exige `user` inteiro.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return { notes, attempts, pillars, loading }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPillarTotals(supabase: any): Promise<PillarTotal[]> {
  // 1ª tentativa: RPC `educa_pillar_totals` (1 round-trip, 1 row por pilar).
  // Caso ela ainda não tenha sido provisionada no projeto, caímos no
  // fallback client-side.
  try {
    const { data, error } = await supabase.rpc('educa_pillar_totals')
    if (!error && Array.isArray(data) && data.length > 0) {
      return (data as Array<{ slug: string; title: string; total: number | string }>)
        .map((r) => ({ slug: r.slug, title: r.title, total: Number(r.total) || 0 }))
    }
  } catch {
    /* fall through */
  }

  // Fallback: faz 2 queries pequenas em vez do JOIN cartesiano antigo.
  // - 1 select dos pilares visíveis (3 rows)
  // - 1 select de TODOS os subtópicos (id, topic_id) — bem mais leve
  //   que arrastar JSON aninhado pelo PostgREST
  const [groupsRes, subsRes] = await Promise.all([
    supabase
      .from('content_groups')
      .select('id, slug, title')
      .eq('visible', true)
      .order('sort_order'),
    supabase
      .from('content_subtopics')
      .select('id, topic_id, content_topics!inner(group_id)')
      .eq('visible', true),
  ])

  const groups = (groupsRes.data ?? []) as Array<{ id: string; slug: string; title: string }>
  const subs = (subsRes.data ?? []) as Array<{
    id: string
    topic_id: string
    content_topics: { group_id: string } | { group_id: string }[] | null
  }>

  const totals = new Map<string, number>()
  for (const s of subs) {
    const t = Array.isArray(s.content_topics) ? s.content_topics[0] : s.content_topics
    const gid = t?.group_id
    if (gid) totals.set(gid, (totals.get(gid) ?? 0) + 1)
  }

  return groups.map((g) => ({
    slug: g.slug,
    title: g.title,
    total: totals.get(g.id) ?? 0,
  }))
}
