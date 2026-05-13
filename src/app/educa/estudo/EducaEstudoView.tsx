'use client'

/**
 * EducaEstudoView — hub de estudo do Veritas Educa.
 *
 * Composição que reusa hooks existentes do Veritas Dei: nada novo no
 * banco, só nova UI focada no que importa pro Educa (sem comunidade).
 *
 * Sections:
 *  1. Continue de onde parou — useLastStudied → link pra /estudo/{pillar}
 *  2. Pilares de estudo — useMyStudyRecent.pillars → /estudo/{slug}
 *  3. Provas recentes — useMyStudyRecent.attempts
 *  4. Selos — useReliquias preview (link pra perfil)
 *  5. Grupos de estudo — atalho pra /estudo/grupos
 */

import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Loader2,
  NotebookPen,
  Trophy,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyStudyRecent } from '@/lib/study/useMyStudyRecent'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useReliquias } from '@/lib/gamification/useReliquias'
import ProgressTrack from '@/components/study/ProgressTrack'

export default function EducaEstudoView() {
  const { user } = useAuth()
  const { last, loading: lastLoading } = useLastStudied(user?.id)
  const { attempts, pillars, loading: recentLoading } = useMyStudyRecent()
  const { catalog, unlockedIds, loading: relLoading } = useReliquias(user?.id)

  const recentSelos = catalog
    .filter((r) => unlockedIds.has(r.id))
    .slice(0, 6)

  return (
    <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:py-8 space-y-4">
      <header className="px-1">
        <h1
          className="text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
        >
          Seu estudo
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Continue de onde parou, veja seu progresso e ganhe selos.
        </p>
      </header>

      {/* 1. Continue de onde parou */}
      {lastLoading ? (
        <Skeleton h={88} />
      ) : last ? (
        <Link
          href={`/estudo/${last.groupSlug}`}
          className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-1)',
              }}
            >
              <NotebookPen
                className="w-5 h-5"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] tracking-[0.15em] uppercase mb-0.5"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Continue de onde parou
              </p>
              <p
                className="text-sm truncate"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {last.subtopicTitle}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {last.groupTitle}
              </p>
            </div>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0 self-center"
              style={{ color: 'var(--text-3)' }}
            />
          </div>
        </Link>
      ) : null}

      {/* 2. Pilares */}
      <section>
        <h2
          className="text-xs tracking-[0.15em] uppercase mb-2.5 px-1"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Pilares de estudo
        </h2>
        {recentLoading ? (
          <PillarsSkeleton />
        ) : pillars.length === 0 ? (
          <EmptyState text="Comece estudando — os pilares aparecem aqui." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pillars.map((p) => {
              const percent =
                p.total > 0 ? Math.round((p.studied / p.total) * 100) : 0
              return (
                <Link
                  key={p.slug}
                  href={`/estudo/${p.slug}`}
                  className="rounded-2xl p-4 active:scale-[0.99] transition-transform"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: 'var(--text-1)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {p.title}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {percent}%
                    </span>
                  </div>
                  <ProgressTrack
                    percent={percent}
                    label={`${p.studied}/${p.total}`}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. Provas recentes */}
      {attempts.length > 0 && (
        <section>
          <h2
            className="text-xs tracking-[0.15em] uppercase mb-2.5 px-1 flex items-center gap-2"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Trophy className="w-3.5 h-3.5" />
            Provas recentes
          </h2>
          <ul className="space-y-2">
            {attempts.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="rounded-2xl p-3 flex items-center justify-between"
                style={{
                  background: 'var(--surface-2)',
                  border: `1px solid ${
                    a.passed
                      ? 'color-mix(in srgb, var(--success) 25%, transparent)'
                      : 'var(--border-1)'
                  }`,
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {a.quiz_title}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {new Date(a.completed_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span
                  className="text-lg flex-shrink-0 ml-3"
                  style={{
                    color: a.passed ? 'var(--accent)' : 'var(--text-3)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                  }}
                >
                  {a.score}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Selos / Relíquias */}
      <section>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2
            className="text-xs tracking-[0.15em] uppercase flex items-center gap-2"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Selos desbloqueados
          </h2>
          <Link
            href="/educa/perfil"
            className="text-xs flex items-center gap-0.5"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {relLoading ? (
          <Skeleton h={84} />
        ) : recentSelos.length === 0 ? (
          <EmptyState text="Conclua estudos e provas pra desbloquear selos." />
        ) : (
          <div
            className="rounded-2xl p-3 flex flex-wrap gap-2"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
            }}
          >
            {recentSelos.map((r) => (
              <span
                key={r.id}
                title={r.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs"
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                {r.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 5. Grupos de estudo */}
      <Link
        href="/estudo/grupos"
        className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium mb-0.5"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Grupos de estudo
            </p>
            <p
              className="text-xs"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Estude com outras pessoas — entre num grupo por código.
            </p>
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--text-3)' }}
          />
        </div>
      </Link>
    </main>
  )
}

function Skeleton({ h }: { h: number }) {
  return (
    <div
      className="rounded-2xl animate-pulse"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
        height: h,
      }}
    />
  )
}

function PillarsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <Skeleton h={76} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <BookOpen
        className="w-5 h-5 mx-auto mb-2"
        style={{ color: 'var(--text-3)' }}
      />
      <p
        className="text-sm"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {text}
      </p>
    </div>
  )
}
