import type { StudyNextHint } from './types'

export interface PillarSequenceEntry {
  ref: string
  title: string
  href: string
}

export function computeNext(
  sequence: PillarSequenceEntry[],
  currentRef: string,
  pillarHubHref: string,
): StudyNextHint | null {
  const idx = sequence.findIndex((s) => s.ref === currentRef)
  if (idx < 0) return null
  if (idx >= sequence.length - 1) {
    return {
      label: 'Pilar concluído — ver outros estudos',
      href: pillarHubHref,
      isPillarComplete: true,
    }
  }
  const next = sequence[idx + 1]
  return {
    label: `Próximo: ${next.title}`,
    href: next.href,
    isPillarComplete: false,
  }
}
