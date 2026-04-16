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
      <section className="mb-6">
        <div className="px-5 mb-3 flex items-center justify-between">
          <h2
            className="text-sm uppercase tracking-[0.15em]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Meus propósitos
          </h2>
        </div>
        <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar">
          {[0, 1].map(i => (
            <div
              key={i}
              className="flex-shrink-0 w-56 h-32 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </div>
      </section>
    )
  }

  // Sem nenhum propósito (nem ativos, nem inativos) — estado inicial completo.
  const lista = propositosAtivos.length > 0 ? propositosAtivos : propositos.slice(0, 3)

  return (
    <section className="mb-3">
      <div className="px-5 mb-2 flex items-center justify-between">
        <h2
          className="text-sm uppercase tracking-[0.15em]"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Meus propósitos
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo
        </button>
      </div>

      <div
        className="px-4 flex gap-3 overflow-x-auto no-scrollbar no-overscroll-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {lista.map(p => {
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
              className="flex-shrink-0 w-56 p-4 rounded-2xl relative"
              style={{
                scrollSnapAlign: 'start',
                background: inativo
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(201,168,76,0.06)',
                border: `1px solid ${
                  inativo ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.18)'
                }`,
                opacity: inativo ? 0.6 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => openEdit(p)}
                aria-label="Editar propósito"
                className="absolute top-1 right-1 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ color: '#8A8378' }}
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <p
                className="text-sm font-medium mb-1 truncate pr-7"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                {p.titulo}
              </p>
              <p
                className="text-[11px] mb-3"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                {cadenciaLabel(p.cadencia, p.meta_por_periodo)}
              </p>

              <div
                className="text-[11px] uppercase tracking-wide mb-3"
                style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
              >
                {progressoLabel}
              </div>

              {p.streak > 0 && (
                <div
                  className="inline-flex items-center gap-1 text-[11px] mb-3"
                  style={{ color: '#E67E22', fontFamily: 'Poppins, sans-serif' }}
                >
                  <Flame className="w-3 h-3" />
                  {p.streak} {p.streak === 1 ? 'dia' : 'dias'}
                </div>
              )}

              {inativo ? (
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="block w-full text-center py-2 rounded-xl text-xs"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Ativar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    if (feitoHoje) return
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
                  disabled={feitoHoje}
                  className="w-full py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all touch-target active:scale-[0.98]"
                  style={{
                    background: feitoHoje
                      ? 'rgba(102,187,106,0.12)'
                      : 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                    border: `1px solid ${
                      feitoHoje ? 'rgba(102,187,106,0.35)' : 'rgba(201,168,76,0.35)'
                    }`,
                    color: feitoHoje ? '#66BB6A' : '#0F0E0C',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  {feitoHoje ? 'Feito hoje' : 'Marcar feito'}
                </button>
              )}
            </div>
          )
        })}

        {/* Card "+ novo" sempre no fim */}
        <button
          type="button"
          onClick={openCreate}
          className="flex-shrink-0 w-40 flex flex-col items-center justify-center gap-2 rounded-2xl"
          style={{
            scrollSnapAlign: 'start',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.2)',
            color: '#7A7368',
            minHeight: '170px',
          }}
        >
          <Plus className="w-6 h-6" style={{ color: '#C9A84C' }} />
          <span
            className="text-xs"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Novo propósito
          </span>
        </button>
      </div>
    </section>
  )
}
