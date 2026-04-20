'use client'

import {
  Check, Plus, Flame, Settings2, Cross, HandHeart, Church, Wheat,
  BookOpen, Sparkles, Star, Clock, Target,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { usePropositos } from '@/contexts/PropositosContext'
import { cadenciaLabel, periodoAtualLabel } from '@/lib/propositos'
import { usePropositoSheet } from '@/components/propositos/PropositoSheet'
import { useHaptic } from '@/hooks/useHaptic'
import type { PropositoComProgresso } from '@/types/propositos'

/**
 * Versão "board" dos propósitos para a HOME (/rezar).
 *
 * Diferença para `PropositosStrip`:
 * - Layout vertical (cards empilhados), não strip horizontal.
 * - Hierarquia visual mais forte: header com contador + ícone por tipo.
 * - Usa tokens semânticos (--surface-*, --accent, --success) → light/dark.
 * - Inclui card "+ Novo propósito" no fim.
 *
 * Quando não há propósitos ativos, mostra um estado vazio elegante com CTA.
 */

const ICONES: Record<string, ReactNode> = {
  rosario: <Cross className="w-5 h-5" strokeWidth={1.6} />,
  confissao: <HandHeart className="w-5 h-5" strokeWidth={1.6} />,
  missa: <Church className="w-5 h-5" strokeWidth={1.6} />,
  jejum: <Wheat className="w-5 h-5" strokeWidth={1.6} />,
  leitura: <BookOpen className="w-5 h-5" strokeWidth={1.6} />,
  adoracao: <Sparkles className="w-5 h-5" strokeWidth={1.6} />,
  custom: <Star className="w-5 h-5" strokeWidth={1.6} />,
}

function iconePara(tipo: string): ReactNode {
  return ICONES[tipo] ?? ICONES.custom
}

export default function PropositosBoard() {
  const { propositos, propositosAtivos, loading } = usePropositos()
  const { openCreate } = usePropositoSheet()

  if (loading && propositos.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <BoardHeader feitos={0} total={0} onAdd={openCreate} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              minHeight: '76px',
              opacity: 0.5,
              animationDuration: '2.5s',
            }}
          />
        ))}
      </section>
    )
  }

  // Sem nenhum propósito ativo → estado vazio convidando a ativar/criar.
  if (propositosAtivos.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <BoardHeader feitos={0} total={0} onAdd={openCreate} />
        <EmptyState
          temInativos={propositos.length > 0}
          onCreate={openCreate}
        />
      </section>
    )
  }

  const feitos = propositosAtivos.filter(p => p.feito_hoje).length
  const total = propositosAtivos.length

  return (
    <section className="flex flex-col gap-3">
      <BoardHeader feitos={feitos} total={total} onAdd={openCreate} />
      {propositosAtivos.map((p) => (
        <PropositoCard key={p.id} proposito={p} />
      ))}
    </section>
  )
}

/* ─── Header ──────────────────────────────────────────────────────── */

