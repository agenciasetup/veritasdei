'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

/**
 * Container de 3 colunas para o modo leitor de estudos.
 *
 * Desktop (lg+): `main` flui até max-w-[1400px] com aside lateral à direita.
 * O aside tem dois estados:
 *  - expandido: 320px, mostra a árvore de lições (`sidebar` prop)
 *  - colapsado: rail de 56px com progresso vertical do pilar + botão expandir
 *
 * Estado persistido em localStorage. Atalho de teclado `[` alterna.
 * Em md e abaixo a aside é omitida — quem consome fornece um drawer separado.
 *
 * Não altera o AppShell. O `main#main-content` global continua com
 * `md:ml-16`; este layout vive dentro dele.
 */

const STORAGE_KEY = 'veritasdei:study:sidebar:collapsed'

function loadCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

interface PillarProgress {
  studied: number
  total: number
}

interface Props {
  /** Coluna lateral direita (desktop lg+). Oculta em < lg. */
  sidebar?: React.ReactNode
  /** Progresso do pilar — exibido no rail colapsado. */
  pillarProgress?: PillarProgress
  children: React.ReactNode
}

export default function StudyLayout({ sidebar, pillarProgress, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Hydrate from localStorage after mount (avoids SSR mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(loadCollapsed())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ok */
    }
  }, [collapsed, hydrated])

  // Atalho de teclado `[` alterna o colapso. Ignora quando o foco está em
  // input/textarea/contenteditable pra não interferir em digitação.
  useEffect(() => {
    if (typeof window === 'undefined') return
    function onKey(e: KeyboardEvent) {
      if (e.key !== '[') return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const railWidth = '56px'
  const expandedWidth = '320px'
  const cols = sidebar
    ? collapsed
      ? `minmax(0,1fr) ${railWidth}`
      : `minmax(0,1fr) ${expandedWidth}`
    : 'minmax(0,1fr)'

  return (
    <div className="max-w-[1400px] mx-auto w-full px-0 lg:px-6">
      <div className="lg:grid lg:gap-6" style={{ gridTemplateColumns: cols }}>
        <div className="min-w-0">{children}</div>
        {sidebar ? (
          <aside
            aria-label="Índice de lições"
            className="hidden lg:block sticky top-0 h-screen py-6"
          >
            <div className="relative h-full">
              <SidebarToggle
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
              />
              {collapsed ? (
                <CollapsedRail progress={pillarProgress} />
              ) : (
                <div className="h-full overflow-y-auto pr-1">{sidebar}</div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const Icon = collapsed ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expandir índice de lições' : 'Recolher índice de lições'}
      title={collapsed ? 'Expandir índice (tecla [)' : 'Recolher índice (tecla [)'}
      className="absolute -left-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center active:scale-95 transition-transform"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(201,168,76,0.25)',
        color: 'var(--accent)',
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.4)',
      }}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}

function CollapsedRail({ progress }: { progress?: PillarProgress }) {
  const total = progress?.total ?? 0
  const studied = progress?.studied ?? 0
  const pct = total > 0 ? Math.min(100, Math.round((studied / total) * 100)) : 0

  return (
    <div className="h-full flex flex-col items-center py-2 gap-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.18)',
          color: 'var(--accent)',
        }}
      >
        <BookOpen className="w-4 h-4" />
      </div>

      {total > 0 ? (
        <>
          <div
            className="flex-1 w-1.5 rounded-full overflow-hidden relative"
            style={{ background: 'rgba(201,168,76,0.12)' }}
            aria-label={`Progresso do pilar: ${studied} de ${total}`}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500"
              style={{
                height: `${pct}%`,
                background: 'linear-gradient(180deg, #D9C077, #C9A84C)',
              }}
            />
          </div>
          <span
            className="text-[10px] tabular-nums tracking-wider"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
              writingMode: 'horizontal-tb',
            }}
          >
            {studied}/{total}
          </span>
        </>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
