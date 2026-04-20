'use client'

import Link from 'next/link'
import { NotebookPen, GraduationCap, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import { useMyStudyRecent } from '@/lib/study/useMyStudyRecent'
import XpBar from '@/components/gamification/XpBar'
import ProgressTrack from '@/components/study/ProgressTrack'

export default function MyStudyDashboard() {
  const { user } = useAuth()
  const gami = useGamification(user?.id)
  const { notes, attempts, pillars, loading } = useMyStudyRecent()

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p style={{ color: 'var(--text-muted)' }}>
          Entre na sua conta para acompanhar seu estudo.
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          Meu estudo
        </h1>
        <p
          className="text-sm mt-2"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          Seu progresso em todos os pilares, anotações recentes e histórico de provas.
        </p>
      </header>

      <section
        className="rounded-2xl p-6"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <span
            className="text-xs tracking-[0.15em] uppercase"
            style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
          >
            Nível {gami.level}
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
          >
            {gami.totalXp} XP
          </span>
        </div>
        <XpBar
          level={gami.level}
          xpInLevel={gami.xpInLevel}
          xpToNextLevel={gami.xpToNextLevel}
          percentInLevel={gami.percentInLevel}
          size="md"
          showLabels
        />
        <p
          className="text-xs mt-3"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {gami.unlockedReliquiaIds?.size || 0} relíquias · streak atual{' '}
          {gami.currentStreak || 0} dias
        </p>
      </section>

      <section>
        <h2
          className="text-sm tracking-[0.15em] uppercase mb-4"
          style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
        >
          Progresso por pilar
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Carregando...
          </p>
        ) : pillars.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum pilar encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pillars.map((p) => {
              const percent = p.total > 0 ? Math.round((p.studied / p.total) * 100) : 0
              return (
                <Link
                  key={p.slug}
                  href={`/estudo/${p.slug}`}
                  className="rounded-xl p-4 transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {p.title}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--gold)', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {percent}%
                    </span>
                  </div>
                  <ProgressTrack percent={percent} label={`${p.studied}/${p.total}`} />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentNotes notes={notes} />
        <RecentQuizzes attempts={attempts} />
      </section>
    </main>
  )
}

function RecentNotes({
  notes,
}: {
  notes: Array<{ id: string; content_type: string; content_ref: string; body: string; updated_at: string }>
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <NotebookPen className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        <h2
          className="text-sm tracking-[0.15em] uppercase"
          style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
        >
          Anotações recentes
        </h2>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nenhuma anotação ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg p-3 text-sm"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
              }}
            >
              <p
                className="line-clamp-2"
                style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif' }}
              >
                {n.body}
              </p>
              <div
                className="flex items-center justify-between mt-2 text-[11px]"
                style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
              >
                <span>
                  <BookOpen className="w-3 h-3 inline mr-1" />
                  {n.content_type}
                </span>
                <span>
                  {new Date(n.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecentQuizzes({
  attempts,
}: {
  attempts: Array<{
    id: string
    score: number
    passed: boolean
    completed_at: string
    quiz_title: string
  }>
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-4 h-4" style={{ color: 'var(--wine-light)' }} />
        <h2
          className="text-sm tracking-[0.15em] uppercase"
          style={{ color: 'var(--wine-light)', fontFamily: 'Cinzel, serif' }}
        >
          Provas recentes
        </h2>
      </div>
      {attempts.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nenhuma prova feita ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li
              key={a.id}
              className="rounded-lg p-3 text-sm flex items-center justify-between"
              style={{
                background: 'var(--surface-2)',
                border: `1px solid ${a.passed ? 'rgba(34,197,94,0.2)' : 'rgba(127,29,29,0.2)'}`,
              }}
            >
              <div>
                <p
                  className="font-medium"
                  style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                >
                  {a.quiz_title}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
                >
                  {new Date(a.completed_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span
                className="text-lg"
                style={{
                  color: a.passed ? 'var(--gold)' : 'var(--wine-light)',
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                }}
              >
                {a.score}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
