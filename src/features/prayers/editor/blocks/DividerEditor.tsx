'use client'

/**
 * Divisor ornamental não tem conteúdo editável — só renderiza
 * o visual pro admin ver como vai ficar.
 */
export default function DividerEditor() {
  return <div className="ornament-divider my-2" aria-hidden />
}
