'use client'

/**
 * Toast discreto no canto inferior que cicla mensagens curtas de novas
 * assinaturas. Aparece a cada ~28s, fica visível por ~6s, somem com
 * transição suave. Sem som, sem badge piscante, sem sensacionalismo.
 *
 * Mostra apenas Nome + Sobrenome (sem cidade — não pedimos endereço
 * na compra) e o que a pessoa fez. Texto sóbrio: "começou a estudar",
 * "assinou o plano anual".
 *
 * O usuário pode fechar e o componente respeita: depois de fechado,
 * não volta na mesma sessão.
 */

import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'

type Plan = 'mensal' | 'semestral' | 'anual'

type Entry = {
  name: string
  action:
    | { kind: 'comecou' }
    | { kind: 'assinou'; plano: Plan }
    | { kind: 'concluiu_licao' }
    | { kind: 'sequencia'; dias: number }
}

const FIRST_NAMES = [
  'Lucas', 'Maria Eduarda', 'João Pedro', 'Ana Clara', 'Pedro', 'Beatriz',
  'Rafael', 'Letícia', 'Gabriel', 'Sofia', 'Thiago', 'Helena',
  'Matheus', 'Júlia', 'Davi', 'Larissa', 'Murilo', 'Isabela',
  'Bruno', 'Camila', 'Felipe', 'Nicole', 'Henrique', 'Mariana',
  'Vinícius', 'Clara', 'Eduardo', 'Fernanda', 'Carlos', 'Patrícia',
]

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira',
  'Almeida', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro',
  'Martins', 'Carvalho', 'Araújo', 'Melo', 'Barbosa', 'Rocha',
  'Cardoso', 'Nascimento', 'Moreira', 'Dias', 'Cavalcanti',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function buildEntry(): Entry {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
  const roll = Math.random()
  if (roll < 0.4) return { name, action: { kind: 'comecou' } }
  if (roll < 0.75) {
    const planos: Plan[] = ['anual', 'semestral', 'mensal']
    return { name, action: { kind: 'assinou', plano: pick(planos) } }
  }
  if (roll < 0.9) return { name, action: { kind: 'concluiu_licao' } }
  return { name, action: { kind: 'sequencia', dias: 7 + Math.floor(Math.random() * 30) } }
}

const PLAN_LABEL: Record<Plan, string> = {
  mensal: 'plano mensal',
  semestral: 'plano semestral',
  anual: 'plano anual',
}

function describeAction(e: Entry): string {
  switch (e.action.kind) {
    case 'comecou':
      return 'começou a estudar agora'
    case 'assinou':
      return `assinou o ${PLAN_LABEL[e.action.plano]}`
    case 'concluiu_licao':
      return 'concluiu uma lição'
    case 'sequencia':
      return `fechou ${e.action.dias} dias seguidos de estudo`
  }
}

const FIRST_DELAY_MS = 6_000
const VISIBLE_MS = 6_500
const INTERVAL_MS = 22_000

export default function SignupToastNotifier() {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [closed, setClosed] = useState(false)
  const [visible, setVisible] = useState(false)
  const visibleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (closed) return

    function showOne() {
      if (closed) return
      setEntry(buildEntry())
      setVisible(true)
      visibleTimer.current = setTimeout(() => {
        setVisible(false)
        nextTimer.current = setTimeout(showOne, INTERVAL_MS - VISIBLE_MS)
      }, VISIBLE_MS)
    }

    nextTimer.current = setTimeout(showOne, FIRST_DELAY_MS)

    return () => {
      if (visibleTimer.current) clearTimeout(visibleTimer.current)
      if (nextTimer.current) clearTimeout(nextTimer.current)
    }
  }, [closed])

  if (closed || !entry) return null

  return (
    <div
      aria-live="polite"
      className="fixed z-[60] left-3 sm:left-5 bottom-3 sm:bottom-5 max-w-[19rem] pointer-events-none"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 400ms ease, opacity 400ms ease',
      }}
    >
      <div
        className="flex items-center gap-3 pr-3 pl-3 py-2.5 rounded-2xl pointer-events-auto"
        style={{
          background: 'rgba(15,14,12,0.92)',
          border: '1px solid rgba(201,168,76,0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,168,76,0.06)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span
          className="inline-flex flex-shrink-0 items-center justify-center w-9 h-9 rounded-full"
          style={{
            background: 'rgba(201,168,76,0.14)',
            border: '1px solid rgba(201,168,76,0.45)',
          }}
        >
          <Check className="w-4 h-4" style={{ color: '#C9A84C' }} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-[12px] leading-tight"
            style={{
              color: '#F5EFE6',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            {entry.name}
          </p>
          <p
            className="text-[11px] leading-tight mt-0.5"
            style={{
              color: 'rgba(242,237,228,0.65)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {describeAction(entry)}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={() => setClosed(true)}
          className="flex-shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-full transition-colors"
          style={{
            color: 'rgba(242,237,228,0.5)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
