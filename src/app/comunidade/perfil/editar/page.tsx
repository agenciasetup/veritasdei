import { notFound } from 'next/navigation'
import RequirePremium from '@/components/payments/RequirePremium'
import ProfileEditor from '@/components/comunidade/ProfileEditor'
import { getCommunityFlags } from '@/lib/community/config'

export const metadata = {
  title: 'Editar perfil · Comunidade Veritas',
  description: 'Edite seu avatar, capa, bio, handle e links.',
}

export default function ProfileEditPage() {
  const flags = getCommunityFlags()
  if (!flags.communityEnabled) notFound()

  return (
    <RequirePremium
      title="Editar perfil"
      description="Personalize seu perfil na Comunidade Veritas."
    >
      <ProfileEditor />
    </RequirePremium>
  )
}
