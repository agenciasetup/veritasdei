import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NovenaPrayerView } from '@/features/novenas/components/NovenaPrayerView'
import type { NovenaBuiltin, NovenaProgressRecord, NovenaDailyLogRecord, NovenaCustomRecord } from '@/features/novenas/data/types'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Novena Personalizada — Progresso — Veritas Dei',
  description: 'Reze sua novena personalizada dia a dia.',
}

export default async function CustomNovenaProgressoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=/novenas/custom/${id}/progresso`)
  }

  // Buscar a novena custom
  const { data: customNovena } = await supabase
    .from('novenas_custom')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!customNovena) {
    redirect('/novenas/custom')
  }

  const record = customNovena as unknown as NovenaCustomRecord

  // Converter custom para o formato NovenaBuiltin para reutilizar NovenaPrayerView
  const novenaAsBuiltin: NovenaBuiltin = {
    slug: `custom-${record.id}`,
    titulo: record.titulo,
    subtitulo: 'Novena personalizada',
    descricao: record.descricao ?? '',
    periodoSugerido: '',
    dias: record.dias as NovenaBuiltin['dias'],
  }

  // Buscar progresso ativo
  const { data: progressList } = await supabase
    .from('novenas_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('custom_novena_id', id)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  const progress = (progressList?.[0] ?? null) as NovenaProgressRecord | null

  if (!progress) {
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
            {record.titulo}
          </h1>
          <p className="mt-4 text-sm" style={{ color: '#B8AFA2' }}>
            Você ainda não iniciou esta novena.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/novenas/custom"
              className="rounded-lg border px-5 py-2.5 text-sm transition"
              style={{ borderColor: 'rgba(201, 168, 76, 0.35)', color: '#D9C077' }}
            >
              Voltar
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
      novena={novenaAsBuiltin}
      progress={progress}
      dailyLogs={dailyLogs}
    />
  )
}
