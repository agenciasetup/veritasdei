'use client'

/**
 * Hero da página de venda do Veritas Educa.
 *
 * Sem framer-motion no above-the-fold — todas as animações são CSS
 * (`.lp-anim-*` em globals.css). Isso reduz JS crítico em ~50KB e
 * acelera LCP. Componente fica praticamente "estático" enquanto o
 * resto da página carrega o framer via dynamic import.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronRight, LogOut, MapPin, Sparkles, User } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import { useAuth } from '@/contexts/AuthContext'
import { HeroDashboardMockup } from './EducaMockups'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { EducaSalesTotals } from '@/lib/educa/server-data'

type Props = {
  isAuthenticated: boolean
  userName: string | null
  onPrimaryClick: () => void
  totals: EducaSalesTotals
}

export default function Hero({ isAuthenticated, userName, onPrimaryClick, totals }: Props) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    setMenuOpen(false)
    try {
      await signOut()
    } catch {
      /* segue mesmo se o signOut falhar */
    }
    router.refresh()
  }
  // Calcula a liturgia do dia uma vez por mount — usado pra rotular o
  // mockup do dashboard com o nome real do tempo litúrgico de hoje.
  const liturgicalLabel = useMemo(() => {
    const d = getLiturgicalDay(new Date())
    return d.name || d.title || 'Tempo Comum'
  }, [])

  return (
    <section className="surface-velvet relative min-h-[100svh] md:min-h-screen overflow-hidden">
      {/* ─── Orbs pulsantes (CSS animation existente) ─── */}
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

      {/* ─── Faíscas douradas — CSS keyframes (lp-anim-spark) ─── */}
      {[
        { top: '18%', left: '12%', size: 3, delay: '0s' },
        { top: '32%', right: '20%', size: 2, delay: '1.2s' },
        { top: '60%', left: '20%', size: 2, delay: '2.4s' },
        { top: '70%', right: '14%', size: 3, delay: '0.6s' },
        { top: '46%', left: '8%', size: 2, delay: '1.8s' },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute hidden md:block rounded-full lp-anim-spark"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            width: s.size,
            height: s.size,
            background: '#D9C077',
            boxShadow: '0 0 10px rgba(217,192,119,0.7)',
            animationDelay: s.delay,
          }}
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
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(o => !o)}
                  aria-expanded={menuOpen}
                  className="inline-flex items-center gap-2 text-[10px] uppercase hover:opacity-80 transition-opacity"
                  style={{
                    color: '#D9C077',
                    fontFamily: 'Cinzel, serif',
                    letterSpacing: '0.18em',
                  }}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline truncate max-w-[140px]">
                    {(userName ?? 'Conta').split(' ')[0]}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden
                    />
                    <div
                      className="absolute right-0 top-full mt-2 z-40 min-w-[200px] rounded-2xl py-2"
                      style={{
                        background: 'rgba(15,14,12,0.95)',
                        border: '1px solid rgba(201,168,76,0.35)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {userName && (
                        <p
                          className="px-4 py-2 text-[11px] truncate"
                          style={{
                            color: 'rgba(242,237,228,0.65)',
                            fontFamily: 'var(--font-body)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {userName}
                        </p>
                      )}
                      <Link
                        href="/educa"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-[12px] hover:bg-white/5"
                        style={{
                          color: '#F5EFE6',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        Ir pro estudo
                      </Link>
                      <Link
                        href="/educa/checkout"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-[12px] hover:bg-white/5"
                        style={{
                          color: '#F5EFE6',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        Finalizar assinatura
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-white/5 inline-flex items-center gap-2"
                        style={{
                          color: '#E6A8A8',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* ─── Conteúdo principal ─── */}
      <div className="relative z-10 min-h-[100svh] md:min-h-screen flex items-center px-5 md:px-10 lg:px-16 pt-24 md:pt-28 pb-20 md:pb-24">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* ─── Texto (esquerda) ─── */}
          <div className="lg:col-span-7 text-center lg:text-left lp-anim-fade-in">
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
              className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 mb-6"
              style={{
                color: '#CEC3B3',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.6,
              }}
            >
              Você aprende a Bíblia, o Catecismo e o que a Igreja sempre
              ensinou. Em lições curtas, no seu ritmo, com base no Magistério
              e nos santos.
            </p>

            <ul
              className="flex flex-col gap-2 mb-10 max-w-xl mx-auto lg:mx-0"
              style={{
                color: 'rgba(242,237,228,0.85)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.5,
              }}
            >
              {[
                'Dogmas, Sacramentos, Bíblia, Defesa da Fé e outros pilares.',
                'Modo debate: treine apologética com uma IA católica.',
                'Terço em grupo, em sala fechada com seus amigos.',
                'Coleção de cartas de santos e doutores conforme estuda.',
              ].map(item => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm md:text-[15px] text-left"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full inline-flex items-center justify-center mt-0.5"
                    style={{
                      background: 'rgba(201,168,76,0.14)',
                      border: '1px solid rgba(201,168,76,0.45)',
                      color: '#C9A84C',
                      fontSize: 11,
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center lg:justify-start mb-8">
              <button
                onClick={onPrimaryClick}
                className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
              >
                {isAuthenticated ? 'Finalizar assinatura' : 'Criar conta e assinar'}
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
                Fiel ao Magistério
              </span>
              <span className="w-px h-3" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <span>Pix, cartão ou boleto</span>
              <span className="w-px h-3" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <span>Cancele quando quiser</span>
            </div>
          </div>

          {/* ─── Mockup do dashboard (direita) ─── */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative lp-anim-fade-in-delayed">
            {/* Glow atrás */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(60% 70% at 50% 40%, rgba(201,168,76,0.18), transparent 70%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Phone flutuando (CSS animation) */}
            <div
              className="relative w-[300px] sm:w-[340px] md:w-[340px] lg:w-[380px] lp-anim-float"
              style={{
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55))',
              }}
            >
              <HeroDashboardMockup className="w-full h-auto" liturgia={liturgicalLabel} />
            </div>

            {/* Mini-chip "XP por estudar" — float-down */}
            <div
              className="absolute hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full lp-anim-float-down"
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
            </div>

            {/* Mini-chip "Sequência diária" — float-up */}
            <div
              className="absolute hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full lp-anim-float-up"
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
            </div>
          </div>
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
