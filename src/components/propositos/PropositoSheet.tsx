'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Check, Cross, HandHeart, Church, Wheat, BookOpen, Sparkles, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePropositos } from '@/contexts/PropositosContext'
import {
  createProposito,
  updateProposito,
  deleteProposito,
  type PropositoDraft,
} from '@/lib/supabase/propositos.queries'
import type { Proposito, PropositoCadencia } from '@/types/propositos'

/**
 * Bottom sheet mobile-first para CRUD de propósitos.
 *
 * Uso:
 *   const { openCreate, openEdit, close } = usePropositoSheet()
 *
 * Por ser um sheet e não uma rota, o contexto fica preservado (voltar não
 * perde scroll da home). Fecha por swipe-down / overlay / botão X.
 *
 * Form:
 *  - tipo (ícone + nome)
 *  - titulo (texto livre)
 *  - descricao
 *  - cadencia (diaria/semanal/mensal/dias_semana)
 *  - dias_semana quando cadencia = dias_semana
 *  - horario_sugerido (opcional, para lembretes)
 *  - ativo (toggle)
 */

const TIPOS: Array<{ value: string; label: string; icon: ReactNode }> = [
  { value: 'rosario',   label: 'Santo Rosário',        icon: <Cross size={18} strokeWidth={1.5} /> },
  { value: 'confissao', label: 'Confissão',            icon: <HandHeart size={18} strokeWidth={1.5} /> },
  { value: 'missa',     label: 'Santa Missa',          icon: <Church size={18} strokeWidth={1.5} /> },
  { value: 'jejum',     label: 'Jejum',                icon: <Wheat size={18} strokeWidth={1.5} /> },
  { value: 'leitura',   label: 'Leitura espiritual',   icon: <BookOpen size={18} strokeWidth={1.5} /> },
  { value: 'adoracao',  label: 'Adoração eucarística',  icon: <Sparkles size={18} strokeWidth={1.5} /> },
  { value: 'custom',    label: 'Outro',                icon: <Star size={18} strokeWidth={1.5} /> },
]

const CADENCIAS: Array<{ value: PropositoCadencia; label: string }> = [
  { value: 'diaria',       label: 'Todos os dias' },
  { value: 'semanal',      label: 'Por semana' },
  { value: 'mensal',       label: 'Por mês' },
  { value: 'dias_semana',  label: 'Dias específicos' },
]

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; proposito: Proposito }

interface SheetCtx {
  mode: Mode
  openCreate: () => void
  openEdit: (p: Proposito) => void
  close: () => void
}

const Ctx = createContext<SheetCtx | null>(null)

export function PropositoSheetProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })

  const openCreate = useCallback(() => setMode({ kind: 'create' }), [])
  const openEdit = useCallback((p: Proposito) => setMode({ kind: 'edit', proposito: p }), [])
  const close = useCallback(() => setMode({ kind: 'closed' }), [])

  const value = useMemo<SheetCtx>(
    () => ({ mode, openCreate, openEdit, close }),
    [mode, openCreate, openEdit, close],
  )

  // ESC to close
  useEffect(() => {
    if (mode.kind === 'closed') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mode.kind, close])

  // Lock body scroll when open
  useEffect(() => {
    if (mode.kind === 'closed') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mode.kind])

  return (
    <Ctx.Provider value={value}>
      {children}
      {mode.kind !== 'closed' && typeof document !== 'undefined'
        ? createPortal(
            <PropositoSheet mode={mode} onClose={close} />,
            document.body,
          )
        : null}
    </Ctx.Provider>
  )
}

export function usePropositoSheet(): SheetCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    return {
      mode: { kind: 'closed' },
      openCreate: () => {},
      openEdit: () => {},
      close: () => {},
    }
  }
  return ctx
}

