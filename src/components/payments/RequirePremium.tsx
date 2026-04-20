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
  title = 'Formação Premium',
  description = 'Trilhas guiadas com quiz, dogmas, sacramentos, São Tomás e doutores da Igreja. Estudo aprofundado para católicos que querem crescer na fé.',
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

function PremiumBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] tracking-[0.14em] uppercase mb-4"
      style={{
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
      }}
    >
      <Sparkles className="w-3 h-3" />
      Premium
    </span>
  )
}

function LoginCTA() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div
        className="max-w-md w-full p-8 rounded-3xl text-center"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}
        >
          <Lock className="w-5 h-5" />
        </div>
        <h1
          className="text-2xl tracking-[0.08em] uppercase mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontWeight: 700 }}
        >
          Entre para continuar
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Faça login para acessar a Formação Premium.
        </p>
        <Link
          href="/login?next=/planos"
          className="inline-block w-full px-6 py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            fontFamily: 'var(--font-body)',
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
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <PremiumBadge />
        <h1
          className="text-2xl md:text-[28px] tracking-[0.08em] uppercase mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontWeight: 700, lineHeight: 1.15 }}
        >
          {title}
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          {description}
        </p>
        <Link
          href="/planos"
          className="inline-block w-full px-6 py-3 rounded-xl text-sm mb-2 active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}
        >
          Ver planos
        </Link>
        <Link
          href="/rezar"
          className="inline-block w-full text-xs py-2"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Voltar
        </Link>
      </div>
    </main>
  )
}
