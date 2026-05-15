'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ChevronRight, MapPin, Sparkles } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import { HeroDashboardMockup } from './EducaMockups'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { EducaSalesTotals } from '@/lib/educa/server-data'

type Props = {
  isAuthenticated: boolean
  onPrimaryClick: () => void
  totals: EducaSalesTotals
}

/**
 * Hero da página de venda do Veritas Educa.
 *
 * Estética: surface-velvet (mesma da landing do Veritas Dei) com orbs
 * pulsantes, faíscas douradas e o mockup do app flutuando suavemente.
 * Mobile mostra o mockup empilhado abaixo (em escala reduzida).
 */
export default function Hero({ isAuthenticated, onPrimaryClick, totals }: Props) {
  // Calcula a liturgia do dia uma vez por mount — usado pra rotular o
  // mockup do dashboard com o nome real do tempo litúrgico de hoje.
  const liturgicalLabel = useMemo(() => {
    const d = getLiturgicalDay(new Date())
    return d.name || d.title || 'Tempo Comum'
  }, [])

  return (
    <section className="surface-velvet relative min-h-[100svh] md:min-h-screen overflow-hidden">
      {/* ─── Orbs pulsantes (background) ─── */}
      <div
        className="hero-orb glow-pulse"
        style={{
          top: '-120px',
          left: '-100px',
          width: '540px',
          height: '540px',
          background: 'radial-gradient(circle, rgba(107,29,42,0.55) 0%, transparent 70%)',
        }}
      />
      <div
        className="hero-orb glow-pulse"
        style={{
          bottom: '-120px',
          right: '-120px',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.20) 0%, transparent 70%)',
          animationDelay: '1.6s',
        }}
      />

      {/* ─── Faíscas douradas drifting ─── */}
      {[
        { top: '18%', left: '12%', size: 3, delay: 0 },
        { top: '32%', right: '20%', size: 2, delay: 1.2 },
        { top: '60%', left: '20%', size: 2, delay: 2.4 },
        { top: '70%', right: '14%', size: 3, delay: 0.6 },
        { top: '46%', left: '8%', size: 2, delay: 1.8 },
      ].map((s, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute hidden md:block rounded-full"
          style={{
            ...s,
            width: s.size,
            height: s.size,
            background: '#D9C077',
            boxShadow: '0 0 10px rgba(217,192,119,0.7)',
          }}
          animate={{ y: [0, -14, 0], opacity: [0.3, 0.85, 0.3] }}
          transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}

      {/* ─── Top strip ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 pt-6 md:pt-8">
          <div className="flex items-center justify-between gap-4 pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <CrossIcon size="xs" />
              <span
                className="text-[10px] uppercase"
                style={{
                  color: '#D9C077',
                  fontFamily: 'Cinzel, serif',
                  letterSpacing: '0.28em',
                }}
              >
                Veritas Educa
              </span>
            </div>
            <Link
              href="/login?next=/educa"
              className="text-[10px] uppercase underline-offset-4 hover:underline transition-colors"
              style={{
                color: '#D9C077',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.18em',
              }}
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Conteúdo principal ─── */}
      <div className="relative z-10 min-h-[100svh] md:min-h-screen flex items-center px-5 md:px-10 lg:px-16 pt-24 md:pt-28 pb-20 md:pb-24">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* ─── Texto (esquerda) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Ornament inline */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 opacity-80">
              <span
                className="w-12 h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.8))' }}
              />
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
              <span
                className="text-[10px] uppercase"
                style={{
                  color: '#E6D9B5',
                  fontFamily: 'Cinzel, serif',
                  letterSpacing: '0.32em',
                }}
              >
                Estude a fé
              </span>
              <span
                className="w-12 h-px"
                style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.8))' }}
              />
            </div>

            <h1
              className="hero-title display-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-[76px] xl:text-[92px] leading-[0.98] mb-6 md:mb-8"
              style={{ color: '#F5EFE6', textWrap: 'balance', fontWeight: 500 }}
            >
              <span className="block">A fé católica,</span>
              <span
                className="block italic"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: '#E6D9B5', fontWeight: 500 }}
              >
                estudada com método.
              </span>
            </h1>

            <p
              className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 mb-10"
              style={{
                color: '#CEC3B3',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.6,
              }}
            >
              Trilhas guiadas por Bíblia, Magistério e Patrística. Terço em
              grupo, modo debate com IA, e um acervo de cartas pra colecionar
              conforme você estuda — tudo em um app.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center lg:justify-start mb-8">
              <button
                onClick={onPrimaryClick}
                className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
              >
                {isAuthenticated ? 'Escolher meu plano' : 'Criar conta e assinar'}
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href="#funcoes"
                className="btn-ghost-dark inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[12px] focus-visible:outline-none focus-visible:ring-2"
              >
                Ver as funções
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(242,237,228,0.55)' }}>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3 h-3" style={{ color: '#C9A84C' }} />
                Em português
              </span>
              <span className="w-px h-3" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <span>Pagamento Pix, cartão ou boleto</span>
              <span className="w-px h-3" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <span>Cancele quando quiser</span>
            </div>
          </motion.div>

          {/* ─── Mockup do dashboard (direita) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-5 flex justify-center lg:justify-end relative"
          >
            {/* Glow atrás */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(60% 70% at 50% 40%, rgba(201,168,76,0.18), transparent 70%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Phone flutuando */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-[240px] sm:w-[280px] md:w-[300px] lg:w-[320px]"
              style={{
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55))',
              }}
            >
              <HeroDashboardMockup className="w-full h-auto" liturgia={liturgicalLabel} />
            </motion.div>

            {/* Mini-chip "XP por estudar" flutuando à esquerda do phone */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{
                top: '14%',
                left: '-2%',
                background: 'rgba(22,18,14,0.85)',
                border: '1px solid rgba(201,168,76,0.4)',
                backdropFilter: 'blur(8px)',
                color: '#E6D9B5',
                fontFamily: 'Cinzel, serif',
                fontSize: '11px',
                letterSpacing: '0.14em',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
              XP por lição
            </motion.div>

            {/* Mini-chip "Sequência diária" à direita */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="absolute hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{
                bottom: '18%',
                right: '-4%',
                background: 'rgba(22,18,14,0.85)',
                border: '1px solid rgba(201,168,76,0.4)',
                backdropFilter: 'blur(8px)',
                color: '#E6D9B5',
                fontFamily: 'Cinzel, serif',
                fontSize: '11px',
                letterSpacing: '0.14em',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path
                    d="M12 4 Q15 8 13 12 Q17 11 17 16 Q17 20 12 20 Q7 20 7 16 Q7 13 9 11 Q11 13 11 10 Q11 7 12 4 Z"
                    fill="#C9A84C"
                  />
                </svg>
              </span>
              Sequência diária
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ─── Faixa inferior: stats + scroll cue ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-6 md:pb-10 pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16">
          <div className="gold-rule opacity-60 mb-5" />
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div
              className="flex items-center gap-5 md:gap-8 pointer-events-auto"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <MiniStat value={String(totals.pilares)} label="Pilares" />
              <span className="w-px h-4" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <MiniStat value={String(totals.topicos)} label="Tópicos" />
              <span className="w-px h-4" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <MiniStat value={String(totals.subtopicos)} label="Subtópicos" />
              <span className="hidden sm:inline-block w-px h-4" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <span className="hidden sm:inline-flex items-baseline gap-2">
                <MiniStat value={String(totals.cartas)} label={totals.cartas === 1 ? 'Carta' : 'Cartas'} />
              </span>
            </div>

            <span
              className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.32em]"
              style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'Cinzel, serif' }}
            >
              Role pra ver
              <span className="w-6 h-px" style={{ background: 'rgba(201,168,76,0.5)' }} />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg md:text-xl" style={{ color: '#F5EFE6', fontFamily: 'Cinzel, serif', fontWeight: 600 }}>
        {value}
      </span>
      <span
        className="text-[10px] uppercase"
        style={{ color: 'rgba(201,168,76,0.75)', letterSpacing: '0.22em' }}
      >
        {label}
      </span>
    </div>
  )
}
