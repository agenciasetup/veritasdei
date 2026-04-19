'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useReliquias } from '@/lib/gamification/useReliquias'
import ReliquiaCard from './ReliquiaCard'
import ReliquiaDetailSheet from './ReliquiaDetailSheet'
import { CATEGORY_META, RARITY_META, type ReliquiaCategory, type ReliquiaRarity, type Reliquia } from '@/types/gamification'

const RARITY_ORDER: ReliquiaRarity[] = ['lendaria', 'epica', 'rara', 'comum']

export default function ReliquiaShowcase() {
  const { user } = useAuth()
  const { catalog, unlockedIds, equippedId, loading, equip } = useReliquias(user?.id)
  const [filter, setFilter] = useState<'todas' | ReliquiaCategory>('todas')
  const [selected, setSelected] = useState<Reliquia | null>(null)

  const filtered = useMemo(() => {
    const items = filter === 'todas' ? catalog : catalog.filter(r => r.category === filter)
    return items.slice().sort((a, b) => {
      // Desbloqueadas primeiro
      const aU = unlockedIds.has(a.id) ? 0 : 1
      const bU = unlockedIds.has(b.id) ? 0 : 1
      if (aU !== bU) return aU - bU
      // Raridade
      const aR = RARITY_ORDER.indexOf(a.rarity)
      const bR = RARITY_ORDER.indexOf(b.rarity)
      if (aR !== bR) return aR - bR
      return a.sort_order - b.sort_order
    })
  }, [catalog, filter, unlockedIds])

  const unlockedCount = unlockedIds.size
  const totalCount = catalog.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  if (catalog.length === 0) {
    return (
      <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        Nenhuma relíquia disponível ainda.
      </p>
    )
  }

  const categories: Array<'todas' | ReliquiaCategory> = [
    'todas',
    'estudo',
    'streak',
  ]

  return (
    <div className="fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs tracking-[0.18em] uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          Reliquário
        </h3>
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Filtros simples */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {categories.map(cat => {
          const active = filter === cat
          const label = cat === 'todas' ? 'Todas' : CATEGORY_META[cat].label
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className="text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={{
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(242,237,228,0.08)'}`,
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {filtered.map(rel => (
          <ReliquiaCard
            key={rel.id}
            reliquia={rel}
            unlocked={unlockedIds.has(rel.id)}
            equipped={equippedId === rel.id}
            onClick={() => setSelected(rel)}
          />
        ))}
      </div>

      {/* Legenda de raridade */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-[10px]">
        {(['comum', 'rara', 'epica', 'lendaria'] as const).map(r => (
          <span key={r} className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: RARITY_META[r].color }}
            />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
              {RARITY_META[r].label}
            </span>
          </span>
        ))}
      </div>

      <ReliquiaDetailSheet
        reliquia={selected}
        unlocked={selected ? unlockedIds.has(selected.id) : false}
        equipped={selected ? equippedId === selected.id : false}
        onEquip={async () => {
          if (!selected) return
          await equip(equippedId === selected.id ? null : selected.id)
        }}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
