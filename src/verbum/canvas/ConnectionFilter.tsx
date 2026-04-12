'use client'

import { useState, useCallback, useMemo } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'

interface ConnectionFilterProps {
  nodes: Node[]
  edges: Edge[]
  filterEntities: string[]
  filterRelation: string | null
  onFilterChange: (entities: string[], relation: string | null) => void
}

const RELATION_LABELS: Record<string, string> = {
  tipologia: 'Tipologia',
  doutrina: 'Doutrina',
  citacao_direta: 'Citacao Direta',
  'magistério': 'Magisterio',
  patristica: 'Patristica',
  etimologia: 'Etimologia',
  profetica: 'Profetica',
}

export default function ConnectionFilter({
  nodes,
  edges,
  filterEntities,
  filterRelation,
  onFilterChange,
}: ConnectionFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Get unique node names for the entity selector
  const nodeNames = useMemo(() => {
    const names: { id: string; title: string }[] = []
    for (const node of nodes) {
      const data = node.data as Record<string, unknown>
      const title = (data.title as string) || (data.display_name as string) || ''
      if (title) names.push({ id: node.id, title })
    }
    return names.sort((a, b) => a.title.localeCompare(b.title))
  }, [nodes])

  // Filter node names by search
  const filteredNames = useMemo(() => {
    if (!search) return nodeNames.slice(0, 30)
    const q = search.toLowerCase()
    return nodeNames.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 20)
  }, [nodeNames, search])

  // Get unique relation types from edges
  const relationTypes = useMemo(() => {
    const types = new Set<string>()
    for (const edge of edges) {
      const data = edge.data as Record<string, unknown> | undefined
      const rel = (data?.relation_type as string) || edge.type || ''
      if (rel && rel !== 'proposta') types.add(rel)
    }
    return Array.from(types)
  }, [edges])

  const toggleEntity = useCallback(
    (nodeId: string) => {
      const next = filterEntities.includes(nodeId)
        ? filterEntities.filter((id) => id !== nodeId)
        : [...filterEntities, nodeId]
      onFilterChange(next, filterRelation)
    },
    [filterEntities, filterRelation, onFilterChange]
  )

  const hasFilters = filterEntities.length > 0 || filterRelation !== null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
        style={{
          background: hasFilters ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hasFilters ? 'rgba(201,168,76,0.4)' : VERBUM_COLORS.ui_border}`,
          color: hasFilters ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.text_secondary,
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Filter className="w-3.5 h-3.5" />
        {hasFilters && (
          <span className="text-[10px]">{filterEntities.length + (filterRelation ? 1 : 0)}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[250]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden z-[251]"
              style={{
                background: VERBUM_COLORS.ui_bg,
                border: `1px solid ${VERBUM_COLORS.ui_border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
              >
                <span
                  className="text-[10px] tracking-widest uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.text_muted }}
                >
                  Filtrar Conexoes
                </span>
                {hasFilters && (
                  <button
                    onClick={() => onFilterChange([], null)}
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: VERBUM_COLORS.ui_gold }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Relation type filter */}
              <div className="px-3 py-2" style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}>
                <div className="text-[10px] mb-1.5" style={{ color: VERBUM_COLORS.text_muted }}>
                  Tipo de Conexao
                </div>
                <div className="flex flex-wrap gap-1">
                  {relationTypes.map((rel) => (
                    <button
                      key={rel}
                      onClick={() => onFilterChange(filterEntities, filterRelation === rel ? null : rel)}
                      className="px-2 py-0.5 rounded text-[10px] transition-colors"
                      style={{
                        background: filterRelation === rel ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${filterRelation === rel ? 'rgba(201,168,76,0.4)' : VERBUM_COLORS.ui_border}`,
                        color: filterRelation === rel ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.text_secondary,
                      }}
                    >
                      {RELATION_LABELS[rel] || rel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity filter */}
              <div className="px-3 py-2">
                <div className="text-[10px] mb-1.5" style={{ color: VERBUM_COLORS.text_muted }}>
                  Entidades
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full px-2 py-1 rounded text-[11px] mb-2 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${VERBUM_COLORS.ui_border}`,
                    color: VERBUM_COLORS.text_primary,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                />
                <div className="max-h-[160px] overflow-y-auto space-y-0.5">
                  {filteredNames.map((n) => {
                    const active = filterEntities.includes(n.id)
                    return (
                      <button
                        key={n.id}
                        onClick={() => toggleEntity(n.id)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[11px] transition-colors"
                        style={{
                          background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                          color: active ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.text_secondary,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: active ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.ui_border,
                            background: active ? VERBUM_COLORS.ui_gold : 'transparent',
                          }}
                        >
                          {active && <span className="text-[8px] text-black font-bold">✓</span>}
                        </div>
                        <span className="truncate">{n.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
