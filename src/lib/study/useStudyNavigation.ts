'use client'

import { useMemo } from 'react'
import type { PillarTreeNode } from './usePillarTree'
import type { StudyNextHint } from './types'

export interface StudyNavigationState {
  prev: StudyNextHint | null
  next: StudyNextHint | null
  /** Posição 1-based do subtópico atual na sequência do pilar (0 se não encontrado) */
  currentIndex: number
  /** Total de subtópicos em todo o pilar */
  totalInPillar: number
}

interface Flat {
  topicSlug: string
  topicTitle: string
  subtopicSlug: string
  subtopicTitle: string
  href: string
}

/**
 * Constrói a sequência linear "aula a aula" do pilar inteiro e calcula
 * prev/next considerando atravessar fronteiras de tópico. Quando o usuário
 * termina o último subtópico de um tópico, o "próximo" aponta para o
 * primeiro subtópico do tópico seguinte — não volta ao hub do pilar (que
 * era o comportamento do computeNext original).
 */
export function useStudyNavigation(
  pillarSlug: string,
  tree: PillarTreeNode[],
  topicSlug: string | undefined,
  subtopicSlug: string | undefined,
): StudyNavigationState {
  return useMemo(() => {
    const flat: Flat[] = []
    for (const topic of tree) {
      for (const sub of topic.subtopics) {
        flat.push({
          topicSlug: topic.slug,
          topicTitle: topic.title,
          subtopicSlug: sub.slug,
          subtopicTitle: sub.title,
          href: `/estudo/${pillarSlug}/${topic.slug}/${sub.slug}`,
        })
      }
    }

    const total = flat.length
    if (!topicSlug || !subtopicSlug || total === 0) {
      return { prev: null, next: null, currentIndex: 0, totalInPillar: total }
    }

    const idx = flat.findIndex(
      (f) => f.topicSlug === topicSlug && f.subtopicSlug === subtopicSlug,
    )

    if (idx < 0) {
      return { prev: null, next: null, currentIndex: 0, totalInPillar: total }
    }

    const prev: StudyNextHint | null =
      idx > 0
        ? { label: flat[idx - 1].subtopicTitle, href: flat[idx - 1].href }
        : null

    const next: StudyNextHint | null =
      idx < total - 1
        ? { label: flat[idx + 1].subtopicTitle, href: flat[idx + 1].href }
        : {
            label: 'Pilar concluído',
            href: `/estudo/${pillarSlug}`,
            isPillarComplete: true,
          }

    return { prev, next, currentIndex: idx + 1, totalInPillar: total }
  }, [pillarSlug, tree, topicSlug, subtopicSlug])
}
