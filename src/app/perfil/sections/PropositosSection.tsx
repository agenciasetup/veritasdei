'use client'

import { Plus, Settings2, Flame, Check } from 'lucide-react'
import { usePropositos } from '@/contexts/PropositosContext'
import { cadenciaLabel, periodoAtualLabel } from '@/lib/propositos'
import { usePropositoSheet } from '@/components/propositos/PropositoSheet'

export default function PropositosSection() {
  const { propositos, loading, checkIn } = usePropositos()
  const { openCreate, openEdit } = usePropositoSheet()

  if (loading && propositos.length === 0) {
    return (
      <div className="py-10 text-center text-sm" style={{ color: '#8A8378' }}>
        Carregando propósitos…
      </div>
    )
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="text-lg mb-1"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
          >
            Meus propósitos
          </h2>
          <p className="text-xs" style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
            Compromissos espirituais que aparecem na sua tela inicial. Toque em um propósito
            para editar ou ativar.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs touch-target-lg active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            border: '1px solid rgba(201,168,76,0.4)',
            color: '#0F0E0C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {propositos.length === 0 && (
          <button
            type="button"
            onClick={openCreate}
            className="text-sm py-8 text-center rounded-2xl"
            style={{
              color: '#8A8378',
              fontFamily: 'Poppins, sans-serif',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(201,168,76,0.2)',
            }}
          >
            Nenhum propósito ainda. Toque para criar o primeiro.
          </button>
        )}
        {propositos.map((p) => {
          const feitoHoje = p.feito_hoje
          return (
            <div
              key={p.id}
              className="p-4 rounded-2xl"
              style={{
                background: p.ativo ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  p.ativo ? 'rgba(201,168,76,0.18)' : 'rgba(201,168,76,0.08)'
                }`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="min-w-0 text-left flex-1 active:opacity-80"
                >
                  <p
                    className="text-base font-medium truncate"
                    style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {p.titulo}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {cadenciaLabel(p.cadencia, p.meta_por_periodo)}
                    {p.descricao ? ` · ${p.descricao}` : ''}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  aria-label="Editar propósito"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all touch-target-lg active:scale-95"
                  style={{
                    background: p.ativo
                      ? 'rgba(102,187,106,0.12)'
                      : 'rgba(201,168,76,0.08)',
                    border: `1px solid ${
                      p.ativo ? 'rgba(102,187,106,0.35)' : 'rgba(201,168,76,0.2)'
                    }`,
                    color: p.ativo ? '#66BB6A' : '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Settings2 className="w-3 h-3" />
                  {p.ativo ? 'Ativo' : 'Ativar'}
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs mt-3">
                <span style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}>
                  {p.periodo_atual}/{p.meta_por_periodo} {periodoAtualLabel(p.cadencia)}
                </span>
                {p.streak > 0 && (
                  <span
                    className="inline-flex items-center gap-1"
                    style={{ color: '#E67E22', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Flame className="w-3 h-3" />
                    {p.streak} {p.streak === 1 ? 'dia' : 'períodos'}
                  </span>
                )}
                {p.ativo && !feitoHoje && (
                  <button
                    type="button"
                    onClick={() => checkIn(p.id)}
                    className="ml-auto inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg active:scale-95"
                    style={{
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      color: '#C9A84C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <Check className="w-3 h-3" />
                    Marcar feito hoje
                  </button>
                )}
                {p.ativo && feitoHoje && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 text-xs"
                    style={{ color: '#66BB6A', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Check className="w-3 h-3" />
                    Feito hoje
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