function PropositoSheet({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const { user } = useAuth()
  const { reload, upsertLocal, removeLocal } = usePropositos()

  const existing = mode.kind === 'edit' ? mode.proposito : null

  const [tipo, setTipo] = useState<string>(existing?.tipo ?? 'rosario')
  const [titulo, setTitulo] = useState(existing?.titulo ?? 'Rezar o Santo Rosário')
  const [descricao, setDescricao] = useState(existing?.descricao ?? '')
  const [cadencia, setCadencia] = useState<PropositoCadencia>(existing?.cadencia ?? 'diaria')
  const [metaPorPeriodo, setMetaPorPeriodo] = useState(existing?.meta_por_periodo ?? 1)
  const [diasSemana, setDiasSemana] = useState<number[]>(existing?.dias_semana ?? [])
  const [horario, setHorario] = useState(
    (existing?.horario_sugerido ?? '').slice(0, 5),
  )
  const [ativo, setAtivo] = useState(existing?.ativo ?? true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function toggleDia(d: number) {
    setDiasSemana(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  async function salvar() {
    if (!user?.id || !titulo.trim()) {
      setErro('Informe um título')
      return
    }
    setSaving(true)
    setErro(null)
    const draft: PropositoDraft = {
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      cadencia,
      meta_por_periodo: Math.max(1, metaPorPeriodo),
      dias_semana: cadencia === 'dias_semana' && diasSemana.length > 0 ? diasSemana : null,
      horario_sugerido: horario ? `${horario}:00` : null,
      ativo,
    }
    try {
      if (mode.kind === 'edit' && existing) {
        const { proposito, error } = await updateProposito(existing.id, draft)
        if (error || !proposito) throw new Error(error ?? 'Erro desconhecido')
        upsertLocal(proposito)
      } else {
        const { proposito, error } = await createProposito(user.id, draft)
        if (error || !proposito) throw new Error(error ?? 'Erro desconhecido')
        upsertLocal(proposito)
      }
      // fecha imediatamente — reload roda em background só pra reconciliar
      setSaving(false)
      onClose()
      void reload()
      return
    } catch (err) {
      setErro((err as Error).message ?? 'Erro ao salvar')
      setSaving(false)
    }
  }

  async function remover() {
    if (!existing) return
    if (!confirm('Apagar este propósito? O histórico será perdido.')) return
    setSaving(true)
    try {
      const { error } = await deleteProposito(existing.id)
      if (error) throw new Error(error)
      removeLocal(existing.id)
      setSaving(false)
      onClose()
      void reload()
      return
    } catch (err) {
      setErro((err as Error).message ?? 'Erro ao apagar')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal
        aria-labelledby="proposito-sheet-title"
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          maxHeight: '92vh',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden flex-shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
          />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <h2
            id="proposito-sheet-title"
            className="text-xl"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-elegant)' }}
          >
            {mode.kind === 'edit' ? 'Editar propósito' : 'Novo propósito'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-5 pb-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Tipo */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.15em] mb-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Tipo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left text-sm"
                  style={{
                    background:
                      tipo === t.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      tipo === t.value ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.06)'
                    }`,
                    color: tipo === t.value ? '#F2EDE4' : '#A8A096',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <span className="flex-shrink-0" style={{ color: tipo === t.value ? '#C9A84C' : '#7A7368' }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.15em] mb-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Título
            </p>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex.: Rezar o Santo Rosário"
              className="w-full p-3 rounded-xl text-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
          </div>

          {/* Descrição */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.15em] mb-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Descrição (opcional)
            </p>
            <textarea
              value={descricao ?? ''}
              onChange={e => setDescricao(e.target.value)}
              rows={2}
              placeholder="Ex.: Cinco mistérios, pela conversão dos pecadores"
              className="w-full p-3 rounded-xl text-sm resize-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
          </div>

          {/* Cadência */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.15em] mb-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Frequência
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CADENCIAS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCadencia(c.value)}
                  className="p-2.5 rounded-xl text-xs"
                  style={{
                    background:
                      cadencia === c.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      cadencia === c.value ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.06)'
                    }`,
                    color: cadencia === c.value ? '#F2EDE4' : '#A8A096',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta por período (para semanal/mensal) */}
          {(cadencia === 'semanal' || cadencia === 'mensal') && (
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.15em] mb-2"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Meta por {cadencia === 'semanal' ? 'semana' : 'mês'}
              </p>
              <input
                type="number"
                min={1}
                value={metaPorPeriodo}
                onChange={e => setMetaPorPeriodo(parseInt(e.target.value) || 1)}
                className="w-full p-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                }}
              />
            </div>
          )}

          {/* Dias específicos */}
          {cadencia === 'dias_semana' && (
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.15em] mb-2"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Dias da semana
              </p>
              <div className="flex gap-1.5">
                {DIAS.map((d, i) => {
                  const selected = diasSemana.includes(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDia(i)}
                      className="flex-1 h-11 rounded-xl text-xs font-medium"
                      style={{
                        background: selected ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                          selected ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'
                        }`,
                        color: selected ? '#C9A84C' : '#7A7368',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Horário sugerido */}
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.15em] mb-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Lembrete (opcional)
            </p>
            <input
              type="time"
              value={horario}
              onChange={e => setHorario(e.target.value)}
              className="w-full p-3 rounded-xl text-sm"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
            <p
              className="text-[10px] mt-1.5"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Notificação será enviada se você tiver push ativo no perfil.
            </p>
          </div>

          {/* Ativo */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <p
                className="text-sm"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                Ativo
              </p>
              <p
                className="text-[11px]"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Aparece na home quando ativado
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(v => !v)}
              aria-pressed={ativo}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{
                background: ativo ? 'rgba(102,187,106,0.35)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${
                  ativo ? 'rgba(102,187,106,0.6)' : 'rgba(255,255,255,0.15)'
                }`,
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  left: ativo ? 'calc(100% - 22px)' : '2px',
                  background: ativo ? '#66BB6A' : '#7A7368',
                }}
              />
            </button>
          </div>

        </div>

        {/* Footer fixo — sempre visível, acima da bottom nav */}
        <footer
          className="flex-shrink-0 px-5 pt-3 border-t"
          style={{
            borderColor: 'var(--border-1)',
            background: 'var(--surface-1)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
          }}
        >
          {erro && (
            <p
              className="text-xs mb-2"
              style={{ color: 'var(--danger)', fontFamily: 'var(--font-body)' }}
            >
              {erro}
            </p>
          )}
          <div className="flex gap-2">
            {mode.kind === 'edit' && (
              <button
                type="button"
                onClick={remover}
                disabled={saving}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                  color: 'var(--danger)',
                }}
                aria-label="Apagar propósito"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={salvar}
              disabled={saving}
              className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando…' : mode.kind === 'edit' ? 'Salvar' : 'Criar propósito'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
