import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { JuntosLanding } from '@/features/rosario/components/JuntosLanding'

export const metadata = {
  title: 'Terço compartilhado — Veritas Dei',
  description: 'Reze o terço em tempo real com outras pessoas. Crie uma sala ou entre por código.',
}

// A página depende da sessão do usuário.
export const dynamic = 'force-dynamic'

/**
 * `/rosario/juntos` — landing do terço compartilhado (Marco 3).
 *
 * Server component: verifica autenticação. Se logado, renderiza o
 * `<JuntosLanding />` client que permite criar uma sala ou entrar
 * por código. Se não logado, mostra CTA de login com retorno.
 */
export default async function JuntosPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <UnauthenticatedView />
  }

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <h1
            className="font-serif text-3xl md:text-4xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Terço compartilhado
          </h1>
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#7A7368' }}>
            Reze junto, em tempo real
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <JuntosLanding />

        <div className="mt-8 flex justify-center">
          <Link
            href="/rosario"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Voltar ao terço
          </Link>
        </div>
      </div>
    </main>
  )
}

function UnauthenticatedView() {
  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />
      <div className="relative z-10 mx-auto max-w-md text-center">
        <h1
          className="font-serif text-3xl md:text-4xl"
          style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
        >
          Terço compartilhado
        </h1>
        <p className="mt-4 text-sm" style={{ color: '#F2EDE4' }}>
          Para rezar em comunhão com outras pessoas, entre com sua conta.
        </p>
        <p className="mt-2 text-xs" style={{ color: '#7A7368' }}>
          O terço solo continua funcionando sem conta, em{' '}
          <Link href="/rosario" className="underline" style={{ color: '#D9C077' }}>
            /rosario
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?redirectTo=/rosario/juntos"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
            }}
          >
            Entrar
          </Link>
          <Link
            href="/rosario"
            className="rounded-lg border px-5 py-2.5 text-sm"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Voltar ao terço
          </Link>
        </div>
      </div>
    </main>
  )
}
