'use client'

import { useEffect, useMemo, useRef } from 'react'
import type {
  HighlightColor,
  LessonHighlight,
} from '@/lib/study/useLessonHighlights'

export interface SelectionInfo {
  itemId: string
  charStart: number
  charEnd: number
  /** Bounding rect da seleção em coordenadas de viewport. Usado para
   *  posicionar o popover (ancora no topo central da seleção). */
  rect: DOMRect
  text: string
}

interface Props {
  itemId: string
  text: string
  highlights?: LessonHighlight[]
  onSelect?: (info: SelectionInfo) => void
  onHighlightClick?: (highlight: LessonHighlight) => void
  className?: string
  style?: React.CSSProperties
}

/** Cores semânticas dos marcadores. Aplicadas como background com transparência
 *  pra não competir com o texto. As cores espelham a paleta do app. */
const COLOR_BG: Record<HighlightColor, string> = {
  gold: 'rgba(201,168,76,0.28)',
  wine: 'rgba(139,49,69,0.32)',
  sage: 'rgba(139,181,139,0.25)',
  sky: 'rgba(143,180,217,0.25)',
  plain: 'rgba(242,237,228,0.16)',
}

/**
 * Renderiza texto pleno como uma sequência de segmentos com <mark> nos
 * trechos cobertos por highlights. Detecta seleção do usuário e dispara
 * `onSelect` com o offset relativo ao `text` original.
 *
 * Importante: o `text` é a fonte da verdade — segmentos são derivados.
 * O componente assume que `text` é texto puro (sem HTML).
 */
export default function HighlightableText({
  itemId,
  text,
  highlights,
  onSelect,
  onHighlightClick,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  const segments = useMemo(
    () => buildSegments(text, highlights ?? []),
    [text, highlights],
  )

  useEffect(() => {
    if (!onSelect) return
    const container = ref.current
    if (!container) return

    // Usamos mouseup/touchend pra capturar a seleção "estável" depois que
    // o usuário soltou. selectionchange dispara durante o drag e seria
    // ruído. Toques curtos sem seleção real são ignorados via `isCollapsed`.
    function handleEnd() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      if (!container || !container.contains(range.commonAncestorContainer)) return

      const start = computeOffset(container, range.startContainer, range.startOffset)
      const end = computeOffset(container, range.endContainer, range.endOffset)
      if (start < 0 || end < 0) return
      const charStart = Math.min(start, end)
      const charEnd = Math.max(start, end)
      if (charEnd <= charStart) return

      const rect = range.getBoundingClientRect()
      onSelect!({
        itemId,
        charStart,
        charEnd,
        rect,
        text: text.slice(charStart, charEnd),
      })
    }

    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchend', handleEnd)
    return () => {
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [itemId, text, onSelect])

  return (
    <span ref={ref} data-item-id={itemId} className={className} style={style}>
      {segments.map((seg, i) =>
        seg.highlights && seg.highlights.length > 0 ? (
          <mark
            key={i}
            data-highlight-ids={seg.highlights.map((h) => h.id).join(',')}
            onClick={
              onHighlightClick
                ? () => onHighlightClick(seg.highlights![0])
                : undefined
            }
            className="rounded-[3px] px-[1px] -mx-[1px] transition-colors cursor-pointer"
            style={{
              background: blendColors(seg.highlights),
              color: 'inherit',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  )
}

interface Segment {
  text: string
  highlights?: LessonHighlight[]
}

/**
 * Particiona o texto em segmentos cobertos por uma ou mais highlights.
 * Trata overlaps: cada segmento carrega a lista de highlights que o cobrem
 * (a primeira da lista vence visualmente, mas o click pode escolher).
 */
function buildSegments(text: string, highlights: LessonHighlight[]): Segment[] {
  if (highlights.length === 0) return [{ text }]

  // Coleta os pontos de fronteira (start/end) clamped ao tamanho do texto.
  const pointSet = new Set<number>([0, text.length])
  for (const h of highlights) {
    pointSet.add(Math.max(0, Math.min(text.length, h.char_start)))
    pointSet.add(Math.max(0, Math.min(text.length, h.char_end)))
  }
  const points = Array.from(pointSet).sort((a, b) => a - b)

  const out: Segment[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (a === b) continue
    const segText = text.slice(a, b)
    const covering = highlights.filter(
      (h) => h.char_start <= a && h.char_end >= b,
    )
    out.push(covering.length > 0 ? { text: segText, highlights: covering } : { text: segText })
  }
  return out
}

/** Mistura cores de highlights sobrepostas — para o caso comum (1 highlight)
 *  só retorna a cor base; para sobreposição faz uma média visual leve. */
function blendColors(highlights: LessonHighlight[]): string {
  if (highlights.length === 1) return COLOR_BG[highlights[0].color]
  // Layered: empilha as cores como gradiente sutil
  return highlights
    .map((h) => COLOR_BG[h.color])
    .reduce((acc, c) => `color-mix(in srgb, ${acc}, ${c})`, COLOR_BG[highlights[0].color])
}

/**
 * Calcula o offset (em chars do `text` original) de uma posição do DOM
 * dentro do container. Faz um walk dos text nodes em ordem de documento.
 *
 * Retorna -1 se o target não estiver dentro do container.
 */
function computeOffset(
  container: HTMLElement,
  target: Node,
  offsetInTarget: number,
): number {
  // Caso o target seja um elemento (não texto), usamos offsetInTarget como
  // índice de child. Convertemos para o text node correspondente.
  let resolvedTarget: Node = target
  let resolvedOffset = offsetInTarget
  if (target.nodeType === Node.ELEMENT_NODE) {
    const el = target as HTMLElement
    if (resolvedOffset < el.childNodes.length) {
      resolvedTarget = el.childNodes[resolvedOffset]
      resolvedOffset = 0
    } else if (el.lastChild) {
      resolvedTarget = el.lastChild
      resolvedOffset = (el.lastChild.textContent ?? '').length
    }
  }

  let offset = 0
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let node: Node | null = walker.nextNode()
  while (node) {
    if (node === resolvedTarget) {
      return offset + resolvedOffset
    }
    offset += (node.textContent ?? '').length
    node = walker.nextNode()
  }
  // Não achou o nó — pode ser um elemento sem texto ou fora do container.
  return -1
}
