'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Network,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
} from 'lucide-react'

const GOLD = '#C9A84C'
const BG_DEEP = '#0A0806'

export default function VerbumDashboard() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: BG_DEEP, fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 50% 100%, rgba(107,29,42,0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Hero section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Triquetra mini icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <svg viewBox="0 0 60 60" width={60} height={60}>
            <defs>
              <linearGradient id="dashGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0C060" />
                <stop offset="50%" stopColor="#C9A84C" />
                <stop offset="100%" stopColor="#A88A3C" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#dashGold)" strokeWidth="1.5">
              <path d="M 30 8 C 20 15, 18 28, 24 36 C 26 39, 28 40, 30 38 C 32 40, 34 39, 36 36 C 42 28, 40 15, 30 8 Z" />
              <path d="M 24 36 C 16 38, 8 48, 12 54 C 14 56, 16 57, 18 56 C 19 58, 21 59, 24 57 C 32 54, 34 44, 30 38 Z" />
              <path d="M 36 36 C 44 38, 52 48, 48 54 C 46 56, 44 57, 42 56 C 41 58, 39 59, 36 57 C 28 54, 26 44, 30 38 Z" />
              <circle cx="30" cy="38" r="4" strokeWidth="1" opacity="0.4" />
            </g>
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold text-center mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: GOLD, letterSpacing: '0.08em' }}
        >
          VERBUM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-center mb-1"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            color: '#A89060',
            letterSpacing: '0.05em',
          }}
        >
          In principio erat Verbum — Jo 1:1
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-center mb-10 max-w-md"
          style={{ color: '#5C4A2A' }}
        >
          Mappa Fidei — Grafo de conhecimento teológico católico
        </motion.p>

        {/* Main CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/verbum/canvas')}
          className="flex items-center gap-3 px-8 py-4 rounded-xl text-base font-semibold mb-16 transition-all"
          style={{
            background: `linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)`,
            border: `1px solid ${GOLD}`,
            color: GOLD,
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 24px rgba(201,168,76,0.15)',
          }}
        >
          <Network className="w-5 h-5" />
          Abrir Mappa Fidei
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="rounded-xl p-5"
              style={{
                background: 'rgba(20,18,14,0.72)',
                border: '1px solid rgba(201,168,76,0.12)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <feature.icon className="w-5 h-5 mb-3" style={{ color: feature.color }} />
              <h3
                className="text-sm font-semibold mb-1"
                style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}
              >
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: '#5C4A2A' }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats / info row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-6 mt-12"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-lg font-bold" style={{ color: GOLD, fontFamily: 'Cinzel, serif' }}>
                {stat.value}
              </div>
              <div className="text-[10px]" style={{ color: '#5C4A2A' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Bíblia Integrada',
    description: 'Busque versículos por referência, intervalo ou texto livre. Suporte a todas as traduções.',
    color: '#9AB0C8',
  },
  {
    icon: Layers,
    title: '6 Camadas Teológicas',
    description: 'Da Trindade ao estudo pessoal — visualize a fé em profundidade progressiva.',
    color: '#D4AA4A',
  },
  {
    icon: Sparkles,
    title: 'Conexões Inteligentes',
    description: 'IA sugere ligações tipológicas, proféticas e doutrinárias entre os nós do grafo.',
    color: '#D4884A',
  },
]

const STATS = [
  { value: '6', label: 'Camadas' },
  { value: '5', label: 'Tipos de conexão' },
  { value: '73', label: 'Livros bíblicos' },
]
