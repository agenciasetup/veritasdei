import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  published: { color: '#4ade80', label: 'Publicado' },
  review: { color: '#C9A84C', label: 'Em revisão' },
  draft: { color: '#B8A488', label: 'Rascunho' },
  archived: { color: '#7A7368', label: 'Arquivado' },
  empty: { color: '#7A7368', label: 'Sem conteúdo' },
}

export default async function AdminEstudosPilar({
  params,
}: {
  params: Promise<{ pilar: string }>
}) {
  const userId = await requireSystemAdmin()
  if (!userId) redirect('/')

  const { pilar } = await params
  const supabase = await createServerSupabaseClient()

  const { data: group } = await supabase
    .from('content_groups')
    .select('id, slug, title, subtitle')
    .eq('slug', pilar)
    .maybeSingle()
  if (!group) notFound()

  const { data: topics } = await supabase
    .from('content_topics')
    .select('id, slug, title, sort_order')
    .eq('group_id', group.id)
    .eq('visible', true)
    .order('sort_order')

  const topicIds = (topics || []).map((t) => t.id)
  const { data: subtopics } = await supabase
    .from('content_subtopics')
    .select('id, topic_id, slug, title, sort_order')
    .in('topic_id', topicIds.length ? topicIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('visible', true)
    .order('sort_order')

  const subIds = (subtopics || []).map((s) => s.id)
  const { data: deepdives } = await supabase
    .from('content_deepdive')
    .select('id, content_ref, status')
    .eq('content_type', pilar)
    .in(
      'content_ref',
      subIds.length ? subIds : ['00000000-0000-0000-0000-000000000000'],
    )

  const statusByRef = new Map<string, string>()
  const idByRef = new Map<string, string>()
  for (const d of deepdives || []) {
    statusByRef.set(d.content_ref, d.status)
    idByRef.set(d.content_ref, d.id)
  }

  const subsByTopic = new Map<string, typeof subtopics>()
  for (const s of subtopics || []) {
    if (!subsByTopic.has(s.topic_id)) subsByTopic.set(s.topic_id, [])
    subsByTopic.get(s.topic_id)!.push(s)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href="/admin/estudos"
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: 'var(--gold)', fontFamily: 'Poppins, sans-serif' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Todos os pilares
      </Link>

      <h1
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
      >
        {group.title}
      </h1>
      {group.subtitle ? (
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          {group.subtitle}
        </p>
      ) : null}

      <div className="space-y-6">
        {(topics || []).map((t) => (
          <section key={t.id}>
            <h2
              className="text-sm tracking-[0.15em] uppercase mb-3"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
            >
              {t.title}
            </h2>
            <ul className="space-y-2">
              {(subsByTopic.get(t.id) || []).map((s) => {
                const status = statusByRef.get(s.id) || 'empty'
                const style = STATUS_STYLE[status] || STATUS_STYLE.empty
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{
                      background: 'rgba(20,18,14,0.5)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    <div>
                      <Link
                        href={`/admin/estudos/${pilar}/${s.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {s.title}
                      </Link>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {s.slug}
                      </p>
                    </div>
                    <span
                      className="text-[11px] tracking-[0.1em] uppercase px-2 py-1 rounded"
                      style={{
                        color: style.color,
                        background: `${style.color}15`,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {style.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
