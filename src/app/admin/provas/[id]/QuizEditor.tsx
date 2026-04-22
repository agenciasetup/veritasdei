'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Circle,
  GraduationCap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  QuestionKind,
  QuizEditorData,
  QuizEditorMeta,
  QuizEditorQuestion,
  QuizStatus,
} from './types'

interface Props {
  initial: QuizEditorData
}

function genId(prefix = 'opt'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export default function QuizEditor({ initial }: Props) {
  const router = useRouter()
  const [meta, setMeta] = useState<QuizEditorMeta>(initial.quiz)
  const [questions, setQuestions] = useState<QuizEditorQuestion[]>(initial.questions)
  const [dirtyMeta, setDirtyMeta] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null)

  async function saveMeta() {
    setSavingMeta(true)
    setFeedback(null)
    const supabase = createClient()
    if (!supabase) {
      setSavingMeta(false)
      setFeedback({ tone: 'err', msg: 'Cliente indisponível.' })
      return
    }
    const payload: Partial<QuizEditorMeta> = {
      title: meta.title,
      description: meta.description,
      passing_score: meta.passing_score,
      xp_bonus: meta.xp_bonus,
      reliquia_slug_on_master: meta.reliquia_slug_on_master,
      status: meta.status,
      published_at:
        meta.status === 'published' && !meta.published_at
          ? new Date().toISOString()
          : meta.published_at,
    }
    const { error } = await supabase.from('study_quizzes').update(payload).eq('id', meta.id)
    setSavingMeta(false)
    if (error) {
      setFeedback({ tone: 'err', msg: error.message })
      return
    }
    setDirtyMeta(false)
    setFeedback({ tone: 'ok', msg: 'Metadados salvos.' })
  }

  async function deleteQuiz() {
    if (!window.confirm('Excluir esta prova e todas as suas questões? Não dá pra desfazer.')) return
    const supabase = createClient()
    if (!supabase) return
    const { error } = await supabase.from('study_quizzes').delete().eq('id', meta.id)
    if (error) {
      setFeedback({ tone: 'err', msg: error.message })
      return
    }
    router.push('/admin/provas')
  }

  function patchMeta<K extends keyof QuizEditorMeta>(key: K, value: QuizEditorMeta[K]) {
    setMeta((m) => ({ ...m, [key]: value }))
    setDirtyMeta(true)
  }

  async function addQuestion() {
    const supabase = createClient()
    if (!supabase) return
    const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 1
    const defaults = {
      quiz_id: meta.id,
      kind: 'single' as QuestionKind,
      prompt: 'Nova questão',
      options: [
        { id: 'a', label: 'Opção A' },
        { id: 'b', label: 'Opção B' },
      ],
      correct: ['a'],
      explanation: null,
      sort_order: nextOrder,
    }
    const { data, error } = await supabase
      .from('study_quiz_questions')
      .insert(defaults)
      .select('*')
      .single()
    if (error || !data) {
      setFeedback({ tone: 'err', msg: error?.message ?? 'Erro ao adicionar questão.' })
      return
    }
    setQuestions((qs) => [...qs, data as QuizEditorQuestion])
  }

  async function updateQuestion(updated: QuizEditorQuestion) {
    setQuestions((qs) => qs.map((q) => (q.id === updated.id ? updated : q)))
    const supabase = createClient()
    if (!supabase) return
    const { error } = await supabase
      .from('study_quiz_questions')
      .update({
        kind: updated.kind,
        prompt: updated.prompt,
        options: updated.options,
        correct: updated.correct,
        explanation: updated.explanation,
        sort_order: updated.sort_order,
      })
      .eq('id', updated.id)
    if (error) {
      setFeedback({ tone: 'err', msg: error.message })
    }
  }

  async function deleteQuestion(id: string) {
    if (!window.confirm('Remover esta questão?')) return
    const supabase = createClient()
    if (!supabase) return
    const { error } = await supabase.from('study_quiz_questions').delete().eq('id', id)
    if (error) {
      setFeedback({ tone: 'err', msg: error.message })
      return
    }
    setQuestions((qs) => qs.filter((q) => q.id !== id))
  }

  async function moveQuestion(id: string, dir: -1 | 1) {
    const idx = questions.findIndex((q) => q.id === id)
    if (idx < 0) return
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= questions.length) return
    const a = questions[idx]
    const b = questions[swapIdx]
    const swappedA: QuizEditorQuestion = { ...a, sort_order: b.sort_order }
    const swappedB: QuizEditorQuestion = { ...b, sort_order: a.sort_order }
    const newList = [...questions]
    newList[idx] = swappedB
    newList[swapIdx] = swappedA
    setQuestions(newList.sort((x, y) => x.sort_order - y.sort_order))
    const supabase = createClient()
    if (!supabase) return
    await supabase
      .from('study_quiz_questions')
      .update({ sort_order: swappedA.sort_order })
      .eq('id', swappedA.id)
    await supabase
      .from('study_quiz_questions')
      .update({ sort_order: swappedB.sort_order })
      .eq('id', swappedB.id)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link
          href="/admin/provas"
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--text-2)', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Todas as provas
        </Link>
      </div>

      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold inline-flex items-center gap-2"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
          >
            <GraduationCap className="w-6 h-6" style={{ color: 'var(--gold)' }} />
            {meta.title || 'Prova sem título'}
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
          >
            {meta.content_type} · {meta.content_ref}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect
            value={meta.status}
            onChange={(s) => patchMeta('status', s)}
          />
          <button
            type="button"
            onClick={deleteQuiz}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
            style={{
              color: '#C88B7C',
              background: 'rgba(200,139,124,0.08)',
              border: '1px solid rgba(200,139,124,0.2)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      </header>

      {feedback ? (
        <div
          role="status"
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{
            background: feedback.tone === 'ok' ? 'rgba(139,181,139,0.1)' : 'rgba(200,139,124,0.1)',
            border: `1px solid ${feedback.tone === 'ok' ? 'rgba(139,181,139,0.3)' : 'rgba(200,139,124,0.3)'}`,
            color: feedback.tone === 'ok' ? '#8BB58B' : '#C88B7C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {feedback.msg}
        </div>
      ) : null}

      {/* Metadata */}
      <section
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)' }}
      >
        <h2
          className="text-xs tracking-[0.15em] uppercase mb-3"
          style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
        >
          Metadados
        </h2>
        <div className="space-y-3">
          <Field label="Título">
            <input
              type="text"
              value={meta.title}
              onChange={(e) => patchMeta('title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
            />
          </Field>
          <Field label="Descrição">
            <textarea
              value={meta.description ?? ''}
              onChange={(e) => patchMeta('description', e.target.value || null)}
              rows={2}
              className="w-full resize-none px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Passing score (%)">
              <input
                type="number"
                min={0}
                max={100}
                value={meta.passing_score}
                onChange={(e) => patchMeta('passing_score', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </Field>
            <Field label="XP Bônus">
              <input
                type="number"
                min={0}
                value={meta.xp_bonus}
                onChange={(e) => patchMeta('xp_bonus', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </Field>
          </div>
          <Field label="Selo (slug) ao gabaritar" hint="Deixe vazio se não libera selo">
            <input
              type="text"
              value={meta.reliquia_slug_on_master ?? ''}
              onChange={(e) => patchMeta('reliquia_slug_on_master', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
            />
          </Field>

          <button
            type="button"
            onClick={saveMeta}
            disabled={!dirtyMeta || savingMeta}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              color: '#0F0E0C',
              fontFamily: 'Cinzel, serif',
              fontWeight: 600,
            }}
          >
            <Save className="w-3.5 h-3.5" />
            {savingMeta ? 'Salvando...' : 'Salvar metadados'}
          </button>
        </div>
      </section>

      {/* Questions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xs tracking-[0.15em] uppercase"
            style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}
          >
            Questões ({questions.length})
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: 'var(--gold)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        <div className="space-y-3">
          {questions.length === 0 ? (
            <p
              className="text-center py-10 rounded-xl text-sm"
              style={{
                background: 'var(--surface-2)',
                border: '1px dashed var(--border-1)',
                color: 'var(--text-muted)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Nenhuma questão ainda. Clique em Adicionar.
            </p>
          ) : (
            questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                index={i}
                question={q}
                total={questions.length}
                onChange={updateQuestion}
                onDelete={() => deleteQuestion(q.id)}
                onMove={(dir) => moveQuestion(q.id, dir)}
              />
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function QuestionCard({
  index,
  question,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  index: number
  question: QuizEditorQuestion
  total: number
  onChange: (q: QuizEditorQuestion) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}) {
  function patchOption(optId: string, label: string) {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === optId ? { ...o, label } : o)),
    })
  }

  function addOption() {
    const newId = genId('opt')
    onChange({
      ...question,
      options: [...question.options, { id: newId, label: 'Nova opção' }],
    })
  }

  function removeOption(optId: string) {
    onChange({
      ...question,
      options: question.options.filter((o) => o.id !== optId),
      correct: question.correct.filter((c) => c !== optId),
    })
  }

  function toggleCorrect(optId: string) {
    if (question.kind === 'multi') {
      const next = question.correct.includes(optId)
        ? question.correct.filter((c) => c !== optId)
        : [...question.correct, optId]
      onChange({ ...question, correct: next })
    } else {
      onChange({ ...question, correct: [optId] })
    }
  }

  function setKind(kind: QuestionKind) {
    if (kind === 'truefalse') {
      onChange({
        ...question,
        kind,
        options: [
          { id: 'v', label: 'Verdadeiro' },
          { id: 'f', label: 'Falso' },
        ],
        correct: [question.correct[0] === 'v' || question.correct[0] === 'f' ? question.correct[0] : 'v'],
      })
    } else {
      onChange({ ...question, kind })
    }
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)' }}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <span
          className="text-[11px] tracking-[0.15em] uppercase flex-shrink-0"
          style={{ color: 'var(--gold)', fontFamily: 'Poppins, sans-serif' }}
        >
          Questão {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <IconAction onClick={() => onMove(-1)} disabled={index === 0} label="Subir" icon={<ArrowUp className="w-3.5 h-3.5" />} />
          <IconAction onClick={() => onMove(1)} disabled={index === total - 1} label="Descer" icon={<ArrowDown className="w-3.5 h-3.5" />} />
          <IconAction onClick={onDelete} danger label="Remover" icon={<Trash2 className="w-3.5 h-3.5" />} />
        </div>
      </header>

      <div className="space-y-3">
        <Field label="Tipo">
          <div className="flex gap-2">
            {(['single', 'multi', 'truefalse'] as QuestionKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="px-3 py-1.5 rounded-md text-[11px]"
                style={{
                  background: question.kind === k ? 'rgba(201,168,76,0.15)' : 'var(--surface-3)',
                  border: `1px solid ${question.kind === k ? 'rgba(201,168,76,0.4)' : 'var(--border-1)'}`,
                  color: question.kind === k ? 'var(--gold)' : 'var(--text-2)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {k === 'single' ? 'Única' : k === 'multi' ? 'Múltipla' : 'V / F'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Enunciado">
          <textarea
            value={question.prompt}
            onChange={(e) => onChange({ ...question, prompt: e.target.value })}
            rows={2}
            className="w-full resize-none px-3 py-2 rounded-lg text-sm"
            style={fieldStyle}
          />
        </Field>

        <Field label="Opções (clique no círculo para marcar a correta)">
          <div className="space-y-2">
            {question.options.map((opt) => {
              const correct = question.correct.includes(opt.id)
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(opt.id)}
                    aria-label={correct ? 'Desmarcar correta' : 'Marcar correta'}
                    className="flex-shrink-0 p-1"
                  >
                    {correct ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    ) : (
                      <Circle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => patchOption(opt.id, e.target.value)}
                    disabled={question.kind === 'truefalse'}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm"
                    style={fieldStyle}
                  />
                  {question.kind !== 'truefalse' && question.options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="p-1.5 rounded-md"
                      style={{ color: '#C88B7C' }}
                      aria-label="Remover opção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              )
            })}
            {question.kind !== 'truefalse' ? (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: 'var(--gold)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Plus className="w-3 h-3" />
                Adicionar opção
              </button>
            ) : null}
          </div>
        </Field>

        <Field label="Explicação (mostrada ao errar)">
          <textarea
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value || null })}
            rows={2}
            className="w-full resize-none px-3 py-2 rounded-lg text-sm"
            style={fieldStyle}
            placeholder="Explicação pedagógica do porquê a resposta correta é correta..."
          />
        </Field>
      </div>
    </div>
  )
}

function StatusSelect({
  value,
  onChange,
}: {
  value: QuizStatus
  onChange: (s: QuizStatus) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as QuizStatus)}
      className="px-3 py-2 rounded-lg text-xs outline-none"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
        color: 'var(--text-primary)',
        fontFamily: 'Poppins, sans-serif',
      }}
      aria-label="Status"
    >
      <option value="draft">Rascunho</option>
      <option value="review">Em revisão</option>
      <option value="published">Publicada</option>
      <option value="archived">Arquivada</option>
    </select>
  )
}

function IconAction({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="p-1.5 rounded-md transition-colors hover:bg-white/5 disabled:opacity-30"
      style={{ color: danger ? '#C88B7C' : 'var(--text-2)' }}
    >
      {icon}
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="text-[11px] tracking-[0.1em] uppercase block mb-1"
        style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span
          className="block text-[11px] mt-1"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'var(--surface-3)',
  border: '1px solid var(--border-1)',
  color: 'var(--text-primary)',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
}
