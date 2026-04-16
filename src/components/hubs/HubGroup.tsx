'use client'

import { type ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'

/**
 * Agrupa HubTiles sob um título colapsável. Por default vem aberto;
 * memoriza estado em localStorage por chave para persistir entre sessões.
 */

interface HubGroupProps {
  id: string // chave de persistência
  label: string
  icon?: React.ElementType
  defaultOpen?: boolean
  children: ReactNode
}

const STORAGE_PREFIX = 'veritasdei:hubgroup:'

function loadOpen(id: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id)
    if (raw === '1') return true
    if (raw === '0') return false
    return fallback
  } catch {
    return fallback
  }
}

function saveOpen(id: string, open: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + id, open ? '1' : '0')
  } catch {}
}

export default function HubGroup({
  id,
  label,
  icon: Icon,
  defaultOpen = true,
  children,
}: HubGroupProps) {
  const [open, setOpen] = useState<boolean>(() => loadOpen(id, defaultOpen))
  const haptic = useHaptic()

  function toggle() {
    haptic.pulse('tap')
    const next = !open
    setOpen(next)
    saveOpen(id, next)
  }

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-1 py-2 active:opacity-70 touch-target"
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
          )}
          <h2
            className="text-xs uppercase tracking-[0.18em] truncate"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {label}
          </h2>
        </div>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3 mt-2 stagger-in">
          {children}
        </div>
      )}
    </section>
  )
}
