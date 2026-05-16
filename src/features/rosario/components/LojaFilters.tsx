'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock, Check } from 'lucide-react'
import { SkinMiniPreview } from '@/features/rosario/components/SkinMiniPreview'
import type { RosarySkinCatalogItem } from '@/features/rosario/data/skinTypes'

type Tab = 'todos' | 'colecao' | 'disponiveis' | 'em-breve'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'colecao', label: 'Coleção' },
  { id: 'disponiveis', label: 'Disponíveis' },
  { id: 'em-breve', label: 'Em breve' },
]

/**
 * Catálogo filtrável da loja.
 *
 * Client component porque o filtro é puramente UI — sem trip ao servidor.
 * Recebe `items` já anotados com state (owned/equipped) do server.
 * Renderiza os próprios cards (não usa render-prop, que quebraria a
 * fronteira server/client do App Router).
 */
export function LojaFilters({
  items,
  authenticated,
}: {
  items: RosarySkinCatalogItem[]
  authenticated: boolean
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
              <span className="ml-2 text-[10px]" style={{ opacity: 0.7 }}>
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
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {filtered.map((skin) => (
            <li key={skin.id}>
              <SkinCard skin={skin} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function SkinCard({ skin }: { skin: RosarySkinCatalogItem }) {
  const status = unlockStatusOf(skin)
  const clickable = status === 'owned' || status === 'unlocked' || status === 'locked'

  const Inner = (
    <article
      className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border p-5 transition"
      style={{
        borderColor: skin.equipped
          ? 'var(--accent)'
          : status === 'coming_soon'
            ? 'var(--border-1)'
            : skin.theme.borderStrong,
        background: 'var(--surface-2)',
        opacity: status === 'coming_soon' ? 0.55 : 1,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            status === 'coming_soon'
              ? 'transparent'
              : `radial-gradient(ellipse 60% 50% at 50% 0%, ${skin.theme.accent}18 0%, transparent 55%)`,
        }}
      />

      <div className="relative flex items-center justify-between">
        <span
          className="text-[9px] uppercase tracking-[0.28em]"
          style={{
            color: rarityColor(skin.raridade),
            fontFamily: 'var(--font-display)',
          }}
        >
          {skin.raridade}
        </span>
        {skin.equipped ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} /> Equipado
          </span>
        ) : skin.owned ? (
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Na coleção
          </span>
        ) : status === 'coming_soon' ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
            }}
          >
            <Lock className="h-2.5 w-2.5" /> Em breve
          </span>
        ) : status === 'locked' ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
            }}
          >
            <Lock className="h-2.5 w-2.5" /> Bloqueado
          </span>
        ) : null}
      </div>

      <div className="relative flex justify-center py-2">
        <SkinMiniPreview theme={skin.theme} size={160} />
      </div>

      <div className="relative">
        <h2
          className="text-xl leading-tight md:text-[1.4rem]"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.005em',
          }}
        >
          {skin.nome}
        </h2>
        {skin.subtitulo && (
          <p
            className="mt-1 text-xs italic md:text-sm"
            style={{ color: 'var(--text-3)' }}
          >
            {skin.subtitulo}
          </p>
        )}
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-3 pt-2">
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
        >
          {skin.categoria}
        </span>
        {status === 'owned' && (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{
              color: skin.theme.accent,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            Detalhes →
          </span>
        )}
        {status === 'unlocked' && (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            Disponível →
          </span>
        )}
        {status === 'locked' && skin.unlock_label && (
          <span className="text-right text-[10px] italic leading-tight" style={{ color: 'var(--text-3)' }}>
            {skin.unlock_label}
          </span>
        )}
      </div>
    </article>
  )

  if (!clickable) return <div className="h-full">{Inner}</div>

  return (
    <Link
      href={`/rosario/loja/${skin.slug}`}
      className="block h-full transition active:scale-[0.985]"
      style={{ textDecoration: 'none' }}
    >
      {Inner}
    </Link>
  )
}

function unlockStatusOf(
  skin: RosarySkinCatalogItem,
): 'owned' | 'unlocked' | 'locked' | 'coming_soon' {
  if (skin.owned) return 'owned'
  if (skin.unlock_tipo === 'coming_soon') return 'coming_soon'
  if (skin.unlock_tipo === 'free') return 'unlocked'
  return 'locked'
}

function rarityColor(r: RosarySkinCatalogItem['raridade']): string {
  switch (r) {
    case 'lendaria':
      return '#D9C077'
    case 'suprema':
      return '#E6C078'
    case 'epica':
      return '#C4B0E2'
    case 'rara':
      return '#9FCBE6'
    default:
      return 'var(--text-3)'
  }
}
