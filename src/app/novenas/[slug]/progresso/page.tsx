import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getNovenaBySlugl } from '@/features/novenas/data/catalog'
import { NovenaPrayerView } from '@/features/novenas/components/NovenaPrayerView'
import type { NovenaProgressRecord, NovenaDailyLogRecord } from '@/features/novenas/data/types'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const novena = getNovenaBySlugl(slug)
  if (!novena) return { title: 'Novena — Veritas Dei' }
  return {
    title: `${novena.titulo} — Progresso — Veritas Dei`,
    description: `Reze a ${novena.titulo} dia a dia.`,
  }
}

export default async function NovenaProgressoPage({ params }: Props) {
  const { slug } = await params
  const novena = getNovenaBySlugl(slug)

  if (!novena) {
    redirect('/novenas')
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=/novenas/${slug}/progresso`)
  }

  // Buscar progresso ativo mais recente para essa novena builtin
  const { data: progressList } = await supabase
    .from('novenas_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('builtin_slug', slug)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  const progress = (progressList?.[0] ?? null) as NovenaProgressRecord | null

  if (!progress) {
    // Sem progresso ativo — voltar para a página de detalhe
    return (
      <main
        className="relative min-h-screen w-full px-4 py-10 md:py-14"
        style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
      >
        <div className="bg-glow" aria-hidden />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <h1
            className="text-2xl md:text-3xl"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            {novena.titulo}
          </h1>
          <p className="mt-4 text-sm" style={{ color: '#B8AFA2' }}>
            Você ainda não iniciou esta novena.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/novenas/${slug}`}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Iniciar novena
            </Link>
            <Link
              href="/novenas"
              className="rounded-lg border px-5 py-2.5 text-sm transition"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.35)',
                color: '#D9C077',
              }}
            >
              Voltar ao catálogo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Buscar daily logs
  const { data: logs } = await supabase
    .from('novenas_daily_log')
    .select('id, day_number, prayed_at')
    .eq('progress_id', progress.id)
    .order('day_number', { ascending: true })

  const dailyLogs = (logs ?? []) as Pick<NovenaDailyLogRecord, 'id' | 'day_number' | 'prayed_at'>[]

  return (
    <NovenaPrayerView
      novena={novena}
      progress={progress}
      dailyLogs={dailyLogs}
    />
  )
}
