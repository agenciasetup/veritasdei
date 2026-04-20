'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cross, GraduationCap, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Coachmarks breves mostrados na primeira sessão do usuário após o
 * onboarding. Destacam os 3 pontos-chave da nova navegação:
 *   1. Bottom nav → Rezar (ponto de partida diário)
 *   2. Bottom nav → Formação (conteúdo premium aprofundado)
 *   3. Avatar no topo → Perfil e configurações
 *
 * Persiste em localStorage (chave `veritas-coachmarks-seen`) para não
 * repetir. Usuário pode pular a qualquer momento.
 */

const STORAGE_KEY = 'veritas-coachmarks-seen'

interface Step {
  icon: React.ElementType
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: Cross,
    title: 'Rezar',
    description:
      'Comece o dia aqui: Terço, Novenas, Orações e preparação para a Confissão.',
  },
  {
    icon: GraduationCap,
    title: 'Formação',
    description:
      'Estudo aprofundado da fé — trilhas, dogmas, sacramentos e doutores da Igreja.',
  },
  {
    icon: User,
    title: 'Perfil e Aparência',
    description:
      'Toque no seu avatar para abrir Perfil. Em Conta > Aparência você escolhe tema claro, escuro ou do sistema.',
  },
]

export default function CoachMarks() {
  const { isAuthenticated, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isAuthenticated || !profile) return
    // Só mostra para usuários que já completaram onboarding. Quem está
    // no onboarding ainda não vê coachmarks (o onboarding guia sozinho).
    if (!profile.onboarding_completed) return
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (seen === '1') return
    } catch {
      return
    }
    // Pequeno delay para não competir com a transição de entrada da home.
    const t = setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(t)
  }, [isAuthenticated, profile])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* silencioso */
    }
    setOpen(false)
  }

  function advance() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!open) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="coach-backdrop"
          className="fixed inset-0 z-[250] flex items-end justify-center p-4 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'color-mix(in srgb, #000 45%, transparent)' }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coach-title"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl p-5 pb-6 flex flex-col"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-center rounded-2xl mb-4 self-start"
              style={{
                width: 48,
                height: 48,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
              aria-hidden="true"
            >
              <Icon className="w-6 h-6" />
            </div>

            <h2
              id="coach-title"
              className="text-lg tracking-[0.06em] uppercase mb-1.5"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
                fontWeight: 700,
              }}
            >
              {current.title}
            </h2>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              {current.description}
            </p>

            <div className="flex items-center justify-between gap-3">
              {/* Dots indicator */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === step ? 18 : 6,
                      height: 6,
                      background:
                        i === step ? 'var(--accent)' : 'var(--border-1)',
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isLast && (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="px-3 py-2 text-xs tracking-wider uppercase"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Pular
                  </button>
                )}
                <button
                  type="button"
                  onClick={advance}
                  className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase active:scale-[0.97] transition-transform"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {isLast ? 'Começar' : 'Próximo'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
