'use client'

import { BookHeart, ClipboardList } from 'lucide-react'
import { SINS } from '../data/sins'
import { COMMANDMENTS } from '../data/commandments'
import { ACT_OF_CONTRITION } from '../data/confession-guide'

interface ConfessionWalkthroughProps {
  selectedSins: Set<number>
  customSins: string[]
  lastConfession: string | null
}

export default function ConfessionWalkthrough({
  selectedSins,
  customSins,
  lastConfession,
}: ConfessionWalkthroughProps) {
  const selected = SINS.filter((s) => selectedSins.has(s.id))

  const grouped = COMMANDMENTS
    .map((cmd) => ({
      commandment: cmd,
      sins: selected.filter((s) => s.commandmentId === cmd.id),
    }))
    .filter((g) => g.sins.length > 0)

  const totalCount = selected.length + customSins.length

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <p
            className="text-xs tracking-[0.15em] uppercase"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            Preparar para confissão
          </p>
        </div>
        <p className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
          Leve esta lista como guia para confessar com objetividade e sinceridade.
        </p>
        {lastConfession && (
          <p className="text-xs mt-2" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Última confissão registrada: {new Date(lastConfession).toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(20,18,14,0.45)',
          border: '1px solid rgba(201,168,76,0.08)',
        }}
      >
        <p
          className="text-[10px] tracking-[0.15em] uppercase mb-3"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Lista de pecados ({totalCount})
        </p>

        {totalCount === 0 ? (
          <p className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
            Nenhum pecado selecionado. Volte para revisar antes de concluir.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ commandment, sins }) => (
              <div key={commandment.id}>
                <p
                  className="text-[10px] tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  {commandment.title.split(':')[0]}
                </p>
                <ul className="space-y-1.5">
                  {sins.map((sin) => (
                    <li
                      key={sin.id}
                      className="text-sm px-3 py-2 rounded-lg"
                      style={{
                        color: '#F2EDE4',
                        fontFamily: 'Poppins, sans-serif',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(201,168,76,0.08)',
                      }}
                    >
                      {sin.textPast}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {customSins.length > 0 && (
              <div>
                <p
                  className="text-[10px] tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  Outros pecados
                </p>
                <ul className="space-y-1.5">
                  {customSins.map((sin, index) => (
                    <li
                      key={`${sin}-${index}`}
                      className="text-sm px-3 py-2 rounded-lg"
                      style={{
                        color: '#F2EDE4',
                        fontFamily: 'Poppins, sans-serif',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(201,168,76,0.08)',
                      }}
                    >
                      {sin}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(107,29,42,0.08)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BookHeart className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <p
            className="text-xs tracking-[0.15em] uppercase"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            Ato de contrição
          </p>
        </div>
        <p
          className="text-base leading-relaxed"
          style={{ color: '#F2EDE4', fontFamily: 'Cormorant Garamond, serif' }}
        >
          {ACT_OF_CONTRITION}
        </p>
      </div>
    </div>
  )
}
