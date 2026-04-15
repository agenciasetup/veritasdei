'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Overlay de boas-vindas para quem abre o Santo Rosário pela primeira vez.
 *
 * Carrossel de 4 passos explicando a estrutura da oração, os conjuntos de
 * mistérios, o significado das contas e como navegar. Não é um tutorial
 * longo — a ideia é que caiba em ~20 segundos e não intimide quem nunca
 * rezou o terço.
 *
 * Controles:
 *   - **Próximo / Voltar** para navegar entre os passos.
 *   - **Começar a rezar** (último passo) dispensa e marca como visto.
 *   - **X** no topo ou **Pular tutorial** no rodapé dispensam a qualquer hora.
 *   - **Esc** também fecha.
 *
 * Acessibilidade:
 *   - `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
 *   - `tabIndex={-1}` no container + `autoFocus` no botão primário.
 *   - O overlay é renderizado **só quando visível** — sem focus trap
 *     completo (fora do escopo) mas o botão primário recebe foco no mount.
 */

interface OnboardingStep {
  title: string
  subtitle: string
  body: React.ReactNode
  icon: string
}

const STEPS: ReadonlyArray<OnboardingStep> = [
  {
    icon: '✦',
    title: 'Bem-vindo ao Santo Rosário',
    subtitle: 'Uma oração que nos leva pela mão de Maria',
    body: (
      <>
        <p>
          O Santo Rosário é uma meditação sobre a vida de Cristo, dividida em
          vinte <em>mistérios</em>. Você medita cinco por vez, repetindo as
          orações fundamentais da fé enquanto contempla cenas do Evangelho.
        </p>
        <p>
          Não precisa saber tudo de cor — cada passo mostra a oração completa
          na tela.
        </p>
      </>
    ),
  },
  {
    icon: '☉',
    title: 'Quatro grupos de mistérios',
    subtitle: 'Um para cada dia da semana',
    body: (
      <>
        <p>
          Cada grupo tem cinco mistérios (cinco &#34;cenas&#34;) para meditar:
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            <span style={{ color: '#D9C077' }}>Gozosos</span> — segunda e sábado
          </li>
          <li>
            <span style={{ color: '#D9C077' }}>Luminosos</span> — quinta
          </li>
          <li>
            <span style={{ color: '#D9C077' }}>Dolorosos</span> — terça e sexta
          </li>
          <li>
            <span style={{ color: '#D9C077' }}>Gloriosos</span> — quarta e domingo
          </li>
        </ul>
        <p className="mt-2 text-xs" style={{ color: '#7A7368' }}>
          O app já sugere o mistério do dia. Você pode trocar a qualquer hora
          pelo seletor no topo.
        </p>
      </>
    ),
  },
  {
    icon: '◯',
    title: 'As contas guiam a oração',
    subtitle: 'Cada conta é uma oração, cada dezena é um mistério',
    body: (
      <>
        <p>
          O rosário tem uma estrutura fixa: introdução (Credo, Pai-Nosso, três
          Ave Marias, Glória) e cinco dezenas. Cada dezena é um mistério + um
          Pai-Nosso + dez Ave Marias + Glória.
        </p>
        <p>
          No alto da tela você vê o colar com todas as contas. A que está
          pulsando é onde você está agora. Pode clicar em qualquer outra conta
          para pular direto para ela.
        </p>
      </>
    ),
  },
  {
    icon: '→',
    title: 'Pronto para começar',
    subtitle: 'Avance no seu ritmo',
    body: (
      <>
        <p>
          Leia ou recite a oração e toque em <strong>Avançar</strong> quando
          terminar. O app guarda o seu progresso — se precisar sair, pode
          voltar depois de onde parou (por até 24 horas).
        </p>
        <p>
          Há ainda um <strong>modo silêncio</strong> (esconde toda a
          interface) e <strong>vibração discreta</strong> no celular ao cruzar
          cada dezena. Tudo opcional, no rodapé.
        </p>
        <p className="mt-3" style={{ color: '#D9C077' }}>
          Que a paz esteja convosco. Boa oração.
        </p>
      </>
    ),
  },
]

export interface OnboardingOverlayProps {
  onDismiss: () => void
}

export function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  const primaryBtnRef = useRef<HTMLButtonElement>(null)

  const next = useCallback(() => {
    if (isLast) {
      onDismiss()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }, [isLast, onDismiss])

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])

  // Esc fecha, setas navegam.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, onDismiss])

  // Reposiciona o foco no botão primário a cada troca de step.
  useEffect(() => {
    primaryBtnRef.current?.focus()
  }, [stepIndex])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        backgroundColor: 'rgba(15, 14, 12, 0.85)',
        backdropFilter: 'blur(6px)',
      }}
      tabIndex={-1}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: 'rgba(201, 168, 76, 0.25)',
          backgroundColor: '#141210',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)',
        }}
      >
        {/* Botão fechar */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl transition"
          style={{
            color: '#7A7368',
          }}
          aria-label="Fechar tutorial"
        >
          ×
        </button>

        {/* Ícone ornamental */}
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border text-2xl"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.35)',
            color: '#D9C077',
          }}
          aria-hidden
        >
          {step.icon}
        </div>

        <h2
          id="onboarding-title"
          className="text-center text-2xl md:text-3xl"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          {step.title}
        </h2>
        <p
          className="mt-1 text-center text-xs italic"
          style={{ color: '#D9C077', fontFamily: 'Cormorant Garamond, serif' }}
        >
          {step.subtitle}
        </p>

        <div
          className="mt-5 space-y-3 text-sm leading-relaxed"
          style={{
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {step.body}
        </div>

        {/* Pontinhos de progresso */}
        <div
          className="mt-6 flex justify-center gap-2"
          role="tablist"
          aria-label="Progresso do tutorial"
        >
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === stepIndex}
              aria-label={`Passo ${i + 1} de ${STEPS.length}`}
              onClick={() => setStepIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === stepIndex ? '24px' : '8px',
                backgroundColor:
                  i === stepIndex ? '#C9A84C' : 'rgba(201,168,76,0.2)',
              }}
            />
          ))}
        </div>

        {/* Controles */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm transition disabled:opacity-30"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Voltar
          </button>
          <button
            ref={primaryBtnRef}
            type="button"
            onClick={next}
            className="flex-[1.4] rounded-lg px-4 py-2.5 text-sm font-semibold transition"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              boxShadow: '0 6px 20px -8px rgba(201,168,76,0.6)',
            }}
            autoFocus
          >
            {isLast ? 'Começar a rezar' : 'Próximo'}
          </button>
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-3 block w-full text-center text-[11px] uppercase tracking-[0.2em] transition"
            style={{ color: '#7A7368' }}
          >
            Pular tutorial
          </button>
        )}
      </div>
    </div>
  )
}
