'use client'

import { useState } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import { COMMANDMENTS } from '../data/commandments'
import { SINS } from '../data/sins'
import type { LifeState } from '../data/types'

interface ExamineListProps {
  selectedSins: Set<number>
  onToggleSin: (id: number) => void
  lifeState: LifeState
}

export default function ExamineList({ selectedSins, onToggleSin, lifeState }: ExamineListProps) {
  const [openCmds, setOpenCmds] = useState<Set<number>>(new Set())

  function toggleCmd(id: number) {
    setOpenCmds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function getSinsForCommandment(cmdId: number) {
    return SINS.filter(sin => {
      if (sin.commandmentId !== cmdId) return false
      if (lifeState === 'jovem' && !sin.teen) return false
      if (lifeState === 'casado' && !sin.married) return false
      return true
    })
  }

  return (
    <div className="space-y-3">
      {COMMANDMENTS.map((cmd) => {
        const isOpen = openCmds.has(cmd.id)
        const sins = getSinsForCommandment(cmd.id)
        const checkedCount = sins.filter(s => selectedSins.has(s.id)).length

        return (
          <div
            key={cmd.id}
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: isOpen ? 'rgba(20,18,14,0.6)' : 'rgba(20,18,14,0.3)',
              border: `1px solid ${isOpen ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.06)'}`,
            }}
          >
            {/* Commandment header */}
            <button
              onClick={() => toggleCmd(cmd.id)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="text-left flex-1 min-w-0">
                <h3
                  className="text-sm font-semibold leading-snug"
                  style={{ fontFamily: 'Cinzel, serif', color: isOpen ? '#C9A84C' : '#F2EDE4' }}
                >
                  {cmd.title}
                </h3>
                <p
                  className="text-[11px] mt-1 italic"
                  style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {cmd.scripture}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {checkedCount > 0 && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(107,29,42,0.3)', color: '#E08090', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {checkedCount}
                  </span>
                )}
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-300"
                  style={{ color: '#7A7368', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
            </button>

            {/* Sins list */}
            <div
              className="overflow-hidden transition-all duration-500"
              style={{ maxHeight: isOpen ? '3000px' : '0', opacity: isOpen ? 1 : 0 }}
            >
              <div className="px-4 pb-4">
                {/* Description */}
                <p
                  className="text-xs leading-relaxed mb-4 p-3 rounded-lg"
                  style={{
                    color: '#B8AFA2',
                    fontFamily: 'Poppins, sans-serif',
                    background: 'rgba(15,14,12,0.5)',
                    borderLeft: '3px solid rgba(201,168,76,0.2)',
                  }}
                >
                  {cmd.description}
                </p>

                <div className="space-y-1.5">
                  {sins.map((sin) => {
                    const checked = selectedSins.has(sin.id)
                    return (
                      <label
                        key={sin.id}
                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          background: checked ? 'rgba(107,29,42,0.1)' : 'transparent',
                          border: `1px solid ${checked ? 'rgba(107,29,42,0.2)' : 'transparent'}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleSin(sin.id)}
                          className="mt-0.5 flex-shrink-0 w-4 h-4 rounded accent-[#C9A84C]"
                          style={{ accentColor: '#C9A84C' }}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-sm leading-relaxed block"
                            style={{
                              color: checked ? '#F2EDE4' : '#B8AFA2',
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: checked ? 400 : 300,
                            }}
                          >
                            {sin.text}
                          </span>
                          {sin.mortal && (
                            <span className="inline-flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" style={{ color: '#E08090' }} />
                              <span
                                className="text-[9px] tracking-wider uppercase"
                                style={{ color: '#E08090', fontFamily: 'Poppins, sans-serif' }}
                              >
                                Matéria grave
                              </span>
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
