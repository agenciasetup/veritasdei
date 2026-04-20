'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardCheck, ListChecks, MessageCircle, RotateCcw } from 'lucide-react'
import type { ExamStep, LifeState } from './data/types'
import ExamineList from './components/ExamineList'
import ExamineStepper from './components/ExamineStepper'
import ReviewList from './components/ReviewList'
import ConfessionWalkthrough from './components/ConfessionWalkthrough'
import { clearAllNotes } from './notesStorage'
import Divider from '@/components/ui/Divider'

const STORAGE_KEY = 'veritasdei_exame'

interface StoredData {
  selectedSins: number[]
  customSins: string[]
  lastConfession: string | null
}

const STEPS: { id: ExamStep; label: string; icon: React.ElementType }[] = [
  { id: 'examinar', label: 'Examinar', icon: ClipboardCheck },
  { id: 'revisar', label: 'Resumo', icon: ListChecks },
  { id: 'confessar', label: 'Preparar para Confissão', icon: MessageCircle },
]

export default function ExameConscienciaView() {
  const [step, setStep] = useState<ExamStep>('examinar')
  const [lifeState, setLifeState] = useState<LifeState>('adulto')
  const [selectedSins, setSelectedSins] = useState<Set<number>>(new Set())
  const [customSins, setCustomSins] = useState<string[]>([])
  const [lastConfession, setLastConfession] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data: StoredData = JSON.parse(raw)
        const nextSelected = new Set(data.selectedSins)
        const nextCustom = data.customSins || []
        const nextLastConfession = data.lastConfession
        queueMicrotask(() => {
          setSelectedSins(nextSelected)
          setCustomSins(nextCustom)
          setLastConfession(nextLastConfession)
          setLoaded(true)
        })
        return
      }
    } catch {}
    queueMicrotask(() => setLoaded(true))
  }, [])

  // Save to localStorage
  const save = useCallback((sins: Set<number>, custom: string[], lastConf: string | null) => {
    try {
      const data: StoredData = {
        selectedSins: Array.from(sins),
        customSins: custom,
        lastConfession: lastConf,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
  }, [])

  function toggleSin(id: number) {
    setSelectedSins(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      save(next, customSins, lastConfession)
      return next
    })
  }

  function removeSin(id: number) {
    setSelectedSins(prev => {
      const next = new Set(prev)
      next.delete(id)
      save(next, customSins, lastConfession)
      return next
    })
  }

  function addCustomSin(text: string) {
    const next = [...customSins, text]
    setCustomSins(next)
    save(selectedSins, next, lastConfession)
  }

  function removeCustomSin(index: number) {
    const next = customSins.filter((_, i) => i !== index)
    setCustomSins(next)
    save(selectedSins, next, lastConfession)
  }

  function finishConfession() {
    const now = new Date().toISOString()
    setLastConfession(now)
    setSelectedSins(new Set())
    setCustomSins([])
    save(new Set(), [], now)
    clearAllNotes()
    setStep('examinar')
  }

  if (!loaded) return null

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* ── Header ── */}
      <section className="relative z-10 text-center px-5 pt-10 pb-4">
        <h1
          className="text-2xl md:text-3xl tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          Exame de Consciência
        </h1>
        <p
          className="mt-2 text-sm max-w-md mx-auto"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Prepare-se para o Sacramento da Confissão
        </p>
        <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
      </section>

      {/* ── Step indicator ── */}
      <div className="relative z-10 w-full px-4 md:px-8 mb-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="flex gap-1 p-1.5 rounded-xl"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-2)',
            }}
          >
            {STEPS.map((s, i) => {
              const isActive = step === s.id
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--surface-2)' : 'transparent',
                    boxShadow: isActive
                      ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px var(--border-1)'
                      : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }} />
                  <span
                    className="text-[11px] font-medium tracking-wide hidden sm:block"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                    }}
                  >
                    {s.label}
                  </span>
                  {/* Step number on mobile */}
                  <span
                    className="text-[11px] sm:hidden"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                    }}
                  >
                    {i + 1}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Life state filter (only on examine step) ── */}
      {step === 'examinar' && (
        <div className="relative z-10 w-full px-4 md:px-8 mb-4">
          <div className="max-w-3xl mx-auto flex items-center gap-2 justify-center">
            <span
              className="text-[10px] tracking-wider uppercase mr-2"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Estado:
            </span>
            {([
              { id: 'adulto' as LifeState, label: 'Adulto' },
              { id: 'jovem' as LifeState, label: 'Jovem' },
              { id: 'casado' as LifeState, label: 'Casado(a)' },
            ]).map(opt => {
              const active = lifeState === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setLifeState(opt.id)}
                  className="px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    border: `1px solid ${active ? 'var(--accent-soft)' : 'var(--border-2)'}`,
                    color: active ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="relative z-10 flex-1 pb-28 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-8">

          {step === 'examinar' && (
            <>
              {/* Mobile: stepper one-at-a-time */}
              <div className="md:hidden">
                <ExamineStepper
                  selectedSins={selectedSins}
                  onToggleSin={toggleSin}
                  lifeState={lifeState}
                />
              </div>
              {/* Desktop: accordion list */}
              <div className="hidden md:block">
                <ExamineList
                  selectedSins={selectedSins}
                  onToggleSin={toggleSin}
                  lifeState={lifeState}
                />
              </div>
            </>
          )}

          {step === 'revisar' && (
            <>
              <ReviewList
                selectedSins={selectedSins}
                customSins={customSins}
                lastConfession={lastConfession}
                onRemoveSin={removeSin}
                onAddCustomSin={addCustomSin}
                onRemoveCustomSin={removeCustomSin}
              />
              {(selectedSins.size > 0 || customSins.length > 0) && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setStep('confessar')}
                    className="px-6 py-3 rounded-xl transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                      color: '#0F0E0C',
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    Preparar para Confissão
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'confessar' && (
            <>
              <ConfessionWalkthrough
                selectedSins={selectedSins}
                customSins={customSins}
                lastConfession={lastConfession}
              />
              <div className="mt-8 flex justify-center">
                <button
                  onClick={finishConfession}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                    color: '#0F0E0C',
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Finalizar Confissão
                </button>
              </div>
              <p className="text-center mt-3 text-[11px]" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Isto limpará seus pecados selecionados e registrará a data.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
