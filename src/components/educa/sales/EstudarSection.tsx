'use client'

/**
 * Seção "Estudar" — full-screen estilo Netflix.
 *
 * Recebe as trilhas direto do banco (server fetch em getEducaSalesTrails):
 * título, capa, cor, dificuldade e os steps (label/descrição). Não inventa
 * conteúdo — só usa os módulos reais.
 *
 * Clique num poster → abre um Dialog centralizado na viewport mostrando
 * o índice dos subtópicos (sem conteúdo completo).
 */

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
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
  X,
  type LucideIcon,
} from 'lucide-react'
import type { EducaSalesTrail } from '@/lib/educa/server-data'

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

type Props = {
  trails: EducaSalesTrail[]
}

export default function EstudarSection({ trails }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<EducaSalesTrail | null>(null)

  const featured = trails[0]

  function scrollRow(dir: 'left' | 'right') {
    const el = rowRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (trails.length === 0) {
    return null
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
                `${trails.length} trilhas reais — toque pra ver as lições de cada uma.`,
                'Anote dentro do app: suas notas ficam atreladas a cada lição.',
                'Avaliações ao fim de cada módulo, com XP e conquistas.',
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

      {/* ─── Featured trail (em destaque, primeira da lista) ─── */}
      {featured && (
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
              ◆ Comece por aqui
            </p>
            <FeaturedCard trail={featured} onOpen={() => setOpen(featured)} />
          </motion.div>
        </div>
      )}

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
              ◆ Trilhas disponíveis · {trails.length} módulos
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
            <style>{`.nflx-row::-webkit-scrollbar { display: none; }`}</style>
            {trails.map(trail => (
              <TrailPoster key={trail.id} trail={trail} onOpen={() => setOpen(trail)} />
            ))}
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

      {/* ─── Modal com os subtópicos ─── */}
      <TrailModal trail={open} onClose={() => setOpen(null)} />
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Featured card — destaque pra primeira trilha
// ──────────────────────────────────────────────────────────────────────────

function FeaturedCard({
  trail,
  onOpen,
}: {
  trail: EducaSalesTrail
  onOpen: () => void
}) {
  const Icon = ICONS[trail.iconName] ?? GraduationCap
  const hasCover = !!trail.coverUrl

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full text-left overflow-hidden rounded-3xl group transition-transform active:scale-[0.995]"
      style={{
        background: hasCover
          ? 'rgba(22,18,14,0.9)'
          : `linear-gradient(135deg, ${trail.color}40 0%, rgba(22,18,14,0.95) 65%)`,
        border: '1px solid rgba(201,168,76,0.25)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      }}
    >
      {/* Capa de fundo (se existir) */}
      {hasCover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trail.coverUrl ?? ''}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity"
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${trail.color}55 0%, rgba(22,18,14,0.92) 65%)`,
            }}
          />
        </>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(60% 80% at 90% 50%, ${trail.color}25 0%, transparent 60%)`,
        }}
      />

      <div className="relative grid md:grid-cols-[1fr_320px] gap-6 p-6 md:p-8">
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
          {trail.subtitle && (
            <p
              className="text-sm md:text-base mb-2"
              style={{
                color: 'rgba(242,237,228,0.85)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.55,
              }}
            >
              {trail.subtitle}
            </p>
          )}
          {trail.description && (
            <p
              className="text-sm mb-5 max-w-md"
              style={{
                color: 'rgba(242,237,228,0.68)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.55,
              }}
            >
              {trail.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs" style={{ fontFamily: 'var(--font-body)', color: trail.color }}>
            <BookOpen className="w-4 h-4" />
            <span>{trail.steps.length} lições</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ color: 'rgba(242,237,228,0.6)' }}>Toque pra ver o índice</span>
          </div>
        </div>

        {/* Pequena prévia das lições (até 4) */}
        <div
          className="hidden md:flex flex-col gap-2 p-4 rounded-2xl"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {trail.steps.slice(0, 4).map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-xs"
              style={{ color: 'rgba(242,237,228,0.78)', fontFamily: 'var(--font-body)' }}
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full inline-flex items-center justify-center mt-0.5 text-[10px]"
                style={{
                  background: `${trail.color}22`,
                  border: `1px solid ${trail.color}55`,
                  color: trail.color,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </span>
              <span className="leading-snug">{step.label}</span>
            </div>
          ))}
          {trail.steps.length > 4 && (
            <p
              className="text-[10px] text-center mt-1"
              style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'var(--font-body)' }}
            >
              + {trail.steps.length - 4}{' '}
              {trail.steps.length - 4 === 1 ? 'lição' : 'lições'}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Poster — card pequeno da fileira
// ──────────────────────────────────────────────────────────────────────────

function TrailPoster({
  trail,
  onOpen,
}: {
  trail: EducaSalesTrail
  onOpen: () => void
}) {
  const Icon = ICONS[trail.iconName] ?? BookOpen
  const hasCover = !!trail.coverUrl

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25 }}
      className="relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] rounded-2xl overflow-hidden cursor-pointer text-left"
      style={{
        scrollSnapAlign: 'start',
        aspectRatio: '0.7 / 1',
        background: hasCover
          ? 'rgba(22,18,14,0.9)'
          : `linear-gradient(165deg, ${trail.color}55 0%, rgba(22,18,14,0.96) 70%)`,
        border: '1px solid rgba(201,168,76,0.18)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
      }}
    >
      {hasCover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trail.coverUrl ?? ''}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(165deg, ${trail.color}55 0%, rgba(22,18,14,0.85) 70%)`,
            }}
          />
        </>
      )}

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
              background: 'rgba(0,0,0,0.5)',
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
          {trail.subtitle && (
            <p
              className="text-[11px] mb-2"
              style={{
                color: 'rgba(242,237,228,0.65)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
              }}
            >
              {trail.subtitle}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: trail.color, fontFamily: 'var(--font-body)' }}>
            <BookOpen className="w-3 h-3" />
            <span>{trail.steps.length} lições</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Modal com os subtópicos (Radix Dialog — centraliza na viewport, não no scroll)
// ──────────────────────────────────────────────────────────────────────────

function TrailModal({
  trail,
  onClose,
}: {
  trail: EducaSalesTrail | null
  onClose: () => void
}) {
  const Icon = trail ? ICONS[trail.iconName] ?? BookOpen : BookOpen

  return (
    <Dialog.Root open={!!trail} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[100]"
          style={{
            background: 'rgba(10,8,6,0.78)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 200ms ease-out',
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-hidden flex flex-col rounded-3xl outline-none"
          style={{
            background: 'linear-gradient(160deg, #1C1610 0%, #0F0E0C 100%)',
            border: '1px solid rgba(201,168,76,0.3)',
            boxShadow: '0 50px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
          }}
        >
          {trail && (
            <>
              {/* Header com capa / gradient */}
              <div
                className="relative px-6 md:px-8 pt-7 pb-6 flex-shrink-0"
                style={{
                  background: trail.coverUrl
                    ? `linear-gradient(165deg, ${trail.color}55 0%, rgba(22,18,14,0.92) 75%)`
                    : `linear-gradient(165deg, ${trail.color}45 0%, rgba(22,18,14,0.92) 75%)`,
                }}
              >
                {trail.coverUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={trail.coverUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                      aria-hidden
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(165deg, ${trail.color}50 0%, rgba(22,18,14,0.92) 75%)`,
                      }}
                    />
                  </>
                )}

                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Fechar"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full inline-flex items-center justify-center transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(242,237,228,0.8)',
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                      style={{
                        background: `${trail.color}30`,
                        border: `1px solid ${trail.color}66`,
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

                  <Dialog.Title asChild>
                    <h3
                      className="display-cormorant text-2xl md:text-3xl mb-1.5 pr-8"
                      style={{ color: '#F5EFE6', fontWeight: 600 }}
                    >
                      {trail.title}
                    </h3>
                  </Dialog.Title>

                  {trail.subtitle && (
                    <p
                      className="text-sm"
                      style={{
                        color: 'rgba(242,237,228,0.75)',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.5,
                      }}
                    >
                      {trail.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de lições */}
              <div className="px-6 md:px-8 py-6 overflow-y-auto flex-1">
                <p
                  className="eyebrow-label mb-4"
                  style={{ color: 'rgba(242,237,228,0.55)' }}
                >
                  ◆ {trail.steps.length} lições no índice
                </p>

                {trail.steps.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: 'rgba(242,237,228,0.6)', fontFamily: 'var(--font-body)' }}
                  >
                    Esta trilha ainda não tem lições publicadas.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {trail.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full inline-flex items-center justify-center text-xs"
                          style={{
                            background: `${trail.color}22`,
                            border: `1px solid ${trail.color}55`,
                            color: trail.color,
                            fontFamily: 'Cinzel, serif',
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-sm leading-snug mb-0.5"
                            style={{ color: '#F5EFE6', fontFamily: 'var(--font-body)', fontWeight: 500 }}
                          >
                            {step.label}
                          </p>
                          {step.description && (
                            <p
                              className="text-xs leading-snug"
                              style={{
                                color: 'rgba(242,237,228,0.6)',
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              {step.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Footer */}
              <div
                className="px-6 md:px-8 py-4 flex-shrink-0"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.25)',
                }}
              >
                <p
                  className="text-[11px] text-center"
                  style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'var(--font-body)' }}
                >
                  Conteúdo completo dentro do app — disponível com a assinatura.
                </p>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
