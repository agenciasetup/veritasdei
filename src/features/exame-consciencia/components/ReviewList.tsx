'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { SINS } from '../data/sins'
import { COMMANDMENTS } from '../data/commandments'

interface ReviewListProps {
  selectedSins: Set<number>
  customSins: string[]
  lastConfession: string | null
  onRemoveSin: (id: number) => void
  onAddCustomSin: (text: string) => void
  onRemoveCustomSin: (index: number) => void
}

export default function ReviewList({
  selectedSins,
  customSins,
  lastConfession,
  onRemoveSin,
  onAddCustomSin,
  onRemoveCustomSin,
}: ReviewListProps) {
  const [customInput, setCustomInput] = useState('')

  const selected = SINS.filter((s) => selectedSins.has(s.id))

  const grouped = COMMANDMENTS
    .map((cmd) => ({
      commandment: cmd,
      sins: selected.filter((s) => s.commandmentId === cmd.id),
    }))
    .filter((g) => g.sins.length > 0)

  function addCustomInline() {
    const value = customInput.trim()
    if (!value) return
    onAddCustomSin(value)
    setCustomInput('')
  }

  const totalCount = selected.length + customSins.length

  return (
    <div className="space-y-4">
      {lastConfession && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.1)',
          }}
        >
          <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Última confissão:{' '}
            <span style={{ color: '#C9A84C' }}>{lastConfession}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p
          className="text-xs tracking-[0.15em] uppercase"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          {totalCount} {totalCount === 1 ? 'pecado' : 'pecados'} selecionados
        </p>
      </div>

      <div
        className="rounded-xl p-3"
        style={{
          background: 'rgba(20,18,14,0.45)',
          border: '1px solid rgba(201,168,76,0.12)',
        }}
      >
        <p
          className="text-[10px] tracking-[0.15em] uppercase mb-2"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Adicionar pecado manualmente
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomInline()
              }
            }}
            placeholder="Ex.: Fui impaciente com minha família"
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'rgba(10,10,10,0.6)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
            }}
          />
          <button
            type="button"
            onClick={addCustomInline}
            className="px-3 py-2 rounded-lg inline-flex items-center gap-1.5"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Adicionar</span>
          </button>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Nenhum pecado selecionado.
          </p>
          <p className="text-xs mt-1" style={{ color: '#7A736860', fontFamily: 'Poppins, sans-serif' }}>
            Volte à etapa anterior para examinar sua consciência.
          </p>
        </div>
      ) : (
        <>
          {grouped.map(({ commandment, sins }) => (
            <div key={commandment.id}>
              <p
                className="text-[10px] tracking-[0.15em] uppercase mb-2 px-1"
                style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
              >
                {commandment.title.split(':')[0]}
              </p>
              <div className="space-y-1.5">
                {sins.map((sin) => (
                  <div
                    key={sin.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl"
                    style={{
                      background: 'rgba(20,18,14,0.4)',
                      border: '1px solid rgba(201,168,76,0.06)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
                      >
                        {sin.textPast}
                      </p>
                      {sin.mortal && (
                        <span className="inline-flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" style={{ color: '#E08090' }} />
                          <span className="text-[9px] tracking-wider uppercase" style={{ color: '#E08090', fontFamily: 'Poppins, sans-serif' }}>
                            Matéria grave
                          </span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveSin(sin.id)}
                      className="p-1 rounded-lg flex-shrink-0 transition-colors"
                      style={{ color: '#7A7368' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {customSins.length > 0 && (
            <div>
              <p
                className="text-[10px] tracking-[0.15em] uppercase mb-2 px-1"
                style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
              >
                Outros pecados
              </p>
              <div className="space-y-1.5">
                {customSins.map((text, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl"
                    style={{
                      background: 'rgba(20,18,14,0.4)',
                      border: '1px solid rgba(201,168,76,0.06)',
                    }}
                  >
                    <p
                      className="text-sm leading-relaxed flex-1"
                      style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
                    >
                      {text}
                    </p>
                    <button
                      onClick={() => onRemoveCustomSin(i)}
                      className="p-1 rounded-lg flex-shrink-0"
                      style={{ color: '#7A7368' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
