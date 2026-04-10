'use client'

import { useState, useMemo } from 'react'
import { MYSTERY_GROUPS, getMysteryForToday } from './data/mysteries'
import {
  SINAL_DA_CRUZ, CREDO, PAI_NOSSO, AVE_MARIA,
  GLORIA, SALVE_RAINHA, ORACAO_FINAL,
} from './data/prayers'
import type { MysteryGroup, MysterySet } from './data/types'
import PrayerCard from './components/PrayerCard'
import DecadeSection from './components/DecadeSection'

export default function RosarioView() {
  const todayMystery = useMemo(() => getMysteryForToday(), [])
  const [activeSet, setActiveSet] = useState<MysterySet>(todayMystery.id)
  const [expandInitial, setExpandInitial] = useState(false)
  const [expandFinal, setExpandFinal] = useState(false)

  const currentGroup: MysteryGroup = MYSTERY_GROUPS.find(g => g.id === activeSet)!

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* ── Header ── */}
      <section className="page-header relative z-10">
        <h1>Santo Rosário</h1>
        <p className="subtitle">
          Medite os mistérios da vida de Cristo com Nossa Senhora
        </p>
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      {/* ── Mystery set selector (tabs) ── */}
      <div className="relative z-10 w-full px-4 md:px-8 mb-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="flex gap-1.5 p-1.5 rounded-xl overflow-x-auto"
            style={{
              background: 'rgba(20,18,14,0.6)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            {MYSTERY_GROUPS.map((group) => {
              const isActive = activeSet === group.id
              const isToday = todayMystery.id === group.id
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveSet(group.id)}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-lg transition-all duration-200 text-center"
                  style={{
                    background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                  }}
                >
                  <span
                    className="text-[11px] font-semibold tracking-wide block"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: isActive ? '#C9A84C' : '#7A7368',
                    }}
                  >
                    {group.name.replace('Mistérios ', '')}
                  </span>
                  <span
                    className="text-[9px] tracking-wider block mt-0.5"
                    style={{
                      color: isToday ? '#D9C077' : '#7A736850',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {isToday ? '● Hoje' : group.days}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="relative z-10 flex-1 pb-28 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-4">

          {/* ── Orações Iniciais ── */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(20,18,14,0.4)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            <button
              onClick={() => setExpandInitial(!expandInitial)}
              className="w-full flex items-center justify-between p-4 md:p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.15)',
                  }}
                >
                  <span style={{ color: '#C9A84C', fontSize: '0.85rem' }}>&#10013;</span>
                </div>
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    color: expandInitial ? '#C9A84C' : '#F2EDE4',
                  }}
                >
                  Orações Iniciais
                </span>
              </div>
              <span
                className="text-[10px] px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  color: '#7A7368',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                5 orações
              </span>
            </button>

            <div
              className="overflow-hidden transition-all duration-500"
              style={{
                maxHeight: expandInitial ? '3000px' : '0',
                opacity: expandInitial ? 1 : 0,
              }}
            >
              <div className="px-4 md:px-5 pb-5 space-y-2">
                <PrayerCard prayer={SINAL_DA_CRUZ} defaultOpen />
                <PrayerCard prayer={CREDO} />
                <PrayerCard prayer={PAI_NOSSO} />
                <PrayerCard prayer={AVE_MARIA} repeat={3} />
                <PrayerCard prayer={GLORIA} />
              </div>
            </div>
          </div>

          {/* ── 5 Dezenas ── */}
          {currentGroup.mysteries.map((mystery, i) => (
            <DecadeSection
              key={`${currentGroup.id}-${mystery.number}`}
              mystery={mystery}
              decadeNumber={i + 1}
              defaultOpen={i === 0}
            />
          ))}

          {/* ── Orações Finais ── */}
          <div
            className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(20,18,14,0.4)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            <button
              onClick={() => setExpandFinal(!expandFinal)}
              className="w-full flex items-center justify-between p-4 md:p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.15)',
                  }}
                >
                  <span style={{ color: '#C9A84C', fontSize: '0.85rem' }}>&#10013;</span>
                </div>
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    color: expandFinal ? '#C9A84C' : '#F2EDE4',
                  }}
                >
                  Orações Finais
                </span>
              </div>
              <span
                className="text-[10px] px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  color: '#7A7368',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                3 orações
              </span>
            </button>

            <div
              className="overflow-hidden transition-all duration-500"
              style={{
                maxHeight: expandFinal ? '3000px' : '0',
                opacity: expandFinal ? 1 : 0,
              }}
            >
              <div className="px-4 md:px-5 pb-5 space-y-2">
                <PrayerCard prayer={SALVE_RAINHA} defaultOpen />
                <PrayerCard prayer={ORACAO_FINAL} />
                <PrayerCard prayer={SINAL_DA_CRUZ} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
