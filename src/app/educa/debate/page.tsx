/**
 * /educa/debate — Modo Debate IA do Veritas Educa.
 *
 * Server component: protege rota, passa lista de temas pra UI.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DEBATE_TOPICS } from '@/lib/educa/debate-prompts'
import DebateRoom from './DebateRoom'

export const dynamic = 'force-dynamic'

export default async function DebatePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/educa/debate')
  }

  return (
    <DebateRoom
      topics={DEBATE_TOPICS.map((t) => ({
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
      }))}
    />
  )
}
