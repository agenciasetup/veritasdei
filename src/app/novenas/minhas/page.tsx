import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NOVENAS_CATALOG } from '@/features/novenas/data/catalog'
import type { NovenaProgressRecord } from '@/features/novenas/data/types'

export const metadata = {
  title: 'Minhas Novenas — Veritas Dei',
  description: 'Novenas em curso e seu progresso diário.',
}

export const dynamic = 'force-dynamic'

interface ProgressWithCustom extends NovenaProgressRecord {
  custom_novena?: { id: string; titulo: string; descricao: string | null } | null
  daily_logs?: { day_number: number; prayed_at: string }[]
}

export default async function MinhasNovenasPage() {
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
            Minhas Novenas
          </h1>
          <p className="mt-4 text-sm" style={{ color: '#B8AFA2' }}>
            Entre com sua conta para acompanhar suas novenas em curso.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?redirectTo=/novenas/minhas"
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
      id, user_id, builtin_slug, custom_novena_id, intention_id,
      current_day, started_at, last_prayed_at, completed_at, created_at, updated_at,
      custom_novena:novenas_custom ( id, titulo, descricao ),
      daily_logs:novenas_daily_log ( day_number, prayed_at )
    `)
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[novenas/minhas] select error', error)
  }

  const activeNovenas = (data ?? []) as unknown as ProgressWithCustom[]

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
            Minhas Novenas
          </h1>
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#7A7368' }}>
            Novenas em curso
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        {activeNovenas.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#7A7368' }}>
              Nenhuma novena em curso.
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
          <div className="grid gap-4">
            {activeNovenas.map((progress) => {
              const builtin = progress.builtin_slug
                ? catalogMap.get(progress.builtin_slug)
                : null
              const titulo = builtin?.titulo ?? progress.custom_novena?.titulo ?? 'Novena personalizada'
              const subtitulo = builtin?.subtitulo ?? progress.custom_novena?.descricao ?? ''
              const slug = progress.builtin_slug
              const prayedDays = progress.daily_logs?.length ?? 0

              return (
                <Link
                  key={progress.id}
                  href={slug ? `/novenas/${slug}/progresso` : `/novenas/custom/${progress.custom_novena_id}/progresso`}
                  className="block rounded-2xl p-5 transition-all hover:scale-[1.01]"
                  style={{
                    background: 'rgba(20, 18, 14, 0.6)',
                    border: '1px solid rgba(201, 168, 76, 0.18)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2
                        className="text-lg"
                        style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
                      >
                        {titulo}
                      </h2>
                      {subtitulo && (
                        <p className="mt-1 text-xs line-clamp-1" style={{ color: '#D9C077' }}>
                          {subtitulo}
                        </p>
                      )}
                    </div>
                    <div
                      className="ml-3 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: 'rgba(201, 168, 76, 0.15)',
                        color: '#C9A84C',
                      }}
                    >
                      Dia {progress.current_day}/9
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="flex gap-1.5 mt-3">
                    {Array.from({ length: 9 }, (_, i) => {
                      const dayNum = i + 1
                      const isPrayed = progress.daily_logs?.some(l => l.day_number === dayNum)
                      const isCurrent = dayNum === progress.current_day
                      return (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full"
                          style={{
                            background: isPrayed
                              ? '#C9A84C'
                              : isCurrent
                                ? 'rgba(201, 168, 76, 0.35)'
                                : 'rgba(242, 237, 228, 0.08)',
                          }}
                        />
                      )
                    })}
                  </div>

                  <p className="mt-2 text-xs" style={{ color: '#7A7368' }}>
                    {prayedDays} de 9 dias rezados
                    {progress.last_prayed_at && (
                      <> &middot; Última oração: {new Date(progress.last_prayed_at).toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/novenas"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.35)', color: '#D9C077' }}
          >
            Catálogo de novenas
          </Link>
          <Link
            href="/novenas/custom"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.25)', color: '#B8AFA2' }}
          >
            Personalizadas
          </Link>
          <Link
            href="/novenas/historico"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.15)', color: '#7A7368' }}
          >
            Histórico
          </Link>
        </div>
      </div>
    </main>
  )
}
