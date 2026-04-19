import { redirect, notFound } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminEstudoEditorClient from './AdminEstudoEditorClient'

export const dynamic = 'force-dynamic'

export default async function AdminEstudosSubtopicPage({
  params,
}: {
  params: Promise<{ pilar: string; subtopic_id: string }>
}) {
  const userId = await requireSystemAdmin()
  if (!userId) redirect('/')

  const { pilar, subtopic_id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: subtopic } = await supabase
    .from('content_subtopics')
    .select('id, title, description, topic_id')
    .eq('id', subtopic_id)
    .maybeSingle()
  if (!subtopic) notFound()

  const { data: deepdive } = await supabase
    .from('content_deepdive')
    .select('*')
    .eq('content_type', pilar)
    .eq('content_ref', subtopic_id)
    .maybeSingle()

  return (
    <AdminEstudoEditorClient
      pillarSlug={pilar}
      subtopic={subtopic}
      initialDeepdive={deepdive || null}
    />
  )
}
