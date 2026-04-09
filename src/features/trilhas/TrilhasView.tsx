'use client'

import Link from 'next/link'
import { BookOpen, Church, Droplets, Shield, Heart, GraduationCap, Flame } from 'lucide-react'

interface TrailStep {
  label: string
  href: string
  description: string
}

interface Trail {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'
  steps: TrailStep[]
  color: string
}

const TRAILS: Trail[] = [
  {
    id: 'iniciante',
    icon: <GraduationCap className="w-7 h-7" />,
    title: 'Católico Iniciante',
    subtitle: 'O essencial da fé',
    description: 'Para quem está começando a conhecer a Igreja Católica. Percorra os fundamentos: o que cremos, como rezamos, e o que Deus pede de nós.',
    difficulty: 'Iniciante',
    color: '#C9A84C',
    steps: [
      { label: 'Os Mandamentos de Deus', href: '/mandamentos', description: 'A lei moral que Deus nos deu' },
      { label: 'Os Preceitos da Igreja', href: '/preceitos', description: 'O mínimo que a Igreja pede' },
      { label: 'As Orações Fundamentais', href: '/oracoes', description: 'As preces que todo católico deve saber' },
      { label: 'Os Sacramentos', href: '/sacramentos', description: 'Os sinais da graça de Deus' },
    ],
  },
  {
    id: 'sacramental',
    icon: <Droplets className="w-7 h-7" />,
    title: 'Vida Sacramental',
    subtitle: 'Os canais da graça',
    description: 'Mergulhe nos 7 Sacramentos: o que são, como funcionam, o que significam. Ideal para quem se prepara para receber algum sacramento.',
    difficulty: 'Intermediário',
    color: '#8B3145',
    steps: [
      { label: 'Os 7 Sacramentos', href: '/sacramentos', description: 'Visão geral dos sinais da graça' },
      { label: 'Virtudes Teologais', href: '/virtudes-pecados', description: 'Fé, Esperança e Caridade' },
      { label: 'Os Pecados Capitais', href: '/virtudes-pecados', description: 'Conhecer o inimigo interior' },
      { label: 'Obras de Misericórdia', href: '/obras-misericordia', description: 'Viver a fé na prática' },
    ],
  },
  {
    id: 'doutrina',
    icon: <Church className="w-7 h-7" />,
    title: 'Fundamentos da Doutrina',
    subtitle: 'O que a Igreja acredita e porquê',
    description: 'Estude os 44 dogmas da Igreja organizados por tema. Entenda as verdades de fé que sustentam dois mil anos de cristianismo.',
    difficulty: 'Intermediário',
    color: '#C9A84C',
    steps: [
      { label: 'Dogmas sobre Deus', href: '/dogmas', description: 'A Santíssima Trindade e seus atributos' },
      { label: 'Dogmas sobre Cristo', href: '/dogmas', description: 'Encarnação, Redenção, Ressurreição' },
      { label: 'Dogmas sobre Maria', href: '/dogmas', description: 'A Virgem Mãe de Deus' },
      { label: 'Dogmas sobre a Igreja', href: '/dogmas', description: 'Sacramentos e escatologia' },
    ],
  },
  {
    id: 'caridade',
    icon: <Heart className="w-7 h-7" />,
    title: 'Vida de Caridade',
    subtitle: 'A fé em ação',
    description: 'A fé sem obras é morta. Aprenda as virtudes, combata os vícios, e descubra como viver as obras de misericórdia no dia a dia.',
    difficulty: 'Iniciante',
    color: '#8B3145',
    steps: [
      { label: 'Virtudes Cardeais', href: '/virtudes-pecados', description: 'Prudência, Justiça, Fortaleza, Temperança' },
      { label: 'Virtudes Teologais', href: '/virtudes-pecados', description: 'Fé, Esperança e Caridade' },
      { label: 'Obras Corporais', href: '/obras-misericordia', description: '7 ações de caridade para o corpo' },
      { label: 'Obras Espirituais', href: '/obras-misericordia', description: '7 ações de caridade para a alma' },
    ],
  },
  {
    id: 'defesa',
    icon: <Shield className="w-7 h-7" />,
    title: 'Defesa da Fé',
    subtitle: 'Apologética católica',
    description: 'Conheça os fundamentos bíblicos e doutrinários para responder às objeções mais comuns contra a fé católica.',
    difficulty: 'Avançado',
    color: '#C9A84C',
    steps: [
      { label: 'Os 44 Dogmas', href: '/dogmas', description: 'As verdades inegociáveis da fé' },
      { label: 'Fundamentação Bíblica', href: '/sacramentos', description: 'Base escriturística dos sacramentos' },
      { label: 'Os Mandamentos', href: '/mandamentos', description: 'A lei moral e sua fundamentação' },
      { label: 'Orações e Tradição', href: '/oracoes', description: 'A tradição oral e litúrgica' },
    ],
  },
  {
    id: 'oracao',
    icon: <Flame className="w-7 h-7" />,
    title: 'Vida de Oração',
    subtitle: 'Conversar com Deus',
    description: 'Aprenda as orações essenciais da Igreja, entenda o significado de cada uma, e descubra como construir uma vida de oração.',
    difficulty: 'Iniciante',
    color: '#8B3145',
    steps: [
      { label: 'Orações Principais', href: '/oracoes', description: 'Pai Nosso, Ave Maria e mais' },
      { label: 'Profissões de Fé', href: '/oracoes', description: 'O Credo — o que professamos' },
      { label: 'Atos de Virtude', href: '/oracoes', description: 'Atos de Fé, Esperança e Caridade' },
      { label: 'O Santo Rosário', href: '/oracoes', description: 'A devoção mariana por excelência' },
    ],
  },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  'Iniciante': 'rgba(201,168,76,0.15)',
  'Intermediário': 'rgba(139,49,69,0.2)',
  'Avançado': 'rgba(201,168,76,0.25)',
}

