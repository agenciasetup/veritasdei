import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, GraduationCap } from 'lucide-react'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminProvasNewButton from './AdminProvasNewButton'

export const dynamic = 'force-dynamic'

interface QuizRow {
  id: string
  content_type: string
  content_ref: string
  title: string
  passing_score: number
  status: string
  updated_at: string
  question_count: number
}

export default async function AdminProvasIndex() {
  const userId = await requireSystemAdmin()
  if (!userId) redirect('/')

  const supabase = await createServerSupabaseClient()
  const { data: quizzes } = await supabase
    .from('study_quizzes')
    .select(
      'id, content_type, content_ref, title, passing_score, status, updated_at',
    )
    .order('content_type', { ascending: true })
    .order('title', { ascending: true })

  const rows = (quizzes ?? []) as Omit<QuizRow, 'question_count'>[]
  const { data: counts } = await supabase
    .from('study_quiz_questions')
    .select('quiz_id')
  const countByQuiz = new Map<string, number>()
  for (const c of (counts ?? []) as Array<{ quiz_id: string }>) {
    countByQuiz.set(c.quiz_id, (countByQuiz.get(c.quiz_id) ?? 0) + 1)
  }

  const byType = new Map<string, QuizRow[]>()
  for (const q of rows) {
    const enriched: QuizRow = { ...q, question_count: countByQuiz.get(q.id) ?? 0 }
    if (!byType.has(q.content_type)) byType.set(q.content_type, [])
    byType.get(q.content_type)!.push(enriched)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-3xl font-bold inline-flex items-center gap-3"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
          >
            <GraduationCap className="w-7 h-7" style={{ color: 'var(--gold)' }} />
            Provas · Administração
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
          >
            {rows.length} {rows.length === 1 ? 'prova cadastrada' : 'provas cadastradas'}. Edite questões, passing score, publique ou arquive.
          </p>
        </div>
        <AdminProvasNewButton />
      </header>

      <div className="space-y-8">
        {Array.from(byType.entries()).map(([contentType, items]) => (
          <section key={contentType}>
            <h2
              className="text-xs tracking-[0.2em] uppercase mb-3"
              style={{ color: 'var(--gold)', fontFamily: 'Poppins, sans-serif' }}
            >
              {contentType}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/provas/${q.id}`}
                  className="block rounded-xl p-4 transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="text-sm font-semibold truncate"
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'Cinzel, serif',
                      }}
                    >
                      {q.title}
                    </h3>
                    <StatusBadge status={q.status} />
                  </div>
                  <p
                    className="text-[11px] mt-1 truncate"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {q.content_ref}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-[11px]">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {q.question_count} {q.question_count === 1 ? 'questão' : 'questões'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Passa com {q.passing_score}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {rows.length === 0 ? (
          <p
            className="text-center py-16 rounded-xl"
            style={{
              background: 'var(--surface-2)',
              border: '1px dashed var(--border-1)',
              color: 'var(--text-muted)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Nenhuma prova criada ainda. Clique em <Plus className="w-3.5 h-3.5 inline" /> Nova prova para começar.
          </p>
        ) : null}
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Rascunho', color: '#938B80', bg: 'rgba(147,139,128,0.1)' },
    review: { label: 'Revisão', color: '#C88B7C', bg: 'rgba(200,139,124,0.12)' },
    published: { label: 'Publicada', color: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
    archived: { label: 'Arquivada', color: '#938B80', bg: 'rgba(147,139,128,0.08)' },
  }
  const m = map[status] ?? map.draft
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded uppercase tracking-[0.1em] flex-shrink-0"
      style={{
        color: m.color,
        background: m.bg,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {m.label}
    </span>
  )
}
