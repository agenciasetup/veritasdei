import RequirePremium from '@/components/payments/RequirePremium'
import AprenderContent from './AprenderContent'

/**
 * Hub de Aprendizado — Modo Estudo.
 *
 * Desde Fase 3, gateado por assinatura Premium. O RequirePremium
 * renderiza o upsell inline se o usuário não tem plano ativo.
 */
export default function AprenderPage() {
  return (
    <RequirePremium
      title="Modo Estudo"
      description="Trilhas, dogmas, doutores da Igreja e formação completa — tudo no Veritas Dei Premium."
    >
      <AprenderContent />
    </RequirePremium>
  )
}
