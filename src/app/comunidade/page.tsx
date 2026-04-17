import RequirePremium from '@/components/payments/RequirePremium'
import CommunityFeedClient from '@/components/comunidade/CommunityFeedClient'
import { getCommunityFlags } from '@/lib/community/config'

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

export default function ComunidadePage() {
  const flags = getCommunityFlags()

  if (!flags.communityEnabled) {
    return <CommunityDisabledPlaceholder />
  }

  return (
    <RequirePremium
      title="Comunidade Veritas"
      description="Acesse o feed de Veritas, interações e perfis da comunidade católica do Veritas Dei."
    >
      <CommunityFeedClient />
    </RequirePremium>
  )
}
