import CommunityFeedClient from '@/components/comunidade/CommunityFeedClient'
import { getCommunityFlags } from '@/lib/community/config'
import { loadCommunityFeed } from '@/lib/community/feed-loader'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { FeedResponse } from '@/lib/community/types'

function CommunityDisabledPlaceholder() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <h1
          className="text-2xl mb-2 tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
          }}
        >
          Comunidade Veritas
        </h1>
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
          A comunidade está temporariamente desativada para manutenção.
        </p>
      </div>
    </main>
  )
}

/**
 * Pre-fetch opcional do feed "for_you" no servidor, antes da hidratação.
 * Qualquer usuário logado (free ou premium) pode ler o feed; só o ato
 * de postar/curtir/seguir exige Premium. Usuários anônimos caem pro
 * client fetch — a API retorna 401 e a UI mostra CTA de login.
 */
async function maybePrefetchFeed(): Promise<FeedResponse | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

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

  return <CommunityFeedClient initialFeed={initialFeed} />
}