export default function TrilhasView() {
  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      <section className="page-header relative z-10">
        <h1>Trilhas de Aprendizado</h1>
        <p className="subtitle">
          Caminhos estruturados para aprender a fé católica passo a passo. Escolha uma trilha e comece sua jornada.
        </p>
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {TRAILS.map((trail, i) => (
            <div
              key={trail.id}
              className="feature-card fade-in flex flex-col !cursor-default"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${trail.color}15`,
                    border: `1px solid ${trail.color}30`,
                    color: trail.color,
                  }}
                >
                  {trail.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg font-bold leading-tight"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {trail.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    {trail.subtitle}
                  </p>
                </div>
              </div>

              {/* Difficulty badge */}
              <span
                className="self-start text-xs px-3 py-1 rounded-full mb-4"
                style={{
                  background: DIFFICULTY_COLORS[trail.difficulty],
                  color: trail.color,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {trail.difficulty}
              </span>

              {/* Description */}
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
              >
                {trail.description}
              </p>

              {/* Steps */}
              <div className="space-y-0 mt-auto">
                {trail.steps.map((step, si) => (
                  <Link
                    key={si}
                    href={step.href}
                    className="flex items-start gap-3 py-3 group transition-colors duration-200 rounded-lg px-2 -mx-2"
                    style={{ borderTop: si === 0 ? `1px solid rgba(201,168,76,0.08)` : 'none' }}
                  >
                    {/* Step number */}
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                      style={{
                        background: `${trail.color}15`,
                        color: trail.color,
                        fontFamily: 'Cinzel, serif',
                        border: `1px solid ${trail.color}30`,
                      }}
                    >
                      {si + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium block group-hover:underline"
                        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {step.label}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {step.description}
                      </span>
                    </div>
                    <BookOpen className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: trail.color }} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
