'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Catálogo de referências que o construtor de regras precisa: a hierarquia de
// estudos (grupo → tópico → subtópico) e os quizzes publicados. Carregado uma
// vez e reutilizado por todos os seletores do RuleBuilder.

export interface CatalogoSubtopico {
  id: string
  title: string
}
export interface CatalogoTopico {
  id: string
  title: string
  subtopicos: CatalogoSubtopico[]
}
export interface CatalogoGrupo {
  id: string
  slug: string
  title: string
  topicos: CatalogoTopico[]
}
export interface CatalogoQuiz {
  content_ref: string
  title: string
}

export interface CodexCatalogo {
  grupos: CatalogoGrupo[]
  quizzes: CatalogoQuiz[]
  loading: boolean
  error: string | null
}

interface RawGrupo {
  id: string
  slug: string
  title: string
  sort_order: number | null
  content_topics:
    | {
        id: string
        title: string
        sort_order: number | null
        content_subtopics:
          | { id: string; title: string; sort_order: number | null }[]
          | null
      }[]
    | null
}

export function useCodexCatalogo(): CodexCatalogo {
  const [grupos, setGrupos] = useState<CatalogoGrupo[]>([])
  const [quizzes, setQuizzes] = useState<CatalogoQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    queueMicrotask(async () => {
      try {
        const [gruposRes, quizzesRes] = await Promise.all([
          supabase
            .from('content_groups')
            .select(
              'id, slug, title, sort_order, content_topics(id, title, sort_order, content_subtopics(id, title, sort_order))',
            )
            .order('sort_order'),
          supabase
            .from('study_quizzes')
            .select('content_ref, title')
            .order('title'),
        ])

        if (gruposRes.error) throw gruposRes.error

        const ordenado = ((gruposRes.data as RawGrupo[] | null) ?? []).map(
          (g) => ({
            id: g.id,
            slug: g.slug,
            title: g.title,
            topicos: (g.content_topics ?? [])
              .slice()
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((t) => ({
                id: t.id,
                title: t.title,
                subtopicos: (t.content_subtopics ?? [])
                  .slice()
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((s) => ({ id: s.id, title: s.title })),
              })),
          }),
        )
        setGrupos(ordenado)
        setQuizzes((quizzesRes.data as CatalogoQuiz[] | null) ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar catálogo')
      } finally {
        setLoading(false)
      }
    })
  }, [])

  return { grupos, quizzes, loading, error }
}
