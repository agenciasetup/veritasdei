'use client'

import { useState } from 'react'
import { GraduationCap, Trophy, ArrowRight, Lock } from 'lucide-react'
import { useStudyQuizSummary } from '@/lib/study/useStudyQuizSummary'
import { useQuizAttempts } from '@/lib/study/useQuiz'
import StudyQuiz from './StudyQuiz'

interface Props {
  pillarSlug: string
  topicSlug: string
  topicTitle: string
}

/**
 * Card de destaque para abrir a prova do tópico. Renderizado no grid
 * de subtópicos quando o tópico tem quiz publicado. Mostra melhor
 * pontuação do usuário e se ele já gabaritou.
 *
 * O backend indexa quizzes por content_ref = "topic:<topic-slug>" —
 * o fix deste sprint (antes o reader passava subtopic UUID e a prova
 * nunca aparecia).
 */
export default function StudyTopicQuizCard({ pillarSlug, topicSlug, topicTitle }: Props) {
  const contentRef = `topic:${topicSlug}`
  const { quiz, loading } = useStudyQuizSummary(pillarSlug, contentRef)
  const { bestScore, hasPerfect } = useQuizAttempts(quiz?.id ?? null)
  const [open, setOpen] = useState(false)

  if (loading) return null
  if (!quiz) return null

  const isGabaritado = hasPerfect

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl p-5 md:p-6 transition-all active:scale-[0.99] relative overflow-hidden group"
        style={{
          background: isGabaritado
            ? 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(127,29,29,0.08))'
            : 'linear-gradient(135deg, rgba(127,29,29,0.20), rgba(15,14,12,0.6))',
          border: `1px solid ${isGabaritado ? 'rgba(201,168,76,0.40)' : 'rgba(127,29,29,0.40)'}`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isGabaritado
                ? 'rgba(201,168,76,0.18)'
                : 'rgba(127,29,29,0.25)',
              border: `1px solid ${isGabaritado ? 'rgba(201,168,76,0.4)' : 'rgba(127,29,29,0.5)'}`,
            }}
          >
            {isGabaritado ? (
              <Trophy className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            ) : (
              <GraduationCap className="w-5 h-5" style={{ color: 'var(--wine-light)' }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] tracking-[0.2em] uppercase mb-1"
              style={{
                color: isGabaritado ? 'var(--accent)' : 'var(--wine-light)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Prova do tópico
            </p>
            <h3
              className="text-base md:text-lg font-semibold leading-snug"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {quiz.title.replace(/^Prova:\s*/i, '') || topicTitle}
            </h3>
            {quiz.description ? (
              <p
                className="text-xs mt-1.5 line-clamp-2 max-w-2xl"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                {quiz.description}
              </p>
            ) : null}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
              >
                <Lock className="w-3 h-3" />
                Aprovado com {quiz.passing_score}%
              </span>
              {quiz.xp_bonus > 0 ? (
                <span
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  +{quiz.xp_bonus} XP
                </span>
              ) : null}
              {bestScore > 0 ? (
                <span
                  style={{
                    color: isGabaritado ? 'var(--accent)' : 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Melhor: {bestScore}%{isGabaritado ? ' · gabaritado' : ''}
                </span>
              ) : null}
            </div>
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0 mt-1.5 transition-transform group-hover:translate-x-1"
            style={{ color: isGabaritado ? 'var(--accent)' : 'var(--wine-light)' }}
          />
        </div>
      </button>

      <StudyQuiz open={open} onClose={() => setOpen(false)} quiz={quiz} />
    </>
  )
}
