'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

import LandingPage from '@/components/landing/LandingPage'
import {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonText,
} from '@/components/mobile/Skeleton'

/**
 * `/` — rota raiz.
 *
 * Comportamento pós-Sprint 1.11:
 *   - Não-autenticado  → renderiza LandingPage
 *   - Em onboarding    → redireciona para /onboarding
 *   - Autenticado      → redireciona para /rezar (novo hub inicial)
 *
 * A antiga Home "Hoje" (liturgia, propósitos, atalhos, continuar) foi
 * redistribuída: Liturgia do dia vive no topo de /rezar; Propósitos
 * em /perfil (Fase 2.16); Continuar estudando em /formacao (Fase 2.4).
 */
export default function Home() {
  const { isAuthenticated, isLoading: authLoading, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return
    if (profile && !profile.onboarding_completed) {
      router.replace('/onboarding')
      return
    }
    router.replace('/rezar')
  }, [authLoading, isAuthenticated, profile, router])

  if (!authLoading && !isAuthenticated) {
    return <LandingPage />
  }

  // Loading skeleton para usuário autenticado enquanto redirect acontece.
  return (
    <main className="flex flex-col min-h-screen relative pb-24">
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size={44} />
          <div>
            <SkeletonText width={70} height={10} />
            <div className="mt-2">
              <SkeletonText width={120} height={16} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonAvatar size={40} />
          <SkeletonAvatar size={40} />
        </div>
      </header>
      <div className="px-4 mb-3">
        <SkeletonCard height={140} rounded={24} />
      </div>
      <div className="px-4 flex gap-3 overflow-hidden mb-4">
        <SkeletonCard className="flex-shrink-0" height={170} rounded={20} style={{ width: 224 }} />
        <SkeletonCard className="flex-shrink-0" height={170} rounded={20} style={{ width: 224 }} />
      </div>
      <div className="px-5 flex justify-around mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonAvatar key={i} size={64} />
        ))}
      </div>
    </main>
  )
}
