/**
 * Server Component — gate para features pagas.
 *
 * Uso:
 * ```tsx
 * export default function TrilhasPage() {
 *   return (
 *     <RequirePremium>
 *       <TrilhasContent />
 *     </RequirePremium>
 *   )
 * }
 * ```
 *
 * Se o usuário não tem entitlement premium ativo, renderiza a tela de
 * upsell (com link pra /planos). Se tem, renderiza children.
 *
 * Não usa redirect — mostra o upsell inline para dar melhor UX
 * (usuário não perde a URL que ele quis visitar).
 */

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getEntitlement } from '@/lib/payments/entitlements'

type Props = {
  children: ReactNode
  /** Título mostrado no upsell. Default: "Conteúdo Premium" */
  title?: string
  /** Descrição curta do que a rota oferece. */
  description?: string
}

export default async function RequirePremium({
  children,
  title = 'Conteúdo Premium',
  description = 'Esta parte do Veritas Dei faz parte do Modo Estudo — trilhas, dogmas, doutores da Igreja e formação completa.',
}: Props) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Não logado → manda pro login com next
    return <LoginCTA />
  }

  const ent = await getEntitlement(user.id)
  if (ent?.ativo) {
    return <>{children}</>
  }

  return <Upsell title={title} description={description} />
}

function LoginCTA() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div
        className="max-w-md w-full p-8 rounded-3xl text-center"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(201,168,76,0.2)',
        }}
      >
        <Lock className="w-10 h-10 mx-auto mb-4" style={{ color: '#C9A84C' }} />
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          Entre para continuar
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Faça login para acessar o Modo Estudo.
        </p>
        <Link
          href="/login?next=/planos"
          className="inline-block px-6 py-3 rounded-xl text-sm"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            color: '#0F0E0C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
          }}
        >
          Fazer login
        </Link>
      </div>
    </main>
  )
}

function Upsell({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div
        className="max-w-md w-full p-8 rounded-3xl text-center"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}
      >
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.05))',
            border: '1px solid rgba(201,168,76,0.3)',
          }}
        >
          <Sparkles className="w-6 h-6" style={{ color: '#C9A84C' }} />
        </div>
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          {title}
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
        >
          {description}
        </p>
        <Link
          href="/planos"
          className="inline-block w-full px-6 py-3 rounded-xl text-sm mb-2"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            color: '#0F0E0C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
          }}
        >
          Ver planos
        </Link>
        <Link
          href="/"
          className="inline-block w-full text-xs py-2"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Voltar
        </Link>
      </div>
    </main>
  )
}
