'use client'

import { motion, type Variants } from 'framer-motion'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  CartasMockup,
  DebateMockup,
  EstudarMockup,
  GrupoMockup,
  TercoMockup,
} from './EducaMockups'

type Tone = 'dark' | 'light' | 'wine'

type Feature = {
  n: number
  tone: Tone
  reverse: boolean
  eyebrow: string
  title: string
  titleEm: string
  description: string
  bullets?: string[]
  mockup: ReactNode
}

const FEATURES: Feature[] = [
  {
    n: 1,
    tone: 'dark',
    reverse: false,
    eyebrow: 'Estudar',
    title: 'Trilhas guiadas',
    titleEm: 'pelos três pilares da fé.',
    description:
      'Bíblia, Magistério e Patrística — cada módulo tem leitura, explicação e avaliação no fim. Você anda no seu ritmo, e o app guarda o ponto onde parou.',
    bullets: [
      'Anote dentro do app: suas notas ficam atreladas a cada lição.',
      'Estude com alguém — convidem-se e acompanhem o progresso lado a lado.',
      'Avaliação ao fim de cada módulo, com XP e conquistas pra marcar o que dominou.',
    ],
    mockup: <EstudarMockup tone="dark" className="w-full h-auto" />,
  },
  {
    n: 2,
    tone: 'light',
    reverse: true,
    eyebrow: 'Terço em grupo',
    title: 'Reze o terço',
    titleEm: 'com outras pessoas ao mesmo tempo.',
    description:
      'Cada um no seu lugar, mas rezando junto. Entre numa sala por código, vejam quem está conectado e avancem mistério por mistério — o app conta as Ave-Marias e segue o ritmo do grupo.',
    mockup: <TercoMockup tone="light" className="w-full h-auto" />,
  },
  {
    n: 3,
    tone: 'wine',
    reverse: false,
    eyebrow: 'Modo debate',
    title: 'Treine apologética',
    titleEm: 'contra uma IA reformista.',
    description:
      'Sola Scriptura, sola fide, Maria, Eucaristia, papado. A IA defende a posição protestante, você responde, e ao fim recebe um placar do seu argumento — bíblico, magisterial e em caridade.',
    mockup: <DebateMockup tone="dark" className="w-full h-auto" />,
  },
  {
    n: 4,
    tone: 'light',
    reverse: true,
    eyebrow: 'Grupo de estudos',
    title: 'Estudem juntos,',
    titleEm: 'com meta e constância.',
    description:
      'Crie um grupo ou entre num que combine com você. Definam metas semanais, vejam quem está em dia, conversem sobre as lições. A disciplina compartilhada sustenta.',
    mockup: <GrupoMockup tone="light" className="w-full h-auto" />,
  },
  {
    n: 5,
    tone: 'dark',
    reverse: false,
    eyebrow: 'Colecionar conquistas',
    title: 'Cada lição',
    titleEm: 'desbloqueia uma carta.',
    description:
      'Santos, doutores, documentos da Igreja, marcos da história. Sua coleção cresce conforme você estuda e mantém sequência — um acervo visual da fé que você construiu.',
    mockup: <CartasMockup tone="dark" className="w-full h-auto" />,
  },
]

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const fadeFromSide = (fromLeft: boolean): Variants => ({
  hidden: { opacity: 0, x: fromLeft ? -40 : 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
})

/**
 * Bloco de 5 funções, alternando dark / light / wine como na landing do
 * Veritas Dei. Cada bloco tem texto de um lado e mockup SVG do outro,
 * com animação on-scroll e leve flutuação contínua no mockup.
 */
export default function Features() {
  return (
    <div id="funcoes">
      {/* Intro short */}
      <section className="surface-velvet relative py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeIn}
          >
            <span
              className="eyebrow-label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 tag-dark mb-6"
            >
              <span className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
              Cinco funções
            </span>
            <h2
              className="display-cormorant text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-5"
              style={{ color: '#F5EFE6', textWrap: 'balance' }}
            >
              Tudo que você precisa pra estudar,{' '}
              <span className="italic" style={{ color: '#E6D9B5' }}>
                num app só.
              </span>
            </h2>
            <p
              className="text-lg md:text-xl"
              style={{
                color: 'rgba(242,237,228,0.72)',
                fontFamily: 'Cormorant Garamond, serif',
                lineHeight: 1.55,
              }}
            >
              Sem aulas avulsas, sem caça a PDFs, sem dispersão. Trilha, debate,
              terço, grupo e coleção — todos conversando entre si.
            </p>
          </motion.div>
        </div>
      </section>

      {FEATURES.map(f => (
        <FeatureRow key={f.n} feature={f} />
      ))}
    </div>
  )
}

function FeatureRow({ feature }: { feature: Feature }) {
  const isDark = feature.tone !== 'light'
  const isWine = feature.tone === 'wine'
  const surfaceClass = isWine
    ? 'surface-wine'
    : feature.tone === 'dark'
      ? 'surface-velvet'
      : 'surface-parchment'

  const headingColor = isDark ? '#F5EFE6' : 'var(--ink)'
  const emColor = isDark ? '#E6D9B5' : '#5A1625'
  const bodyColor = isDark ? 'rgba(242,237,228,0.75)' : 'var(--ink-soft)'
  const ruleColor = isDark ? 'rgba(201,168,76,0.5)' : 'rgba(90,22,37,0.4)'
  const checkColor = isDark ? '#C9A84C' : '#5A1625'
  const checkBg = isDark ? 'rgba(201,168,76,0.12)' : 'rgba(90,22,37,0.08)'
  const checkBorder = isDark ? 'rgba(201,168,76,0.35)' : 'rgba(90,22,37,0.28)'

  const numberColor = isDark ? '#C9A84C' : '#5A1625'

  return (
    <section className={`${surfaceClass} relative py-20 md:py-28 overflow-hidden`}>
      <div className="relative max-w-6xl mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* ─── Coluna de texto ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeFromSide(!feature.reverse)}
          className={feature.reverse ? 'lg:order-2' : ''}
        >
          {/* Eyebrow com número */}
          <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
            <span
              className="display-cinzel text-4xl md:text-5xl leading-none"
              style={{ color: numberColor, opacity: 0.85, fontWeight: 600 }}
            >
              0{feature.n}
            </span>
            <span className="w-12 h-px" style={{ background: ruleColor }} />
            <span
              className="eyebrow-label"
              style={{ color: isDark ? '#D9C077' : '#5A1625' }}
            >
              {feature.eyebrow}
            </span>
          </div>

          <h2
            className="display-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-[52px] leading-[1.05] mb-5 text-center lg:text-left"
            style={{ color: headingColor, textWrap: 'balance' }}
          >
            {feature.title}{' '}
            <span className="italic block md:inline" style={{ color: emColor }}>
              {feature.titleEm}
            </span>
          </h2>

          <p
            className="text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
            style={{
              color: bodyColor,
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 1.55,
            }}
          >
            {feature.description}
          </p>

          {feature.bullets && (
            <ul className="space-y-3 max-w-xl mx-auto lg:mx-0">
              {feature.bullets.map(item => (
                <li
                  key={item}
                  className="flex items-start gap-3"
                  style={{
                    color: bodyColor,
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '17px',
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: checkBg, border: `1px solid ${checkBorder}` }}
                  >
                    <Check className="w-3 h-3" style={{ color: checkColor }} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* ─── Coluna do mockup ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeFromSide(feature.reverse)}
          className={`relative ${feature.reverse ? 'lg:order-1' : ''}`}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className={`relative ${isDark ? 'mockup-frame-dark' : 'mockup-frame-light'} p-3 md:p-4 max-w-md mx-auto`}
          >
            {/* Chrome dots */}
            <div className="flex items-center gap-1.5 px-2 pb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isDark ? 'rgba(201,168,76,0.35)' : 'rgba(90,22,37,0.3)' }}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isDark ? 'rgba(201,168,76,0.22)' : 'rgba(90,22,37,0.2)' }}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isDark ? 'rgba(201,168,76,0.15)' : 'rgba(90,22,37,0.15)' }}
              />
              <div className="flex-1 h-px ml-2" style={{ background: ruleColor, opacity: 0.3 }} />
            </div>

            {feature.mockup}
          </motion.div>

          {/* Glow atrás do mockup */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: isDark
                ? 'radial-gradient(60% 60% at 50% 50%, rgba(201,168,76,0.16), transparent 70%)'
                : 'radial-gradient(60% 60% at 50% 50%, rgba(90,22,37,0.12), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}
