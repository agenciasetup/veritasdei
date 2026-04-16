import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NovenaCustomRecord } from '@/features/novenas/data/types'

export const metadata = {
  title: 'Novenas Personalizadas — Veritas Dei',
  description: 'Suas novenas criadas manualmente.',
}

export const dynamic = 'force-dynamic'

export default async function CustomNovenasPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/novenas/custom')
  }

  const { data, error } = await supabase
    .from('novenas_custom')
    .select('id, user_id, titulo, descricao, arquivada, created_at, updated_at')
    .eq('user_id', user.id)
    .order('arquivada', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[novenas/custom] select error', error)
  }

  const novenas = (data ?? []) as NovenaCustomRecord[]

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
            Novenas Personalizadas
          </h1>
          <p className="mt-2 text-xs md:text-sm" style={{ color: '#7A7368' }}>
            Crie e gerencie suas próprias novenas
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <div className="mb-6 text-center">
          <Link
            href="/novenas/custom/nova"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold transition"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
            }}
          >
            Criar nova novena
          </Link>
        </div>

        {novenas.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#7A7368' }}>
              Você ainda não criou nenhuma novena personalizada.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {novenas.map((novena) => (
              <div
                key={novena.id}
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(20, 18, 14, 0.6)',
                  border: '1px solid rgba(201, 168, 76, 0.18)',
                  opacity: novena.arquivada ? 0.5 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2
                      className="text-lg"
                      style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
                    >
                      {novena.titulo}
                      {novena.arquivada && (
                        <span className="ml-2 text-xs" style={{ color: '#7A7368' }}>(arquivada)</span>
                      )}
                    </h2>
                    {novena.descricao && (
                      <p className="mt-1 text-xs line-clamp-2" style={{ color: '#7A7368' }}>
                        {novena.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/novenas/custom/${novena.id}/editar`}
                    className="rounded-lg border px-3 py-1.5 text-xs transition"
                    style={{ borderColor: 'rgba(201, 168, 76, 0.25)', color: '#D9C077' }}
                  >
                    Editar
                  </Link>
                  <CustomNovenaActions novenaId={novena.id} arquivada={novena.arquivada} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/novenas"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.35)', color: '#D9C077' }}
          >
            Catálogo
          </Link>
          <Link
            href="/novenas/minhas"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{ borderColor: 'rgba(201, 168, 76, 0.15)', color: '#7A7368' }}
          >
            Em curso
          </Link>
        </div>
      </div>
    </main>
  )
}

function CustomNovenaActions({ novenaId, arquivada }: { novenaId: string; arquivada: boolean }) {
  return <CustomNovenaActionsClient novenaId={novenaId} arquivada={arquivada} />
}

function CustomNovenaActionsClient({ novenaId, arquivada }: { novenaId: string; arquivada: boolean }) {
  // Server component can't have interactivity, so we use a simple form approach
  // For start/archive actions, we'll use inline client components
  return (
    <>
      <StartCustomNovenaButton novenaId={novenaId} />
      <ArchiveButton novenaId={novenaId} arquivada={arquivada} />
    </>
  )
}

// These need to be client components but are small enough to inline
import { StartCustomNovenaButton } from '@/features/novenas/components/StartCustomNovenaButton'
import { ArchiveButton } from '@/features/novenas/components/ArchiveButton'
