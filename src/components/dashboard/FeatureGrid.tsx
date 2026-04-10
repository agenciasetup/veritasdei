'use client'

import Link from 'next/link'
import {
  GraduationCap, Church, Droplets, Tablets, BookOpen, MapPin,
  ScrollText, Scale, Heart, Users,
} from 'lucide-react'

/* ─── Primary features (larger cards, always visible) ─── */
const PRIMARY_FEATURES = [
  {
    href: '/trilhas',
    icon: GraduationCap,
    title: 'Trilhas de Estudo',
    desc: 'Formação católica passo a passo, do básico ao avançado',
    accent: '#C9A84C',
  },
  {
    href: '/dogmas',
    icon: Church,
    title: 'Dogmas da Fé',
    desc: 'As 44 verdades reveladas pela Igreja',
    accent: '#C9A84C',
  },
  {
    href: '/sacramentos',
    icon: Droplets,
    title: 'Sacramentos',
    desc: 'Os 7 sinais eficazes da graça divina',
    accent: '#8BA4D9',
  },
  {
    href: '/mandamentos',
    icon: Tablets,
    title: 'Mandamentos',
    desc: 'As 10 leis de Deus para a vida cristã',
    accent: '#C9A84C',
  },
  {
    href: '/oracoes',
    icon: BookOpen,
    title: 'Orações',
    desc: 'As 8 orações fundamentais da fé',
    accent: '#D9C077',
  },
  {
    href: '/paroquias',
    icon: MapPin,
    title: 'Paróquias',
    desc: 'Encontre igrejas católicas perto de você',
    accent: '#66BB6A',
  },
]

/* ─── Secondary features (smaller, below the fold) ─── */
const SECONDARY_FEATURES = [
  { href: '/preceitos', icon: ScrollText, title: 'Preceitos', desc: '5 mandamentos da Igreja' },
  { href: '/virtudes-pecados', icon: Scale, title: 'Virtudes e Pecados', desc: 'Virtudes e vícios capitais' },
  { href: '/obras-misericordia', icon: Heart, title: 'Obras de Misericórdia', desc: '14 ações de caridade' },
  { href: '/comunidade', icon: Users, title: 'Comunidade', desc: 'Conecte-se com católicos' },
]

export default function FeatureGrid() {
  return (
    <section className="relative z-10 w-full px-4 md:px-8 pb-8 fade-in">
      <div className="max-w-5xl mx-auto">

        {/* ── Section divider ── */}
        <div className="ornament-divider max-w-sm mx-auto mb-6">
          <span style={{ fontSize: '0.7rem' }}>&#10022;</span>
        </div>

        {/* ── Section title ── */}
        <h2
          className="text-center text-xs tracking-[0.2em] uppercase mb-6"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-muted)' }}
        >
          Explore a Fé Católica
        </h2>

        {/* ── Primary cards (bigger, 2-3 columns) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6">
          {PRIMARY_FEATURES.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-4 p-5 md:p-6 rounded-2xl transition-all duration-300 fade-in"
                style={{
                  background: 'rgba(20,18,14,0.6)',
                  border: '1px solid var(--border-gold)',
                  backdropFilter: 'blur(12px)',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${item.accent}12`,
                    border: `1px solid ${item.accent}25`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.accent }} />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold tracking-wide uppercase mb-1"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {item.desc}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Secondary cards (smaller, 2-4 columns) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SECONDARY_FEATURES.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center text-center p-4 rounded-xl transition-all duration-300 fade-in"
                style={{
                  background: 'rgba(20,18,14,0.4)',
                  border: '1px solid var(--border-subtle)',
                  animationDelay: `${(i + 6) * 0.06}s`,
                }}
              >
                <Icon
                  className="w-5 h-5 mb-2 transition-colors duration-200 group-hover:text-[var(--gold)]"
                  style={{ color: 'var(--text-muted)' }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
                >
                  {item.title}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
