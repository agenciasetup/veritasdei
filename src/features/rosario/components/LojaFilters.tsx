'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { RosarySkinCatalogItem } from '@/features/rosario/data/skinTypes'

type Tab = 'todos' | 'colecao' | 'disponiveis' | 'em-breve'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'colecao', label: 'Coleção' },
  { id: 'disponiveis', label: 'Disponíveis' },
  { id: 'em-breve', label: 'Em breve' },
]

export function LojaFilters({
  items,
  authenticated,
  children,
}: {
  items: RosarySkinCatalogItem[]
  authenticated: boolean
  children: (filtered: RosarySkinCatalogItem[]) => ReactNode
}) {
  const [tab, setTab] = useState<Tab>('todos')

  const filtered = useMemo(() => {
    switch (tab) {
      case 'colecao':
        return items.filter((i) => i.owned)
      case 'disponiveis':
        return items.filter(
          (i) => !i.owned && i.unlock_tipo !== 'coming_soon',
        )
      case 'em-breve':
        return items.filter((i) => i.unlock_tipo === 'coming_soon')
      default:
        return items
    }
  }, [items, tab])

  const counts = useMemo(
    () => ({
      todos: items.length,
      colecao: items.filter((i) => i.owned).length,
      disponiveis: items.filter((i) => !i.owned && i.unlock_tipo !== 'coming_soon').length,
      'em-breve': items.filter((i) => i.unlock_tipo === 'coming_soon').length,
    }),
    [items],
  )

  return (
    <>
      <div className="mb-8 flex flex-wrap justify-center gap-2 md:mb-10">
        {TABS.map((t) => {
          if (t.id === 'colecao' && !authenticated) return null
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition active:scale-[0.97]"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border-1)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
              aria-pressed={active}
            >
              {t.label}
              <span
                className="ml-2 text-[10px]"
                style={{ opacity: 0.7 }}
              >
                {counts[t.id]}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            borderColor: 'var(--border-1)',
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Nada por aqui ainda.
          </p>
        </div>
      ) : (
        children(filtered)
      )}
    </>
  )
}
