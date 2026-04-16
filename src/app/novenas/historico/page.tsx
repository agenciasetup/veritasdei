import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NOVENAS_CATALOG } from '@/features/novenas/data/catalog'
import type { NovenaProgressRecord } from '@/features/novenas/data/types'

export const metadata = {
  title: 'Histórico de Novenas — Veritas Dei',
  description: 'Novenas concluídas e seu histórico de oração.',
}

export const dynamic = 'force-dynamic'

interface ProgressWithCustom extends NovenaProgressRecord {
  custom_novena?: { id: string; titulo: string } | null
}

export default async function HistoricoNovenasPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main
        className="relative min-h-screen w-full px-4 py-10 md:py-14"
        style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
      >
        <div className="bg-glow" aria-hidden />
        <div className="relative z-10 mx-auto max-w-md text-center">
          <h1
            className="text-3xl md:text-4xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Histórico de Novenas
          </h1>
          <p className="mt-4 text-sm" style={{ color: '#B8AFA2' }}>
            Entre com sua conta para ver suas novenas concluídas.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?redirectTo=/novenas/historico"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Entrar
            </Link>
            <Link
              href="/novenas"
              className="rounded-lg border px-5 py-2.5 text-sm transition"
              style={{ borderColor: 'rgba(201, 168, 76, 0.35)', color: '#D9C077' }}
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('novenas_progress')
    .select(`
      id, user_id, builtin_slug, custom_novena_id,
      current_day, started_at, last_prayed_at, completed_at, created_at,
      custom_novena:novenas_custom ( id, titulo )
    `)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[novenas/historico] select error', error)
  }

  const completed = (data ?? []) as unknown as ProgressWithCustom[]
  const catalogMap = new Map(NOVENAS_CATALOG.map(n => [n.slug, n]))

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <h1
            className="text-3xl md:text-4xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Histórico de Novenas
          </h1>
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#7A7368' }}>
            Novenas concluídas
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        {/* Stats */}
        <div
          className="rounded-2xl p-5 mb-6 grid grid-cols-2 gap-4"
          style={{
            background: 'rgba(20, 18, 14, 0.6)',
            border: '1px solid rgba(201, 168, 76, 0.18)',
          }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              {completed.length}
            </p>
            <p className="text-xs" style={{ color: '#7A7368' }}>
              Novenas concluídas
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              {completed.length * 9}
            </p>
            <p className="text-xs" style={{ color: '#7A7368' }}>
              Dias de oração
            </p>
          </div>
        </div>

        {completed.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#7A7368' }}>
              Nenhuma novena concluída ainda.
            </p>
            <Link
              href="/novenas"
              className="inline-block mt-4 rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Escolher uma novena
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {completed.map((progress) => {
              const builtin = progress.builtin_slug
                ? catalogMap.get(progress.builtin_slug)
                : null
              const titulo = builtin?.titulo ?? progress.custom_novena?.titulo ?? 'Novena personalizada'
              const completedDate = progress.completed_at
                ? new Date(progress.completed_at).toLocaleDateString('pt-BR')
                : ''
              const startDate = new Date(progress.started_at).toLocaleDateString('pt-BR')

              return (
                <div
                  key={progress.id}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(20, 18, 14, 0.4)',
                    border: '1px solid rgba(201, 168, 76, 0.1)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
                      {titulo}
                    </h3>
                    <span className="text-xs" style={{ color: '#C9A84C' }}>
                      &#10003; Concluída
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: '#7A7368' }}>
                    {startDate} &rarr; {completedDate}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/novenas/minhas"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.35)', color: '#D9C077' }}
          >
            Em curso
          </Link>
          <Link
            href="/novenas"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.15)', color: '#7A7368' }}
          >
            Catálogo
          </Link>
        </div>
      </div>
    </main>
  )
}
