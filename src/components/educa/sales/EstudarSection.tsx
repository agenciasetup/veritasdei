'use client'

/**
 * Seção "Estudar" — full-screen estilo Netflix.
 *
 * Carrega os pilares de estudo (content_groups) e seus tópicos
 * (content_topics) direto do banco — o mesmo material disponível em
 * /estudo. Nada inventado.
 *
 * Cada poster mostra um pilar (com capa, se houver). Clique → abre um
 * Dialog centralizado na viewport listando os tópicos que vivem dentro
 * daquele pilar. Sem conteúdo completo — só índice.
 */

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  BookOpen,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Church,
  Crown,
  Droplets,
  Flame,
  Heart,
  ScrollText,
  Scale,
  Search,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { EducaSalesPilar, EducaSalesTopico } from '@/lib/educa/server-data'

// ──────────────────────────────────────────────────────────────────────────
// Mapeamento de ícones — `content_groups.icon` mistura nomes lucide
// (lowercase ou PascalCase) e emojis. Renderiza o que couber.
// ──────────────────────────────────────────────────────────────────────────

const LUCIDE_MAP: Record<string, LucideIcon> = {
  church: Church,
  droplets: Droplets,
  tablets: ScrollText,
  scrolltext: ScrollText,
  bookopen: BookOpen,
  bookopentext: BookOpenText,
  scale: Scale,
  heart: Heart,
  flame: Flame,
  crown: Crown,
  star: Star,
  sparkles: Sparkles,
  search: Search,
}

function normalizeIconKey(s: string): string {
  return s.toLowerCase().replace(/[-_\s]/g, '')
}

function isEmojiLike(s: string): boolean {
  if (!s) return false
  // Qualquer char não-ASCII no começo já indica emoji/símbolo
  return /[^\x00-\x7F]/.test(s[0])
}

function PilarIconView({
  icon,
  color,
  size = 18,
}: {
  icon: string | null
  color: string
  size?: number
}) {
  if (!icon) {
    return <BookOpen style={{ width: size, height: size, color }} />
  }
  if (isEmojiLike(icon)) {
    return (
      <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
        {icon}
      </span>
    )
  }
  const Icon = LUCIDE_MAP[normalizeIconKey(icon)] ?? BookOpen
  return <Icon style={{ width: size, height: size, color }} />
}

// ──────────────────────────────────────────────────────────────────────────
// Paleta de cores cíclica (content_groups não guarda cor própria)
// ──────────────────────────────────────────────────────────────────────────

const PALETTE = ['#C9A84C', '#8B3145', '#4A90D9', '#7A4C82', '#8B6914']

function colorFor(pilar: EducaSalesPilar): string {
  return PALETTE[(pilar.sortOrder - 1 + PALETTE.length) % PALETTE.length] ?? '#C9A84C'
}

// ──────────────────────────────────────────────────────────────────────────

type Props = {
  pilares: EducaSalesPilar[]
}

