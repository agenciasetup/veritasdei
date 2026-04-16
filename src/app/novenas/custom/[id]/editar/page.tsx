import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NovenaCustomForm } from '@/features/novenas/components/NovenaCustomForm'
import type { NovenaCustomRecord } from '@/features/novenas/data/types'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Editar Novena — Veritas Dei',
  description: 'Edite sua novena personalizada.',
}

export default async function EditarNovenaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=/novenas/custom/${id}/editar`)
  }

  const { data, error } = await supabase
    .from('novenas_custom')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    redirect('/novenas/minhas')
  }

  return <NovenaCustomForm existing={data as unknown as NovenaCustomRecord} />
}
