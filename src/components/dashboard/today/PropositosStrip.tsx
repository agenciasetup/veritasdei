'use client'

import { Check, Plus, Flame, Settings2 } from 'lucide-react'
import { usePropositos } from '@/contexts/PropositosContext'
import { cadenciaLabel, periodoAtualLabel } from '@/lib/propositos'
import { usePropositoSheet } from '@/components/propositos/PropositoSheet'
import { useHaptic } from '@/hooks/useHaptic'

/**
 * Strip horizontal de propósitos ativos — a "steroid version"
 * dos Instagram stories, mas pra compromissos espirituais.
 *
 * - Cada card mostra: título, progresso do período, streak, botão de check-in.
 * - Propósitos inativos aparecem esmaecidos com CTA "Ativar" → /perfil.
 * - Se não há propósitos, mostra só o card "+ Novo".
 *
 * Na Fase 1 o "+ Novo" leva para /perfil (onde eles estão listados como
 * read-only). A tela de criação chega em Fase 2.
 */
export default function PropositosStrip() {
  const { propositos, propositosAtivos, loading, checkIn } = usePropositos()
  const { openCreate, openEdit } = usePropositoSheet()
  const haptic = useHaptic()

  if (loading && propositos.length === 0) {
    return (
      <section className="mb-5">
        <div className="px-5 mb-3 flex items-center justify-between">
          <h2 className="ios-eyebrow">Meus propósitos</h2>
        </div>
        <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="ios-surface flex-shrink-0 w-56 h-40 animate-pulse"
              style={{ opacity: 0.5 }}
            />
          ))}
        </div>
      </section>
    )
  }

  // Sem nenhum propósito (nem ativos, nem inativos) — estado inicial completo.
  const lista = propositosAtivos.length > 0 ? propositosAtivos : propositos.slice(0, 3)

  return (
    <section className="mb-5">
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="ios-eyebrow">Meus propósitos</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 text-[12.5px] active:scale-95 transition-transform"
          style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-body)', fontWeight: 500 }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
          Novo
        </button>
      </div>

      <div
        className="px-4 flex gap-3 overflow-x-auto no-scrollbar no-overscroll-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {lista.map((p) => {
          const feitoHoje = p.feito_hoje
          const progressoLabel =
            p.cadencia === 'diaria'
              ? feitoHoje
                ? 'Feito hoje'
                : 'Aguardando'
              : `${p.periodo_atual}/${p.meta_por_periodo} ${periodoAtualLabel(p.cadencia)}`
          const inativo = !p.ativo

          return (
            <div
              key={p.id}
              className="ios-surface flex-shrink-0 w-[220px] p-4 relative flex flex-col"
              style={{
                scrollSnapAlign: 'start',
                opacity: inativo ? 0.55 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => openEdit(p)}
                aria-label="Editar propósito"
                className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ color: 'var(--text-muted)' }}
              >
                <Settings2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
              </button>

              <p
                className="text-[14px] leading-snug mb-0.5 truncate pr-8"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
              >
                {p.titulo}
              </p>
              <p
                className="text-[11.5px] mb-3"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
              >
                {cadenciaLabel(p.cadencia, p.meta_por_periodo)}
              </p>

              <div className="flex items-center gap-2 mb-3 mt-auto">
                <span
                  className="text-[11px]"
                  style={{
                    color: 'var(--text-secondary)',
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
                      background: 'rgba(230,126,34,0.1)',
                      color: '#E67E22',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                    }}
                  >
                    <Flame className="w-3 h-3" strokeWidth={2} />
                    {p.streak}
                  </span>
                )}
              </div>

              {inativo ? (
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="block w-full text-center py-2.5 rounded-xl text-[12.5px] active:scale-[0.98] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--gold-light)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  Ativar
                </button>
              ) : feitoHoje ? (
                <div
                  className="w-full py-2.5 rounded-xl text-[12.5px] flex items-center justify-center gap-1.5 touch-target"
                  style={{
                    background: 'rgba(102,187,106,0.12)',
                    border: '1px solid rgba(102,187,106,0.28)',
                    color: '#66BB6A',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}
                >
                  <Check className="w-4 h-4" strokeWidth={2.4} />
                  Feito hoje
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    haptic.pulse('complete')
                    // Flash verde sutil antes do re-render via checkIn
                    const btn = e.currentTarget
                    btn.classList.add('animate-success-bounce')
                    btn.addEventListener(
                      'animationend',
                      () => btn.classList.remove('animate-success-bounce'),
                      { once: true },
                    )
                    checkIn(p.id)
                  }}
                  className="ios-cta-gold w-full py-2.5 rounded-xl text-[12.5px] flex items-center justify-center gap-1.5 touch-target"
                >
                  <Check className="w-4 h-4" strokeWidth={2.4} />
                  Marcar feito
                </button>
              )}
            </div>
          )
        })}

        {/* Card "+ novo" sempre no fim */}
        <button
          type="button"
          onClick={openCreate}
          className="flex-shrink-0 w-[150px] flex flex-col items-center justify-center gap-2 rounded-[22px] active:scale-[0.98] transition-transform"
          style={{
            scrollSnapAlign: 'start',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            color: 'var(--text-muted)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(201,168,76,0.1)',
              color: 'var(--gold-light)',
            }}
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
          </div>
          <span
            className="text-[12px]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            Novo propósito
          </span>
        </button>
      </div>
    </section>
  )
}