export default function EstudarSection({ pilares }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<EducaSalesPilar | null>(null)

  const featured = pilares[0]

  function scrollRow(dir: 'left' | 'right') {
    const el = rowRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (pilares.length === 0) {
    return null
  }

  const totalTopicos = pilares.reduce((sum, p) => sum + p.topicos.length, 0)

  return (
    <section
      id="estudar"
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ background: 'var(--surface-1)' }}
    >
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
            <span
              className="display-cinzel text-4xl md:text-5xl leading-none"
              style={{ color: '#C9A84C', opacity: 0.85, fontWeight: 600 }}
            >
              01
            </span>
            <span className="hidden sm:block w-12 h-px" style={{ background: 'rgba(201,168,76,0.5)' }} />
            <span className="eyebrow-label" style={{ color: '#D9C077' }}>
              Estudar
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-end">
            <h2
              className="display-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.05] max-w-xl"
              style={{ color: '#F5EFE6', textWrap: 'balance' }}
            >
              Todo o material{' '}
              <span className="italic" style={{ color: '#E6D9B5' }}>
                organizado e ao seu alcance.
              </span>
            </h2>

            <ul className="flex flex-col gap-2.5 lg:pl-6 lg:border-l" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
              {[
                `${pilares.length} pilares e ${totalTopicos} tópicos. Toque em qualquer um pra ver o índice antes de assinar.`,
                'Anote dentro do app. Suas notas ficam guardadas em cada tópico.',
                'Avaliações por módulo, com XP e conquistas pra você medir o que aprendeu.',
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

      {/* ─── Featured pilar ─── */}
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
              ◆ Em destaque
            </p>
            <FeaturedCard pilar={featured} onOpen={() => setOpen(featured)} />
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
              ◆ Pilares de estudo · {pilares.length}
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
            {pilares.map(pilar => (
              <PilarPoster
                key={pilar.id}
                pilar={pilar}
                onOpen={() => setOpen(pilar)}
              />
            ))}
            <div className="flex-shrink-0 w-6 md:w-12" aria-hidden />
          </div>
        </motion.div>
      </div>

      <PilarModal pilar={open} onClose={() => setOpen(null)} />
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Card em destaque
// ──────────────────────────────────────────────────────────────────────────

function FeaturedCard({
  pilar,
  onOpen,
}: {
  pilar: EducaSalesPilar
  onOpen: () => void
}) {
  const color = colorFor(pilar)
  const hasCover = !!pilar.coverUrl
  const previewTopicos = pilar.topicos.slice(0, 4)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full text-left overflow-hidden rounded-3xl group transition-transform active:scale-[0.995]"
      style={{
        minHeight: 'clamp(320px, 38vw, 440px)',
        background: hasCover
          ? 'rgba(22,18,14,0.9)'
          : `linear-gradient(135deg, ${color}40 0%, rgba(22,18,14,0.95) 65%)`,
        border: '1px solid rgba(201,168,76,0.3)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      }}
    >
      {hasCover && (
        <>
          <Image
            src={pilar.coverUrl ?? ''}
            alt=""
            fill
            sizes="(min-width: 1024px) 1000px, 100vw"
            className="object-cover opacity-80 group-hover:opacity-90 transition-opacity"
            loading="lazy"
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, rgba(15,14,12,0.88) 0%, rgba(22,18,14,0.55) 45%, rgba(22,18,14,0.15) 100%)`,
            }}
          />
        </>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(60% 80% at 100% 50%, ${color}20 0%, transparent 55%)`,
        }}
      />

      <div className="relative h-full grid md:grid-cols-[1fr_320px] gap-6 p-6 md:p-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: `${color}22`,
                border: `1px solid ${color}55`,
              }}
            >
              <PilarIconView icon={pilar.icon} color={color} size={20} />
            </span>
            <span
              className="text-[10px] uppercase"
              style={{
                color,
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.22em',
              }}
            >
              Pilar · {pilar.topicos.length}{' '}
              {pilar.topicos.length === 1 ? 'tópico' : 'tópicos'}
            </span>
          </div>

          <h3
            className="display-cormorant text-3xl md:text-4xl mb-2"
            style={{ color: '#F5EFE6', fontWeight: 600 }}
          >
            {pilar.title}
          </h3>
          {pilar.subtitle && (
            <p
              className="text-sm md:text-base mb-2"
              style={{
                color: 'rgba(242,237,228,0.85)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.55,
              }}
            >
              {pilar.subtitle}
            </p>
          )}
          {pilar.description && (
            <p
              className="text-sm mb-5 max-w-md"
              style={{
                color: 'rgba(242,237,228,0.68)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.55,
              }}
            >
              {pilar.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-body)', color }}>
            <BookOpen className="w-4 h-4" />
            <span>{pilar.topicos.length} tópicos</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ color: 'rgba(242,237,228,0.6)' }}>Toque pra ver o índice completo</span>
          </div>
        </div>

        {previewTopicos.length > 0 && (
          <div
            className="hidden md:flex flex-col gap-2 p-4 rounded-2xl"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {previewTopicos.map((t, i) => (
              <div
                key={t.id}
                className="flex items-start gap-2.5 text-xs"
                style={{ color: 'rgba(242,237,228,0.78)', fontFamily: 'var(--font-body)' }}
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full inline-flex items-center justify-center mt-0.5 text-[10px]"
                  style={{
                    background: `${color}22`,
                    border: `1px solid ${color}55`,
                    color,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </span>
                <span className="leading-snug">{t.title}</span>
              </div>
            ))}
            {pilar.topicos.length > previewTopicos.length && (
              <p
                className="text-[10px] text-center mt-1"
                style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'var(--font-body)' }}
              >
                + {pilar.topicos.length - previewTopicos.length} tópicos
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Poster pequeno (linha Netflix)
// ──────────────────────────────────────────────────────────────────────────

function PilarPoster({
  pilar,
  onOpen,
}: {
  pilar: EducaSalesPilar
  onOpen: () => void
}) {
  const color = colorFor(pilar)
  const hasCover = !!pilar.coverUrl

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
          : `linear-gradient(165deg, ${color}55 0%, rgba(22,18,14,0.96) 70%)`,
        border: '1px solid rgba(201,168,76,0.18)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
      }}
    >
      {hasCover && (
        <>
          <Image
            src={pilar.coverUrl ?? ''}
            alt=""
            fill
            sizes="220px"
            className="object-cover"
            loading="lazy"
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(165deg, ${color}55 0%, rgba(22,18,14,0.85) 70%)`,
            }}
          />
        </>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(70% 50% at 50% 0%, ${color}30 0%, transparent 60%)`,
        }}
      />

      <div className="absolute inset-0 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
            style={{
              background: `${color}25`,
              border: `1px solid ${color}55`,
            }}
          >
            <PilarIconView icon={pilar.icon} color={color} size={16} />
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
            Pilar
          </span>
        </div>

        <div className="flex-1" />

        <div>
          <h4
            className="display-cormorant text-lg leading-tight mb-1"
            style={{ color: '#F5EFE6', fontWeight: 600, textWrap: 'balance' }}
          >
            {pilar.title}
          </h4>
          {pilar.subtitle && (
            <p
              className="text-[11px] mb-2 line-clamp-2"
              style={{
                color: 'rgba(242,237,228,0.65)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
              }}
            >
              {pilar.subtitle}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color, fontFamily: 'var(--font-body)' }}>
            <BookOpen className="w-3 h-3" />
            <span>
              {pilar.topicos.length}{' '}
              {pilar.topicos.length === 1 ? 'tópico' : 'tópicos'}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Modal — Radix Dialog centralizado, lista os tópicos do pilar
// ──────────────────────────────────────────────────────────────────────────

function PilarModal({
  pilar,
  onClose,
}: {
  pilar: EducaSalesPilar | null
  onClose: () => void
}) {
  return (
    <Dialog.Root open={!!pilar} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[100]"
          style={{
            background: 'rgba(10,8,6,0.78)',
            backdropFilter: 'blur(8px)',
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
          {pilar && <PilarModalBody pilar={pilar} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PilarModalBody({ pilar }: { pilar: EducaSalesPilar }) {
  const color = colorFor(pilar)
  return (
    <>
      <div
        className="relative px-6 md:px-8 pt-7 pb-6 flex-shrink-0"
        style={{
          background: `linear-gradient(165deg, ${color}45 0%, rgba(22,18,14,0.92) 75%)`,
        }}
      >
        {pilar.coverUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pilar.coverUrl}
              alt="" loading="lazy" decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              aria-hidden
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(165deg, ${color}50 0%, rgba(22,18,14,0.92) 75%)`,
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
                background: `${color}30`,
                border: `1px solid ${color}66`,
              }}
            >
              <PilarIconView icon={pilar.icon} color={color} size={20} />
            </span>
            <span
              className="text-[10px] uppercase"
              style={{
                color,
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.22em',
              }}
            >
              Pilar · {pilar.topicos.length}{' '}
              {pilar.topicos.length === 1 ? 'tópico' : 'tópicos'}
            </span>
          </div>

          <Dialog.Title asChild>
            <h3
              className="display-cormorant text-2xl md:text-3xl mb-1.5 pr-8"
              style={{ color: '#F5EFE6', fontWeight: 600 }}
            >
              {pilar.title}
            </h3>
          </Dialog.Title>

          {pilar.subtitle && (
            <p
              className="text-sm"
              style={{
                color: 'rgba(242,237,228,0.78)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.5,
              }}
            >
              {pilar.subtitle}
            </p>
          )}
          {pilar.description && (
            <p
              className="text-sm mt-1.5"
              style={{
                color: 'rgba(242,237,228,0.62)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.5,
              }}
            >
              {pilar.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 md:px-8 py-6 overflow-y-auto flex-1">
        <p
          className="eyebrow-label mb-4"
          style={{ color: 'rgba(242,237,228,0.55)' }}
        >
          ◆ Tópicos
        </p>

        {pilar.topicos.length === 0 ? (
          <p
            className="text-sm"
            style={{ color: 'rgba(242,237,228,0.6)', fontFamily: 'var(--font-body)' }}
          >
            Este pilar ainda não tem tópicos publicados.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {pilar.topicos.map((t, i) => (
              <TopicoRow key={t.id} topico={t} index={i + 1} color={color} />
            ))}
          </ol>
        )}
      </div>

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
          Conteúdo completo liberado dentro do app, com a assinatura.
        </p>
      </div>
    </>
  )
}

function TopicoRow({
  topico,
  index,
  color,
}: {
  topico: EducaSalesTopico
  index: number
  color: string
}) {
  const hasCover = !!topico.coverUrl
  return (
    <li
      className="relative flex items-start gap-3 p-3 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {hasCover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={topico.coverUrl ?? ''}
            alt="" loading="lazy" decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-15"
            aria-hidden
          />
          <div className="absolute inset-0" style={{ background: 'rgba(15,14,12,0.55)' }} />
        </>
      )}
      <span
        className="relative flex-shrink-0 w-7 h-7 rounded-full inline-flex items-center justify-center text-xs"
        style={{
          background: `${color}22`,
          border: `1px solid ${color}55`,
          color,
          fontFamily: 'Cinzel, serif',
          fontWeight: 600,
        }}
      >
        {index}
      </span>
      <div className="relative min-w-0">
        <p
          className="text-sm leading-snug mb-0.5"
          style={{ color: '#F5EFE6', fontFamily: 'var(--font-body)', fontWeight: 500 }}
        >
          {topico.title}
        </p>
        {topico.subtitle && (
          <p
            className="text-xs leading-snug"
            style={{
              color: 'rgba(242,237,228,0.6)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {topico.subtitle}
          </p>
        )}
      </div>
    </li>
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
