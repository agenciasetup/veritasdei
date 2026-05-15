'use client'

/**
 * Seção "Estudar" — full-screen estilo Netflix.
 *
 * Mostra as 12 trilhas reais do banco: um card "Continuar" em destaque +
 * uma fileira horizontal de posters que rola pra ver as outras. Os títulos
 * e cores vêm direto da tabela `public.trails` — nada inventado.
 */

import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Church,
  Crown,
  Droplets,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react'

// ──────────────────────────────────────────────────────────────────────────
// Dados reais (espelho da tabela `public.trails`)
// ──────────────────────────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  Droplets,
  Church,
  Heart,
  Shield,
  Flame,
  Crown,
  Star,
  Sparkles,
  ScrollText,
  BookOpen,
  Globe,
}

type Trail = {
  title: string
  subtitle: string
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'
  color: string
  icon: string
  steps: number
}

const TRAILS: Trail[] = [
  { title: 'Católico Iniciante', subtitle: 'O essencial da fé', difficulty: 'Iniciante', color: '#C9A84C', icon: 'GraduationCap', steps: 4 },
  { title: 'Vida Sacramental', subtitle: 'Os canais da graça', difficulty: 'Intermediário', color: '#8B3145', icon: 'Droplets', steps: 4 },
  { title: 'Fundamentos da Doutrina', subtitle: 'O que a Igreja acredita e porquê', difficulty: 'Intermediário', color: '#C9A84C', icon: 'Church', steps: 5 },
  { title: 'Vida de Caridade', subtitle: 'A fé em ação', difficulty: 'Iniciante', color: '#8B3145', icon: 'Heart', steps: 4 },
  { title: 'Defesa da Fé', subtitle: 'Apologética católica', difficulty: 'Avançado', color: '#C9A84C', icon: 'Shield', steps: 6 },
  { title: 'Vida de Oração', subtitle: 'Conversar com Deus', difficulty: 'Iniciante', color: '#8B3145', icon: 'Flame', steps: 4 },
  { title: 'Mariologia', subtitle: 'A Virgem Maria na fé católica', difficulty: 'Intermediário', color: '#4A90D9', icon: 'Crown', steps: 5 },
  { title: 'Josefologia', subtitle: 'São José, Patrono da Igreja', difficulty: 'Intermediário', color: '#8B6914', icon: 'Star', steps: 4 },
  { title: 'Escatologia Católica', subtitle: 'As últimas realidades', difficulty: 'Avançado', color: '#6B1D2A', icon: 'Sparkles', steps: 5 },
  { title: 'A Santa Missa', subtitle: 'Entendendo a liturgia', difficulty: 'Iniciante', color: '#C9A84C', icon: 'ScrollText', steps: 5 },
  { title: 'Perscrutação das Escrituras', subtitle: 'Lectio Divina e estudo bíblico', difficulty: 'Avançado', color: '#8B3145', icon: 'BookOpen', steps: 5 },
  { title: 'Latim Eclesiástico', subtitle: 'A língua da Igreja', difficulty: 'Avançado', color: '#C9A84C', icon: 'Globe', steps: 5 },
]

const FEATURED = TRAILS[0] // Católico Iniciante — featured "continue"

// ──────────────────────────────────────────────────────────────────────────

