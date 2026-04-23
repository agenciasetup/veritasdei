'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { needsReacceptance, pendingAcceptances } from '@/lib/legal/acceptance'

/**
 * Silencioso: após o usuário autenticar, verifica se o perfil está com todas as
 * versões legais obrigatórias (terms, privacy, guidelines) já aceitas. Se não,
 * dispara POST /api/legal/accept gravando o aceite — o usuário já marcou o
 * checkbox no cadastro, então aqui apenas persistimos a decisão com IP/UA.
 *
 * Em fase futura este componente exibirá um modal bloqueante quando a versão
 * mudar em conta existente (re-aceite exigido).
 */
export function LegalGate() {
  const { user, isAuthenticated } = useAuth()
  const supabase = createClient()
  const recordedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user || recordedRef.current) return
    recordedRef.current = true

    let cancelled = false

    ;(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'accepted_terms_version, accepted_privacy_version, accepted_guidelines_version, accepted_cookies_version, accepted_dmca_version, last_acceptance_at',
        )
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (!needsReacceptance(profile)) return

      const pending = pendingAcceptances(profile)
      if (pending.length === 0) return

      try {
        await fetch('/api/legal/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: pending }),
        })
      } catch {
        // Melhor não bloquear o app. Retry ocorre no próximo mount.
        recordedRef.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, supabase])

  return null
}
