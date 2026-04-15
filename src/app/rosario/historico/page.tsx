import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { HistoryList } from '@/features/rosario/components/HistoryList'
import { HistoryStats } from '@/features/rosario/components/HistoryStats'
import type { RosarySessionWithIntention } from '@/features/rosario/data/historyTypes'

export const metadata = {
  title: 'Histórico do Terço — Veritas Dei',
  description: 'Histórico dos seus terços rezados e estatísticas pessoais.',
}

// Histórico depende do usuário autenticado — precisa ser dinâmico.
export const dynamic = 'force-dynamic'

/**
 * `/rosario/historico` — página de histórico pessoal.
 *
 * Server component: busca direto do Supabase usando a sessão do cookie.
 * Se o usuário não estiver logado, mostra CTA para login com retorno.
 * Caso contrário, renderiza `<HistoryStats />` + `<HistoryList />` com as
 * últimas 200 sessões (ordenadas por `completed_at DESC`).
 */
export default async function HistoricoPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <UnauthenticatedView />
  }

  const { data, error } = await supabase
    .from('rosary_sessions')
    .select(
      `id, user_id, mystery_set, intention_id, sala_id, started_at, completed_at, duration_seconds, created_at,
       intention:rosary_intentions ( id, titulo )`,
    )
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[rosario/historico] select error', error)
    return <ErrorView message={error.message} />
  }

  const sessions = (data ?? []) as unknown as RosarySessionWithIntention[]

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
            Histórico do Terço
          </h1>
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#7A7368' }}>
            Suas sessões rezadas e contagem pessoal
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <div className="mb-6">
          <HistoryStats sessions={sessions} />
        </div>

        <HistoryList sessions={sessions} />

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
          Histórico do Terço
        </h1>
        <p className="mt-4 text-sm" style={{ color: '#F2EDE4' }}>
          Para guardar seu histórico e estatísticas pessoais, entre com sua conta.
        </p>
        <p className="mt-2 text-xs" style={{ color: '#7A7368' }}>
          O terço em si continua funcionando sem conta, aqui em{' '}
          <Link href="/rosario" className="underline" style={{ color: '#D9C077' }}>
            /rosario
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?redirectTo=/rosario/historico"
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

function ErrorView({ message }: { message: string }) {
  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="relative z-10 mx-auto max-w-md text-center">
        <h1
          className="font-serif text-2xl"
          style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
        >
          Não foi possível carregar o histórico
        </h1>
        <p className="mt-3 text-xs" style={{ color: '#7A7368' }}>
          {message}
        </p>
        <div className="mt-6 flex justify-center">
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
