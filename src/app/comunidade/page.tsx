import RequirePremium from '@/components/payments/RequirePremium'
import CommunityFeedClient from '@/components/comunidade/CommunityFeedClient'
import { getCommunityFlags } from '@/lib/community/config'
import { loadCommunityFeed } from '@/lib/community/feed-loader'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasActivePremium } from '@/lib/payments/entitlements'
import type { FeedResponse } from '@/lib/community/types'

function CommunityDisabledPlaceholder() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(16,16,16,0.7)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Comunidade Veritas
        </h1>
        <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
          A comunidade está temporariamente desativada para manutenção.
        </p>
      </div>
    </main>
  )
}

/**
 * Pre-fetch opcional do feed "for_you" no servidor, antes da hidratação.
 * Se o usuário não está logado ou sem premium, retornamos null e o
 * `CommunityFeedClient` fará o fetch normal via `useEffect` no cliente.
 * Qualquer erro é silencioso — fallback pro comportamento atual.
 */
async function maybePrefetchFeed(): Promise<FeedResponse | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const premium = await hasActivePremium(user.id)
    if (!premium) return null

    return await loadCommunityFeed(supabase, user.id, { tab: 'for_you', limit: 20, cursor: null })
  } catch {
    return null
  }
}

export default async function ComunidadePage() {
  const flags = getCommunityFlags()

  if (!flags.communityEnabled) {
    return <CommunityDisabledPlaceholder />
  }

  const initialFeed = await maybePrefetchFeed()

  return (
    <RequirePremium
      title="Comunidade Veritas"
      description="Acesse o feed de Veritas, interações e perfis da comunidade católica do Veritas Dei."
    >
      <CommunityFeedClient initialFeed={initialFeed} />
    </RequirePremium>
  )
}