export default function EstudarSection() {
  const rowRef = useRef<HTMLDivElement>(null)

  function scrollRow(dir: 'left' | 'right') {
    const el = rowRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section
      id="estudar"
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ background: 'var(--surface-1)' }}
    >
      {/* Background ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(80% 50% at 20% 0%, rgba(201,168,76,0.10) 0%, transparent 55%), radial-gradient(60% 40% at 90% 60%, rgba(107,29,42,0.20) 0%, transparent 60%)',
        }}
      />

      {/* ─── Top: title + bullets ─── */}
      <div className="relative z-10 px-5 md:px-10 lg:px-16 pt-20 md:pt-24 pb-8 max-w-7xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span
              className="display-cinzel text-4xl md:text-5xl leading-none"
              style={{ color: '#C9A84C', opacity: 0.85, fontWeight: 600 }}
            >
              01
            </span>
            <span className="w-12 h-px" style={{ background: 'rgba(201,168,76,0.5)' }} />
            <span className="eyebrow-label" style={{ color: '#D9C077' }}>
              Estudar
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-end">
            <h2
              className="display-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.05] max-w-xl"
              style={{ color: '#F5EFE6', textWrap: 'balance' }}
            >
              Trilhas guiadas{' '}
              <span className="italic" style={{ color: '#E6D9B5' }}>
                pelos três pilares da fé.
              </span>
            </h2>

            <ul className="flex flex-col gap-2.5 lg:pl-6 lg:border-l" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
              {[
                'Bíblia, Magistério e Patrística — cada módulo com leitura, explicação e avaliação.',
                'Anote dentro do app: suas notas ficam atreladas a cada lição.',
                'Estude em grupo, com XP e conquistas a cada avaliação.',
              ].map(item => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm md:text-[15px]"
                  style={{
                    color: 'rgba(242,237,228,0.78)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.35)',
                    }}
                  >
                    <Check className="w-3 h-3" style={{ color: '#C9A84C' }} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* ─── Featured "Continuar" ─── */}
      <div className="relative z-10 px-5 md:px-10 lg:px-16 max-w-7xl w-full mx-auto mb-6 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p
            className="eyebrow-label mb-3"
            style={{ color: 'rgba(242,237,228,0.55)' }}
          >
            ◆ Continuar de onde parou
          </p>
          <FeaturedCard trail={FEATURED} />
        </motion.div>
      </div>

      {/* ─── Netflix row ─── */}
      <div className="relative z-10 max-w-7xl w-full mx-auto pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between px-5 md:px-10 lg:px-16 mb-3">
            <p
              className="eyebrow-label"
              style={{ color: 'rgba(242,237,228,0.55)' }}
            >
              ◆ Trilhas disponíveis · {TRAILS.length} módulos
            </p>
            <div className="hidden md:flex items-center gap-2">
              <RowButton onClick={() => scrollRow('left')} aria-label="Anterior">
                <ChevronLeft className="w-4 h-4" />
              </RowButton>
              <RowButton onClick={() => scrollRow('right')} aria-label="Próximo">
                <ChevronRight className="w-4 h-4" />
              </RowButton>
            </div>
          </div>

          <div
            ref={rowRef}
            className="nflx-row flex gap-3 md:gap-4 overflow-x-auto scroll-smooth px-5 md:px-10 lg:px-16 pb-2"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Esconde a scrollbar no Webkit (Chrome/Safari) — scrollbar-width já cobre Firefox. */}
            <style>{`.nflx-row::-webkit-scrollbar { display: none; }`}</style>
            {TRAILS.map(trail => (
              <TrailPoster key={trail.title} trail={trail} />
            ))}
            {/* Spacer no fim pra deixar respirar */}
            <div className="flex-shrink-0 w-6 md:w-12" aria-hidden />
          </div>

          {/* Fade edge */}
          <div
            className="absolute right-0 top-0 bottom-0 w-12 md:w-16 pointer-events-none hidden md:block"
            style={{
              background: 'linear-gradient(to left, var(--surface-1), transparent)',
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Featured card (the "continue" one — fake progress, but real trail name)
// ──────────────────────────────────────────────────────────────────────────

function FeaturedCard({ trail }: { trail: Trail }) {
  const Icon = ICONS[trail.icon] ?? GraduationCap
  return (
    <div
      className="relative overflow-hidden rounded-3xl group"
      style={{
        background: `linear-gradient(135deg, ${trail.color}40 0%, rgba(22,18,14,0.95) 65%)`,
        border: '1px solid rgba(201,168,76,0.25)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(60% 80% at 90% 50%, ${trail.color}25 0%, transparent 60%)`,
        }}
      />

      <div className="relative grid md:grid-cols-[1fr_280px] gap-6 p-6 md:p-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: `${trail.color}22`,
                border: `1px solid ${trail.color}55`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color: trail.color }} />
            </span>
            <span
              className="text-[10px] uppercase"
              style={{
                color: trail.color,
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.22em',
              }}
            >
              Trilha · {trail.difficulty}
            </span>
          </div>

          <h3
            className="display-cormorant text-3xl md:text-4xl mb-2"
            style={{ color: '#F5EFE6', fontWeight: 600 }}
          >
            {trail.title}
          </h3>
          <p
            className="text-sm md:text-base mb-5 max-w-md"
            style={{
              color: 'rgba(242,237,228,0.72)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.55,
            }}
          >
            {trail.subtitle}. Você parou na Lição 2 de {trail.steps}.
          </p>

          {/* Progress */}
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-1.5 text-[11px]" style={{ color: 'rgba(242,237,228,0.6)', fontFamily: 'var(--font-body)' }}>
              <span>Progresso</span>
              <span style={{ color: trail.color }}>2 / {trail.steps}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(2 / trail.steps) * 100}%`,
                  background: trail.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Lesson preview list */}
        <div
          className="hidden md:flex flex-col gap-2 p-4 rounded-2xl"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {[
            { n: 1, label: 'Os Dez Mandamentos', done: true },
            { n: 2, label: 'Os Preceitos da Igreja', done: true, current: false },
            { n: 3, label: 'Orações Fundamentais', current: true },
            { n: 4, label: 'Os Sete Sacramentos' },
          ].map(l => (
            <div
              key={l.n}
              className="flex items-center gap-2.5 text-xs"
              style={{
                color: l.current ? '#F5EFE6' : 'rgba(242,237,228,0.7)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: l.done ? trail.color : 'transparent',
                  border: l.done ? 'none' : `1px solid ${l.current ? trail.color : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {l.done ? (
                  <Check className="w-3 h-3" style={{ color: '#1C140C' }} />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: l.current ? trail.color : 'transparent' }}
                  />
                )}
              </span>
              <span style={{ fontWeight: l.current ? 600 : 400 }}>
                {l.n}. {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Poster card (single trail)
// ──────────────────────────────────────────────────────────────────────────

function TrailPoster({ trail }: { trail: Trail }) {
  const Icon = ICONS[trail.icon] ?? BookOpen
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25 }}
      className="relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] rounded-2xl overflow-hidden cursor-pointer"
      style={{
        scrollSnapAlign: 'start',
        aspectRatio: '0.7 / 1',
        background: `linear-gradient(165deg, ${trail.color}55 0%, rgba(22,18,14,0.96) 70%)`,
        border: '1px solid rgba(201,168,76,0.18)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
      }}
    >
      {/* Ornament corner */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(70% 50% at 50% 0%, ${trail.color}30 0%, transparent 60%)`,
        }}
      />

      <div className="absolute inset-0 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
            style={{
              background: `${trail.color}25`,
              border: `1px solid ${trail.color}55`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: trail.color }} />
          </span>
          <span
            className="text-[9px] uppercase px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(242,237,228,0.7)',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.14em',
            }}
          >
            {trail.difficulty.slice(0, 3)}
          </span>
        </div>

        <div className="flex-1" />

        <div>
          <h4
            className="display-cormorant text-lg leading-tight mb-1"
            style={{ color: '#F5EFE6', fontWeight: 600, textWrap: 'balance' }}
          >
            {trail.title}
          </h4>
          <p
            className="text-[11px] mb-2"
            style={{
              color: 'rgba(242,237,228,0.6)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.4,
            }}
          >
            {trail.subtitle}
          </p>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: trail.color, fontFamily: 'var(--font-body)' }}>
            <BookOpen className="w-3 h-3" />
            <span>{trail.steps} lições</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────────────────────

function RowButton({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-full inline-flex items-center justify-center transition-colors"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(201,168,76,0.3)',
        color: '#E6D9B5',
      }}
      {...props}
    >
      {children}
    </button>
  )
}
