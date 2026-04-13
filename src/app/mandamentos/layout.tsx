import RequirePremium from '@/components/payments/RequirePremium'

/**
 * Gate Premium — Modo Estudo.
 * Tudo aninhado nesta rota só renderiza para assinantes ativos.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequirePremium>{children}</RequirePremium>
}
