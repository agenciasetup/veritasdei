'use client'

/**
 * PremiumWelcomeModal — celebração quando o usuário acabou de virar
 * Premium (transição isPremium false → true detectada).
 *
 * Mostra 4 atalhos para features Premium para reduzir o "agora o quê?"
 * pós-compra. Auto-dismiss em 12s. Toque em card navega; toque em
 * "Vamos lá" fecha sem navegar.
 *
 * Detecção de transição: aguarda `loading` ficar false (subscription
 * resolvida). Quando isPremium muda de false → true depois disso, abre
 * o modal. Reabre em cada novo ciclo de assinatura (cancel + repurchase).
 * Não persiste em localStorage para permitir re-teste em sandbox e não
 * inflar dados do device.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, BookOpen, Map, GraduationCap, X } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'

const SHORTCUTS = [
  {
    href: '/catecismo-pio-x',
    icon: BookOpen,
    title: 'Catecismo Pio X',
    desc: 'O catecismo clássico, com perguntas e respostas.',
  },
  {
    href: '/trilhas',
    icon: GraduationCap,
    title: 'Trilhas',
    desc: 'Estudos guiados em sequência, do básico ao avançado.',
  },
  {
    href: '/mapa',
    icon: Map,
    title: 'Mapa Católico',
    desc: 'Explore santos, dogmas e doutrina como um mapa interativo.',
  },
  {
    href: '/formacao',
    icon: Sparkles,
    title: 'Formação',
    desc: 'Centro de aprendizagem completo, do dogma à prática.',
  },
]

export default function PremiumWelcomeModal() {
  const { isPremium, loading } = useSubscription()
  const router = useRouter()
  const prevPremiumRef = useRef<boolean | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Aguarda subscription terminar de carregar antes de marcar baseline.
    // Se inicializássemos com isPremium=false (estado default) e depois
    // resolvesse pra true, o modal abriria em toda visita de usuário
    // premium. Esperando `loading=false` garante que o baseline reflete
    // o estado real.
    if (loading) return
    if (prevPremiumRef.current === null) {
      prevPremiumRef.current = isPremium
      return
    }
    if (!prevPremiumRef.current && isPremium) {
      setOpen(true)
    }
    prevPremiumRef.current = isPremium
  }, [loading, isPremium])

  // Auto-dismiss 12s
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 12000)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  const handleNavigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-welcome-title"
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 md:p-8"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-1.5 rounded-md"
        >
          <X className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
        </button>

        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <Sparkles className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2
            id="premium-welcome-title"
            className="text-2xl mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            Bem-vindo ao Premium
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            Por onde você quer começar?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-4">
          {SHORTCUTS.map(({ href, icon: Icon, title, desc }) => (
            <button
              key={href}
              type="button"
              onClick={() => handleNavigate(href)}
              className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.99]"
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-1)',
              }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-soft)' }}
              >
                <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="min-w-0">
                <div
                  className="text-sm font-medium"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {title}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full py-3 rounded-xl text-sm"
          style={{
            background: 'transparent',
            color: 'var(--text-2)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Explorar depois
        </button>
      </div>
    </div>
  )
}
