'use client'

import { useMemo, useState } from 'react'
import type { Node } from '@xyflow/react'
import { Search, Network, Sparkles, BookOpen, Tag, FileText, X } from 'lucide-react'
import BottomSheet from '@/components/mobile/BottomSheet'
import { useHaptic } from '@/hooks/useHaptic'

/**
 * Vista alternativa do canvas para mobile: lista os nós agrupados por tipo,
 * com busca e tap → BottomSheet de detalhes. Renderizada por cima do
 * ReactFlow (não substitui — apenas oculta visualmente o canvas).
 *
 * Mantém o canvas vivo no DOM para preservar estado de zoom / pan.
 */

interface MobileNodeListViewProps {
  nodes: Node[]
  open: boolean
  onClose: () => void
  /** Centraliza o nó no canvas e fecha a vista lista. */
  onFocusNode?: (nodeId: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  trinitas: 'Trindade',
  figura: 'Figuras',
  versiculo: 'Versículos',
  dogma: 'Dogmas',
  encarnado: 'Encarnação',
  postit: 'Notas',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  trinitas: Sparkles,
  figura: Tag,
  versiculo: BookOpen,
  dogma: Network,
  encarnado: Sparkles,
  postit: FileText,
}

interface NodeData {
  title?: string
  text?: string
  body?: string
  reference?: string
  description?: string
}

function getNodeTitle(n: Node): string {
  const d = n.data as NodeData | undefined
  if (!d) return 'Nó sem título'
  return d.title || d.reference || (d.text ?? '').slice(0, 40) || 'Nó sem título'
}

function getNodeSubtitle(n: Node): string | null {
  const d = n.data as NodeData | undefined
  if (!d) return null
  if (d.reference && d.reference !== getNodeTitle(n)) return d.reference
  if (d.description) return d.description
  if (d.body) return d.body.slice(0, 80)
  return null
}

export default function MobileNodeListView({
  nodes,
  open,
  onClose,
  onFocusNode,
}: MobileNodeListViewProps) {
  const [query, setQuery] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const haptic = useHaptic()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return nodes
    return nodes.filter((n) => {
      const t = getNodeTitle(n).toLowerCase()
      const s = getNodeSubtitle(n)?.toLowerCase() ?? ''
      return t.includes(q) || s.includes(q)
    })
  }, [nodes, query])

  const grouped = useMemo(() => {
    const map = new Map<string, Node[]>()
    for (const n of filtered) {
      const t = n.type ?? 'other'
      const arr = map.get(t) ?? []
      arr.push(n)
      map.set(t, arr)
    }
    return Array.from(map.entries()).sort((a, b) =>
      (TYPE_LABELS[a[0]] ?? a[0]).localeCompare(TYPE_LABELS[b[0]] ?? b[0]),
    )
  }, [filtered])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[210] flex flex-col"
      style={{
        background: 'rgba(10,8,6,0.97)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 safe-top">
        <div className="flex items-center gap-2 mb-3">
          <h2
            className="flex-1 text-base font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}
          >
            Nós ({nodes.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar ao canvas"
            className="touch-target flex items-center justify-center rounded-lg active:scale-95"
            style={{ color: '#A89060' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 h-11"
          style={{
            background: 'rgba(20,18,14,0.85)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#A89060' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nó…"
            aria-label="Buscar nó"
            className="flex-1 h-full bg-transparent outline-none text-sm"
            style={{ color: '#F5EDD6', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {grouped.length === 0 ? (
          <p
            className="text-center text-sm py-12"
            style={{ color: '#A89060', fontFamily: 'Poppins, sans-serif' }}
          >
            Nenhum nó encontrado.
          </p>
        ) : (
          grouped.map(([type, group]) => {
            const Icon = TYPE_ICONS[type] ?? Network
            return (
              <section key={type} className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                  <h3
                    className="text-xs uppercase tracking-[0.18em]"
                    style={{
                      color: '#A89060',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {TYPE_LABELS[type] ?? type} · {group.length}
                  </h3>
                </div>
                <ul className="flex flex-col gap-2">
                  {group.map((n) => {
                    const subtitle = getNodeSubtitle(n)
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => {
                            haptic.pulse('selection')
                            setSelectedNodeId(n.id)
                          }}
                          className="w-full text-left flex items-start gap-3 p-3 rounded-xl active:scale-[0.99] touch-target-lg"
                          style={{
                            background: 'rgba(20,18,14,0.6)',
                            border: '1px solid rgba(201,168,76,0.1)',
                          }}
                        >
                          <Icon
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: '#C9A84C' }}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium truncate"
                              style={{
                                color: '#F5EDD6',
                                fontFamily: 'Cinzel, serif',
                              }}
                            >
                              {getNodeTitle(n)}
                            </p>
                            {subtitle && (
                              <p
                                className="text-xs mt-0.5 line-clamp-2"
                                style={{
                                  color: '#A89060',
                                  fontFamily: 'Poppins, sans-serif',
                                }}
                              >
                                {subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })
        )}
      </div>

      {/* Detail BottomSheet */}
      <BottomSheet
        open={selectedNode !== null}
        onDismiss={() => setSelectedNodeId(null)}
        detents={[0.55, 0.92]}
        initialDetent={0}
        label="Detalhes do nó"
      >
        {selectedNode && (
          <div className="pt-2 pb-6">
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-1"
              style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
            >
              {TYPE_LABELS[selectedNode.type ?? ''] ?? selectedNode.type ?? 'Nó'}
            </p>
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: '#F5EDD6', fontFamily: 'Cinzel, serif' }}
            >
              {getNodeTitle(selectedNode)}
            </h3>
            {(selectedNode.data as NodeData).reference && (
              <p
                className="text-sm italic mb-3"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'Cormorant Garamond, serif',
                }}
              >
                {(selectedNode.data as NodeData).reference}
              </p>
            )}
            {(selectedNode.data as NodeData).body && (
              <p
                className="text-sm leading-relaxed mb-4"
                style={{
                  color: '#E8E2D8',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {(selectedNode.data as NodeData).body}
              </p>
            )}
            {(selectedNode.data as NodeData).description && (
              <p
                className="text-sm leading-relaxed mb-4"
                style={{
                  color: '#E8E2D8',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {(selectedNode.data as NodeData).description}
              </p>
            )}

            {onFocusNode && (
              <button
                type="button"
                onClick={() => {
                  if (!selectedNode) return
                  onFocusNode(selectedNode.id)
                  setSelectedNodeId(null)
                  onClose()
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold touch-target-lg active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                  color: '#0F0E0C',
                  fontFamily: 'Cinzel, serif',
                }}
              >
                Ver no canvas
              </button>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
