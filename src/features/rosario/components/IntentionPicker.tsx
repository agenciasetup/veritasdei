'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RosaryIntention } from '@/features/rosario/data/historyTypes'

/**
 * Modal de seleção/gestão de intenções pessoais para rezar um terço.
 *
 * Features:
 *   - Lista de intenções ativas com rádio (uma selecionada por vez, inclusive
 *     a opção "Sem intenção específica").
 *   - Form inline para criar uma nova intenção (título + descrição curta).
 *   - Botão arquivar em cada item (toggle rápido — arquivadas somem da lista
 *     ativa, mas podem ser reabertas pela página de gestão futura).
 *   - Esc / clique no backdrop / botão X fecham.
 *
 * Propositadamente não implementa edição/delete/unarchive aqui — o escopo
 * deste sprint é o fluxo "começar a rezar por alguém". Gestão completa fica
 * pra uma página dedicada `/rosario/historico/intencoes` em sprint futuro.
 */

export interface IntentionPickerProps {
  open: boolean
  intentions: RosaryIntention[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCreate: (titulo: string, descricao: string | null) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onClose: () => void
}

export function IntentionPicker({
  open,
  intentions,
  selectedId,
  onSelect,
  onCreate,
  onArchive,
  onClose,
}: IntentionPickerProps) {
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const tituloRef = useRef<HTMLInputElement>(null)

  // Esc fecha.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Foca o input do form quando abrir.
  useEffect(() => {
    if (showForm) {
      tituloRef.current?.focus()
    }
  }, [showForm])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = titulo.trim()
      if (!trimmed) {
        setFormError('Dê um título à intenção')
        return
      }
      if (trimmed.length > 120) {
        setFormError('Título muito longo (máx. 120 caracteres)')
        return
      }
      setSubmitting(true)
      setFormError(null)
      try {
        await onCreate(trimmed, descricao.trim() || null)
        setTitulo('')
        setDescricao('')
        setShowForm(false)
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Falha ao criar intenção')
      } finally {
        setSubmitting(false)
      }
    },
    [titulo, descricao, onCreate],
  )

  if (!open) return null

  const activeIntentions = intentions.filter((i) => !i.arquivada)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intention-picker-title"
      style={{
        backgroundColor: 'rgba(15, 14, 12, 0.85)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 md:p-7"
        style={{
          borderColor: 'var(--accent-soft)',
          backgroundColor: 'var(--surface-2)',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl"
          style={{ color: 'var(--text-3)' }}
          aria-label="Fechar seletor de intenção"
        >
          ×
        </button>

        <h2
          id="intention-picker-title"
          className="text-center text-xl md:text-2xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
        >
          Rezar este terço por
        </h2>
        <p
          className="mt-1 text-center text-xs italic"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Ofereça sua oração a uma intenção específica
        </p>

        <fieldset className="mt-5 space-y-2">
          <legend className="sr-only">Intenções disponíveis</legend>

          <IntentionOption
            label="Sem intenção específica"
            description="Rezo livremente"
            selected={selectedId === null}
            onSelect={() => onSelect(null)}
          />

          {activeIntentions.map((intention) => (
            <IntentionOption
              key={intention.id}
              label={intention.titulo}
              description={intention.descricao}
              selected={selectedId === intention.id}
              onSelect={() => onSelect(intention.id)}
              onArchive={() => void onArchive(intention.id)}
            />
          ))}
        </fieldset>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div>
              <label
                className="mb-1 block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--text-3)' }}
              >
                Título
              </label>
              <input
                ref={tituloRef}
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Pelos doentes da minha família"
                maxLength={120}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--accent-soft)',
                  color: 'var(--text-1)',
                }}
                disabled={submitting}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--text-3)' }}
              >
                Descrição (opcional)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Contexto ou lembrete"
                rows={3}
                maxLength={1000}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm leading-relaxed"
                style={{
                  borderColor: 'var(--accent-soft)',
                  color: 'var(--text-1)',
                }}
                disabled={submitting}
              />
            </div>
            {formError && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError(null)
                }}
                disabled={submitting}
                className="flex-1 rounded-lg border px-3 py-2 text-xs uppercase tracking-[0.2em] transition"
                style={{
                  borderColor: 'rgba(122,115,104,0.35)',
                  color: 'var(--text-3)',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-[1.4] rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition disabled:opacity-50"
                style={{
                  background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                  color: 'var(--accent-contrast)',
                }}
              >
                {submitting ? 'Salvando…' : 'Criar'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 w-full rounded-lg border border-dashed px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition"
            style={{
              borderColor: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            + Nova intenção
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition"
          style={{
            background: 'linear-gradient(180deg, #C9A84C, #A88437)',
            color: 'var(--accent-contrast)',
            boxShadow: '0 6px 20px -8px rgba(201,168,76,0.6)',
          }}
        >
          Confirmar e rezar
        </button>
      </div>
    </div>
  )
}

// ---------- item de opção ----------

interface IntentionOptionProps {
  label: string
  description?: string | null
  selected: boolean
  onSelect: () => void
  onArchive?: () => void
}

function IntentionOption({
  label,
  description,
  selected,
  onSelect,
  onArchive,
}: IntentionOptionProps) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border p-3 transition"
      style={{
        borderColor: selected ? 'var(--accent)' : 'var(--accent-soft)',
        backgroundColor: selected ? 'var(--border-1)' : 'var(--surface-2)',
      }}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span
          aria-hidden
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: selected ? 'var(--accent)' : 'var(--border-1)',
          }}
        >
          {selected && (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block text-sm font-medium"
            style={{ color: selected ? 'var(--text-1)' : 'var(--text-1)' }}
          >
            {label}
          </span>
          {description && (
            <span
              className="mt-0.5 block text-xs"
              style={{ color: 'var(--text-3)' }}
            >
              {description}
            </span>
          )}
        </span>
      </button>
      {onArchive && (
        <button
          type="button"
          onClick={onArchive}
          className="shrink-0 rounded px-2 py-1 text-[9px] uppercase tracking-[0.2em] transition"
          style={{ color: 'var(--text-3)' }}
          aria-label={`Arquivar intenção "${label}"`}
        >
          Arquivar
        </button>
      )}
    </div>
  )
}
