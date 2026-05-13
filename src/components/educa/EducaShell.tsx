'use client'

/**
 * EducaShell — wrapper de layout do subproduto Veritas Educa.
 *
 * Substitui Sidebar + BottomNav + LiturgicalBar do Veritas Dei full por
 * uma navegação MÍNIMA (4 itens: Home / Trilhas / Debate / Perfil). É
 * montado quando `product === 'veritas-educa'` pelo AppShell.
 *
 * Não renderiza páginas públicas (/login, /auth/*) — o AppShell decide
 * antes se mostra chrome ou não.
 */

import { type ReactNode } from 'react'
import EducaTopBar from './EducaTopBar'
import EducaSidebar from './EducaSidebar'
import EducaBottomNav from './EducaBottomNav'

export default function EducaShell({ children }: { children: ReactNode }) {
  return (
    <>
      <EducaTopBar />

      {/* Sidebar fina só no desktop (md+) */}
      <div className="hidden md:block">
        <EducaSidebar />
      </div>

      <div
        id="main-content"
        className="md:ml-16 pb-bottom-nav"
      >
        {children}
      </div>

      {/* Bottom nav só no mobile */}
      <EducaBottomNav />
    </>
  )
}
