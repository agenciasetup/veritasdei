'use client'

import { useMemo, useState } from 'react'
import { X, CheckCircle2, XCircle, Trophy, RotateCcw, GraduationCap } from 'lucide-react'
import { useQuizQuestions, useQuizAttempts, type QuizQuestion } from '@/lib/study/useQuiz'
import { useAuth } from '@/contexts/AuthContext'
import type { StudyQuizSummary } from '@/lib/study/types'

interface Props {
  open: boolean
  onClose: () => void
  quiz: StudyQuizSummary
}

type Answers = Record<string, string[]>

export default function StudyQuiz({ open, onClose, quiz }: Props) {
  const { user } = useAuth()
  const { questions, loading } = useQuizQuestions(open ? quiz.id : null)
  const { submit, bestScore, hasPerfect } = useQuizAttempts(open ? quiz.id : null)

  const [phase, setPhase] = useState<'intro' | 'taking' | 'result'>('intro')
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const scoreComputed = useMemo(() => {
    if (phase !== 'result' || questions.length === 0) return 0
    let correct = 0
    for (const q of questions) {
      const user = (answers[q.id] || []).slice().sort().join(',')
      const right = q.correct.slice().sort().join(',')
      if (user === right) correct++
    }
    return Math.round((correct / questions.length) * 100)
  }, [phase, questions, answers])

  if (!open) return null

  function start() {
    setAnswers({})
    setResult(null)
    setPhase('taking')
  }

  function reset() {
    setAnswers({})
    setResult(null)
    setPhase('intro')
  }

  async function finish() {
    if (questions.length === 0) return
    let correct = 0
    for (const q of questions) {
      const user = (answers[q.id] || []).slice().sort().join(',')
      const right = q.correct.slice().sort().join(',')
      if (user === right) correct++
    }
    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= quiz.passing_score
    await submit(score, answers, quiz.passing_score)
    setResult({ score, passed })
    setPhase('result')
  }

  function toggleOption(q: QuizQuestion, optionId: string) {
    setAnswers((prev) => {
      const current = prev[q.id] || []
      if (q.kind === 'multi') {
        return {
          ...prev,
          [q.id]: current.includes(optionId)
            ? current.filter((x) => x !== optionId)
            : [...current, optionId],
        }
      }
      return { ...prev, [q.id]: [optionId] }
    })
  }

  const answeredCount = Object.keys(answers).filter((id) => (answers[id] || []).length > 0).length
  const allAnswered = answeredCount === questions.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar prova"
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'rgba(15,14,12,0.98)',
          border: '1px solid rgba(201,168,76,0.2)',
        }}
      >
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md"
          style={{
            background: 'rgba(15,14,12,0.9)',
            borderBottom: '1px solid rgba(201,168,76,0.12)',
          }}
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: 'var(--wine-light)' }} />
            <h2
              className="text-sm tracking-[0.15em] uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--wine-light)' }}
            >
              Prova
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </header>

        <div className="p-6">
          {!user ? (
            <EmptyAuth />
          ) : phase === 'intro' ? (
            <Intro
              quiz={quiz}
              bestScore={bestScore}
              hasPerfect={hasPerfect}
              onStart={start}
              totalQuestions={questions.length}
              loading={loading}
            />
          ) : phase === 'taking' ? (
            <Taking
              questions={questions}
              answers={answers}
              toggleOption={toggleOption}
              allAnswered={allAnswered}
              answeredCount={answeredCount}
              onFinish={finish}
            />
          ) : (
            <Result
              score={result?.score ?? scoreComputed}
              passed={result?.passed ?? false}
              quiz={quiz}
              questions={questions}
              answers={answers}
              onRetry={reset}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyAuth() {
  return (
    <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
      Entre na sua conta para fazer a prova.
    </p>
  )
}

function Intro({
  quiz,
  totalQuestions,
  bestScore,
  hasPerfect,
  onStart,
  loading,
}: {
  quiz: StudyQuizSummary
  totalQuestions: number
  bestScore: number
  hasPerfect: boolean
  onStart: () => void
  loading: boolean
}) {
  return (
    <div className="text-center">
      <h3
        className="text-2xl mb-3"
        style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
      >
        {quiz.title}
      </h3>
      {quiz.description ? (
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          {quiz.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <Chip label={`${totalQuestions} questões`} />
        <Chip label={`Passa com ${quiz.passing_score}%`} />
        <Chip label={`+${quiz.xp_bonus} XP ao passar`} />
        {quiz.reliquia_slug_on_master ? (
          <Chip label="Relíquia ao gabaritar" highlight />
        ) : null}
      </div>

      {bestScore > 0 ? (
        <p
          className="text-xs mb-4"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          Melhor pontuação: <span style={{ color: 'var(--gold)' }}>{bestScore}%</span>
          {hasPerfect ? ' · gabaritado' : ''}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onStart}
        disabled={loading || totalQuestions === 0}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
          color: '#0F0E0C',
          fontFamily: 'Cinzel, serif',
          fontWeight: 600,
        }}
      >
        {loading ? 'Carregando...' : 'Começar prova'}
      </button>
    </div>
  )
}

function Chip({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[11px] tracking-[0.1em] uppercase"
      style={{
        background: highlight ? 'rgba(127,29,29,0.2)' : 'rgba(201,168,76,0.08)',
        border: `1px solid ${highlight ? 'rgba(127,29,29,0.4)' : 'rgba(201,168,76,0.2)'}`,
        color: highlight ? 'var(--wine-light)' : 'var(--gold)',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {label}
    </span>
  )
}

function Taking({
  questions,
  answers,
  toggleOption,
  allAnswered,
  answeredCount,
  onFinish,
}: {
  questions: QuizQuestion[]
  answers: Answers
  toggleOption: (q: QuizQuestion, optionId: string) => void
  allAnswered: boolean
  answeredCount: number
  onFinish: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-xs tracking-[0.15em] uppercase text-center" style={{ color: 'var(--text-muted)' }}>
        {answeredCount} / {questions.length} respondidas
      </div>

      {questions.map((q, idx) => {
        const selected = answers[q.id] || []
        return (
          <div
            key={q.id}
            className="rounded-xl p-5"
            style={{
              background: 'rgba(20,18,14,0.5)',
              border: '1px solid rgba(201,168,76,0.1)',
            }}
          >
            <p
              className="text-sm mb-4"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
              }}
            >
              <span style={{ color: 'var(--gold)' }}>{idx + 1}.</span> {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = selected.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOption(q, opt.id)}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all"
                    style={{
                      background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(15,14,12,0.6)',
                      border: `1px solid ${isSelected ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.08)'}`,
                      color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {q.kind === 'multi' ? (
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                Selecione todas que se aplicam.
              </p>
            ) : null}
          </div>
        )
      })}

      <button
        type="button"
        onClick={onFinish}
        disabled={!allAnswered}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
          color: '#0F0E0C',
          fontFamily: 'Cinzel, serif',
          fontWeight: 600,
        }}
      >
        Enviar respostas
      </button>
    </div>
  )
}

function Result({
  score,
  passed,
  quiz,
  questions,
  answers,
  onRetry,
  onClose,
}: {
  score: number
  passed: boolean
  quiz: StudyQuizSummary
  questions: QuizQuestion[]
  answers: Answers
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        {passed ? (
          <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--gold)' }} />
        ) : (
          <XCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--wine-light)' }} />
        )}
        <h3
          className="text-3xl mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          {score}%
        </h3>
        <p
          className="text-sm"
          style={{
            color: passed ? 'var(--gold)' : 'var(--wine-light)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {passed
            ? score === 100
              ? `Gabaritou! +${quiz.xp_bonus} XP · relíquia conquistada`
              : `Aprovado — +${quiz.xp_bonus} XP`
            : `Não atingiu ${quiz.passing_score}% desta vez`}
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const user = (answers[q.id] || []).slice().sort().join(',')
          const right = q.correct.slice().sort().join(',')
          const isRight = user === right
          return (
            <div
              key={q.id}
              className="rounded-lg p-4"
              style={{
                background: 'rgba(20,18,14,0.5)',
                border: `1px solid ${isRight ? 'rgba(34,197,94,0.2)' : 'rgba(127,29,29,0.2)'}`,
              }}
            >
              <div className="flex items-start gap-2 mb-2">
                {isRight ? (
                  <CheckCircle2
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: '#4ade80' }}
                  />
                ) : (
                  <XCircle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--wine-light)' }}
                  />
                )}
                <p
                  className="text-sm"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <span style={{ color: 'var(--gold)' }}>{idx + 1}.</span> {q.prompt}
                </p>
              </div>
              {!isRight && q.explanation ? (
                <p
                  className="text-xs mt-2 ml-6 leading-relaxed"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {q.explanation}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: 'var(--gold)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Tentar de novo
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
          style={{
            background: 'rgba(15,14,12,0.6)',
            border: '1px solid rgba(201,168,76,0.1)',
            color: 'var(--text-secondary)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
