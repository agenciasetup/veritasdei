'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'

interface CanvasSearchProps {
  nodes: Node[]
  onHighlightNode: (nodeId: string | null) => void
}

/** Normalize text for accent-insensitive fuzzy matching */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

interface SearchMatch {
  nodeId: string
  title: string
  subtitle: string
  score: number
}

export default function CanvasSearch({ nodes, onHighlightNode }: CanvasSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setCenter } = useReactFlow()

  // Keyboard shortcut: Cmd+F / Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
        setQuery('')
        onHighlightNode(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onHighlightNode])

  // Search results
  const results = useMemo((): SearchMatch[] => {
    const q = normalize(query.trim())
    if (q.length < 2) return []

    const matches: SearchMatch[] = []

    for (const node of nodes) {
      const data = node.data as Record<string, unknown>
      const title = (data.title as string) || (data.display_name as string) || ''
      const description = (data.description as string) || ''
      const bibleRef = (data.bible_reference as string) || ''
      const bibleText = (data.bible_text as string) || ''
      const titleLatin = (data.title_latin as string) || ''

      const searchable = normalize(
        `${title} ${description} ${bibleRef} ${bibleText} ${titleLatin}`
      )

      if (searchable.includes(q)) {
        const subtitle = bibleRef || titleLatin || description.slice(0, 60) || ''
        // Exact title match scores higher
        const score = normalize(title).includes(q) ? 2 : 1
        matches.push({ nodeId: node.id, title, subtitle, score })
      }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 20)
  }, [query, nodes])

  // Navigate to node
  const navigateToNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      setCenter(node.position.x + 75, node.position.y + 40, { zoom: 1.2, duration: 400 })
      onHighlightNode(nodeId)
    },
    [nodes, setCenter, onHighlightNode]
  )

  // Keyboard navigation in results
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        navigateToNode(results[selectedIndex].nodeId)
      }
    },
    [results, selectedIndex, navigateToNode]
  )

  // Reset selection when results change
  useEffect(() => setSelectedIndex(0), [results])

  if (!open) return null

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[400] w-80">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: VERBUM_COLORS.ui_bg,
          border: `1px solid ${VERBUM_COLORS.ui_border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: VERBUM_COLORS.text_muted }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar nos no canvas..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{
              color: VERBUM_COLORS.text_primary,
              fontFamily: 'Poppins, sans-serif',
            }}
            autoFocus
          />
          {query && (
            <span className="text-[10px] shrink-0" style={{ color: VERBUM_COLORS.text_muted }}>
              {results.length}
            </span>
          )}
          <button
            onClick={() => { setOpen(false); setQuery(''); onHighlightNode(null) }}
            className="shrink-0 p-0.5"
            style={{ color: VERBUM_COLORS.text_muted }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div
            className="max-h-[240px] overflow-y-auto"
            style={{ borderTop: `1px solid ${VERBUM_COLORS.ui_border}` }}
          >
            {results.map((match, i) => (
              <button
                key={match.nodeId}
                onClick={() => navigateToNode(match.nodeId)}
                className="w-full flex flex-col px-3 py-2 text-left transition-colors"
                style={{
                  background: i === selectedIndex ? 'rgba(201,168,76,0.08)' : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: VERBUM_COLORS.text_primary }}
                >
                  {match.title}
                </span>
                {match.subtitle && (
                  <span
                    className="text-[10px] truncate"
                    style={{ color: VERBUM_COLORS.text_muted }}
                  >
                    {match.subtitle}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query.length >= 2 && results.length === 0 && (
          <div
            className="px-3 py-3 text-xs text-center"
            style={{ color: VERBUM_COLORS.text_muted, borderTop: `1px solid ${VERBUM_COLORS.ui_border}` }}
          >
            Nenhum no encontrado
          </div>
        )}
      </motion.div>
    </div>
  )
}
