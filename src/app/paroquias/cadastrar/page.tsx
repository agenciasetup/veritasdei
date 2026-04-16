import AuthGuard from '@/components/auth/AuthGuard'
import CadastrarWizard from './CadastrarWizard'

export default function CadastrarParoquiaPage() {
  return (
    <AuthGuard>
      <CadastrarWizard />
    </AuthGuard>
  )
}
