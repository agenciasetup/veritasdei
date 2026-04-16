'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type LucideIcon, ChevronRight } from 'lucide-react'
import BottomSheet from '@/components/mobile/BottomSheet'
import { createClient } from '@/lib/supabase/client'
import { useHaptic } from '@/hooks/useHaptic'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
}

interface AdminMobileNavProps {
  open: boolean
  onClose: () => void
  items: NavItem[]
}

/**
 * BottomSheet de navegação admin no mobile. Lista todas as 7 seções
 * com ícone + label + chevron. A seção "Aprovações" exibe badge com
 * a quantidade de itens pendentes (sum de verificações + paróquias).
 */
export default function AdminMobileNav({ open, onClose, items }: AdminMobileNavProps) {
  const pathname = usePathname()
  const haptic = useHaptic()
  const [pending, setPending] = useState<number | null>(null)

  // Carrega o count de pendências ao abrir
  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    if (!supabase) return
    let cancelled = false
    async function load() {
      try {
        const [v, p] = await Promise.all([
          supabase!
            .from('verificacoes')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendente'),
          supabase!
            .from('paroquias')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendente'),
        ])
        if (cancelled) return
        const total = (v.count ?? 0) + (p.count ?? 0)
        setPending(total)
      } catch {
        // silencioso — só ocultamos badge
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      detents={[0.65, 0.92]}
      initialDetent={0}
      label="Navegação admin"
    >
      <h2
        className="text-base font-semibold mb-3 mt-1"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        Painel admin
      </h2>

      <ul className="flex flex-col gap-1">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          const showBadge = href === '/admin/aprovacoes' && pending !== null && pending > 0
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => {
                  haptic.pulse('selection')
                  onClose()
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-white/5 touch-target-lg"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(201,168,76,0.25)'
                    : '1px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: isActive ? '#C9A84C' : '#8A8378' }}
                />
                <span
                  className="flex-1 text-sm font-medium"
                  style={{
                    color: isActive ? '#C9A84C' : '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {label}
                </span>
                {showBadge && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(217,79,92,0.18)',
                      color: '#D94F5C',
                      border: '1px solid rgba(217,79,92,0.35)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {pending}
                  </span>
                )}
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: '#8A8378' }}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </BottomSheet>
  )
}
