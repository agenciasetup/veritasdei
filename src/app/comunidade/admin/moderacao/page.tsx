import { notFound } from 'next/navigation'
import RequirePremium from '@/components/payments/RequirePremium'
import ModerationPanel from '@/components/comunidade/ModerationPanel'
import { getCommunityFlags } from '@/lib/community/config'

export const metadata = {
  title: 'Moderação · Comunidade Veritas',
  description: 'Denúncias abertas e ações de moderação.',
}

export default function ModerationPage() {
  const flags = getCommunityFlags()
  if (!flags.communityEnabled) notFound()

  return (
    <RequirePremium
      title="Moderação"
      description="Área restrita para admins e moderadores."
    >
      <ModerationPanel />
    </RequirePremium>
  )
}
