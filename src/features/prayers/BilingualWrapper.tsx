'use client'

import { useLatin } from './LatinContext'

/**
 * Client wrapper que alterna entre o subtree PT e o LA conforme
 * o estado do LatinContext. Ambos os subtrees são renderizados no
 * server (via RSC payload) e passados como children props — o
 * wrapper só decide qual mostrar.
 *
 * Se `la` for null (oração sem latim), sempre mostra `pt`.
 */
export default function BilingualWrapper({
  pt,
  la,
  hasLatin,
}: {
  pt: React.ReactNode
  la: React.ReactNode | null
  hasLatin: boolean
}) {
  const { latin } = useLatin()
  if (!hasLatin || !la) return <>{pt}</>
  return <>{latin ? la : pt}</>
}
