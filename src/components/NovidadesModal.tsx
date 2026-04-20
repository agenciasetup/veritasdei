'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Divider from '@/components/ui/Divider'

/**
 * Modal "Novidades" exibido UMA vez após deploy de uma nova versão.
 *
 * Funciona por comparação de `CURRENT_VERSION` (hardcoded neste
 * arquivo) com o valor armazenado em localStorage. Ao mudar a
 * constante junto de um release, usuários veem o modal na próxima
 * abertura do app; clicar em "Entendi" salva a versão e não mostra
 * novamente até o próximo release.
 */

const STORAGE_KEY = 'veritas-last-seen-version'
const CURRENT_VERSION = '2026.04.22-ux-ui-fase-3'

interface Item {
  emoji: string
  title: string
  description: string
}

const HIGHLIGHTS: Item[] = [
  {
    emoji: '🎨',
    title: 'Novo visual — claro, escuro e sistema',
    description:
      'O app ganhou tema claro/escuro/sistema. Troque em Perfil > Conta > Aparência.',
  },
  {
    emoji: '🧭',
    title: 'Nova navegação',
    description:
      'A barra inferior tem 5 hubs: Rezar, Formação, Igrejas, Comunidade e Biblioteca. Perfil fica no avatar no topo.',
  },
  {
    emoji: '📖',
    title: 'Biblioteca unificada',
    description:
      'Bíblia, catecismo, mandamentos, dogmas e a busca assistida agora convivem no mesmo lugar — gratuito.',
  },
  {
    emoji: '✝',
    title: 'Tempos litúrgicos',
    description:
      'Em Quaresma e Advento, o acento vira roxo — a cor dos paramentos da Igreja.',
  },
]

export default function NovidadesModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (seen === CURRENT_VERSION) return
    } catch {
      return
    }
    const t = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[220] flex items-end md:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'color-mix(in srgb, #000 50%, transparent)' }}
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="novidades-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-3xl p-6 relative flex flex-col"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              boxShadow: '0 14px 48px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar"
              className="absolute top-3 right-3 p-2 rounded-full active:scale-[0.94] transition-transform"
              style={{ color: 'var(--text-3)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2
              id="novidades-title"
              className="text-xl md:text-2xl tracking-[0.08em] uppercase text-center"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
                fontWeight: 700,
              }}
            >
              Novidades
            </h2>
            <p
              className="text-xs text-center mt-1 tracking-wider uppercase"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              O app está mais fluido
            </p>
            <Divider variant="ornament" className="max-w-[160px] mx-auto" spacing="default" />

            <ul className="space-y-4 mt-2">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span
                    className="flex items-center justify-center rounded-xl flex-shrink-0 text-lg"
                    style={{
                      width: 36,
                      height: 36,
                      background: 'var(--accent-soft)',
                    }}
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold tracking-[0.02em]"
                      style={{
                        color: 'var(--text-1)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={dismiss}
              className="mt-6 w-full px-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase active:scale-[0.98] transition-transform"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Entendi
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