function BoardHeader({
  feitos,
  total,
  onAdd,
}: {
  feitos: number
  total: number
  onAdd: () => void
}) {
  const concluidoHoje = total > 0 && feitos === total
  return (
    <div className="flex items-end justify-between mt-2 mb-1">
      <div>
        <h2
          className="text-xl leading-tight"
          style={{
            fontFamily: 'var(--font-elegant)',
            color: 'var(--text-1)',
            letterSpacing: '0.01em',
          }}
        >
          Meus propósitos
        </h2>
        {total > 0 && (
          <p
            className="text-[12px] mt-0.5"
            style={{
              color: concluidoHoje ? 'var(--success)' : 'var(--text-3)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            {concluidoHoje
              ? '✓ Todos cumpridos hoje'
              : `${feitos} de ${total} cumpridos hoje`}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label="Novo propósito"
        className="inline-flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-full active:scale-95 transition-transform touch-target"
        style={{
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
        }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
        Novo
      </button>
    </div>
  )
}

/* ─── Card individual ─────────────────────────────────────────────── */

function PropositoCard({ proposito: p }: { proposito: PropositoComProgresso }) {
  const { checkIn } = usePropositos()
  const { openEdit } = usePropositoSheet()
  const haptic = useHaptic()

  const feitoHoje = p.feito_hoje
  const meta = p.meta_por_periodo

  const progressoLabel =
    p.cadencia === 'diaria'
      ? feitoHoje
        ? 'Feito hoje'
        : 'Aguardando'
      : `${p.periodo_atual}/${meta} ${periodoAtualLabel(p.cadencia)}`

  const horario = (p.horario_sugerido ?? '').slice(0, 5)

  return (
    <article
      className="relative rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: feitoHoje
          ? 'color-mix(in srgb, var(--success) 8%, var(--surface-2))'
          : 'var(--surface-2)',
        border: `1px solid ${
          feitoHoje
            ? 'color-mix(in srgb, var(--success) 30%, transparent)'
            : 'var(--border-1)'
        }`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Ícone do tipo */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: '44px',
            height: '44px',
            background: feitoHoje
              ? 'color-mix(in srgb, var(--success) 18%, transparent)'
              : 'var(--accent-soft)',
            color: feitoHoje ? 'var(--success)' : 'var(--accent)',
          }}
        >
          {iconePara(p.tipo)}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] leading-tight truncate pr-8"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'var(--text-1)',
            }}
          >
            {p.titulo}
          </h3>
          <p
            className="text-[12px] mt-0.5"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {cadenciaLabel(p.cadencia, meta)}
            {horario && (
              <>
                {' · '}
                <span className="inline-flex items-center gap-1">
                  <Clock className="inline w-3 h-3 -mt-0.5" strokeWidth={1.8} />
                  {horario}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Edit (sutil) */}
        <button
          type="button"
          onClick={() => openEdit(p)}
          aria-label="Editar propósito"
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ color: 'var(--text-3)' }}
        >
          <Settings2 className="w-[15px] h-[15px]" strokeWidth={1.7} />
        </button>
      </div>

      {/* Linha de progresso (só p/ cadências não-diárias com meta > 1) */}
      {p.cadencia !== 'diaria' && meta > 1 && (
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--surface-inset)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (p.periodo_atual / meta) * 100)}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
      )}

      {/* Footer: progresso + streak + ação */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[12px]"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            {progressoLabel}
          </span>
          {p.streak > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--warning) 15%, transparent)',
                color: 'var(--warning)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              <Flame className="w-3 h-3" strokeWidth={2} />
              {p.streak}
            </span>
          )}
        </div>

        {feitoHoje ? (
          <span
            className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--success) 15%, transparent)',
              color: 'var(--success)',
              border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
            Feito hoje
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              haptic.pulse('complete')
              const btn = e.currentTarget
              btn.classList.add('animate-success-bounce')
              btn.addEventListener(
                'animationend',
                () => btn.classList.remove('animate-success-bounce'),
                { once: true },
              )
              void checkIn(p.id)
            }}
            className="inline-flex items-center gap-1.5 text-[12px] px-3.5 py-1.5 rounded-full touch-target active:scale-95 transition-transform"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Marcar feito
          </button>
        )}
      </div>
    </article>
  )
}

/* ─── Estado vazio ────────────────────────────────────────────────── */

function EmptyState({
  temInativos,
  onCreate,
}: {
  temInativos: boolean
  onCreate: () => void
}) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.99] transition-transform"
      style={{
        background: 'var(--surface-inset)',
        border: '1px dashed color-mix(in srgb, var(--accent) 40%, transparent)',
        minHeight: '76px',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: '44px',
          height: '44px',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
        }}
      >
        <Target className="w-5 h-5" strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px]"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'var(--text-1)',
          }}
        >
          {temInativos ? 'Ative um propósito' : 'Crie seu primeiro propósito'}
        </p>
        <p
          className="text-[12px] mt-0.5"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {temInativos
            ? 'Toque para gerenciar e ativar suas devoções'
            : 'Reze o terço, vá à missa, jejue — sua jornada começa aqui'}
        </p>
      </div>
      <Plus
        className="w-5 h-5 flex-shrink-0"
        strokeWidth={2}
        style={{ color: 'var(--accent)' }}
      />
    </button>
  )
}
