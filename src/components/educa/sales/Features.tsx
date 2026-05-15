'use client'

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { DebateMockup, GrupoMockup, TercoMockup } from './EducaMockups'
import CartasReais from './CartasReais'
import type { Carta } from '@/types/colecao'

type Tone = 'dark' | 'light' | 'wine'

type Feature = {
  n: number
  tone: Tone
  /** Quando true, o mockup vai pra esquerda no desktop. */
  reverse: boolean
  /** Quando true, a seção usa `var(--surface-1)` plano em vez de surface-velvet,
   *  evitando vinhetas vinhas repetidas em sequência. */
  flatDark?: boolean
  eyebrow: string
  title: string
  titleEm: string
  description: string
  /** Bullets opcionais abaixo do parágrafo (concretos, sem floreio). */
  bullets?: string[]
  mockup: ReactNode
}

// Estudar (01) vive na sua própria seção full-screen. Aqui ficam só os
// outros 4 blocos — alternados de forma que NUNCA tenha duas vinhetas
// vinhas consecutivas (parchment quebra a sequência).
//
// Note: o bloco 5 (Cartas) recebe os dados reais via prop e é construído
// no componente principal, fora deste array estático.
const FEATURES: Feature[] = [
  {
    n: 2,
    tone: 'light',
    reverse: true,
    eyebrow: 'Terço em grupo',
    title: 'Reze o terço',
    titleEm: 'com outras pessoas ao mesmo tempo.',
    description:
      'Cada um no seu lugar, mas rezando junto. Entre numa sala por código, veja quem está conectado e avancem mistério por mistério — o app conta as Ave-Marias e segue o ritmo do grupo.',
    mockup: <TercoMockup tone="light" className="w-full h-auto" />,
  },
  {
    n: 3,
    tone: 'wine',
    reverse: false,
    eyebrow: 'Modo debate',
    title: 'Aprenda a defender',
    titleEm: 'sua fé sem travar.',
    description:
      'Uma IA assume o papel de um protestante e te questiona no chat — sobre a Bíblia bastar sozinha, o lugar de Maria, a Eucaristia, o papado. Você responde com calma e, ao fim, ela mostra um placar do seu argumento: o quanto foi bíblico, o quanto encostou no Magistério, e o tom de caridade.',
    bullets: [
      'Treine respondendo as perguntas que protestantes mais fazem.',
      'Não decora frase pronta — aprende a montar o argumento.',
      'Funciona pra você não engolir seco quando alguém te perguntar.',
    ],
    mockup: <DebateMockup tone="dark" className="w-full h-auto" />,
  },
  {
    n: 4,
    tone: 'light',
    reverse: true,
    eyebrow: 'Grupo de estudos',
    title: 'Estudem juntos,',
    titleEm: 'com pacto e progresso visível.',
    description:
      'Crie um grupo (ou entre num por código de convite) com amigos, família ou pessoal do grupo de oração. Toda semana, definam um pacto coletivo — meta de lições, um lema e um versículo — e cada um avança no seu próprio ritmo dentro de uma trilha curada pelo dono do grupo.',
    bullets: [
      'Pacto da semana: meta de lições + lema + versículo combinados juntos.',
      'Trilha do grupo: o dono escolhe os tópicos pra todo mundo estudar.',
      'Mural pra conversar sobre o que estudaram e tirar dúvida entre vocês.',
      'Ranking semanal e lista de quem está em dia — sustenta a disciplina.',
    ],
    mockup: <GrupoMockup tone="light" className="w-full h-auto" />,
  },
]

function cartasFeature(cartas: Carta[]): Feature {
  return {
    n: 5,
    tone: 'dark',
    reverse: false,
    flatDark: true,
    eyebrow: 'Colecionar conquistas',
    title: 'Cada lição',
    titleEm: 'desbloqueia uma carta.',
    description:
      'Santos, doutores, documentos da Igreja, marcos da história. Sua coleção cresce conforme você estuda e mantém sequência — um acervo visual da fé que você construiu.',
    mockup: <CartasReais cartas={cartas} />,
  }
}

const fadeFromSide = (fromLeft: boolean): Variants => ({
  hidden: { opacity: 0, x: fromLeft ? -40 : 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
})

/**
 * Sequência de 4 blocos com texto + mockup SVG, alternando claro/escuro/vinho
 * pra dar ritmo visual à página. O 5º (Cartas) é montado dinamicamente com
 * as cartas reais escolhidas pelo admin.
 */
export default function Features({ cartas }: { cartas: Carta[] }) {
  const blocks = [...FEATURES, cartasFeature(cartas)]
  return (
    <div id="funcoes">
      {blocks.map(f => (
        <FeatureRow key={f.n} feature={f} />
      ))}
    </div>
  )
}

function FeatureRow({ feature }: { feature: Feature }) {
  const isDark = feature.tone !== 'light'
  const isWine = feature.tone === 'wine'

  const sectionStyle =
    feature.flatDark
      ? { background: 'var(--surface-1)' }
      : undefined

  const surfaceClass = feature.flatDark
    ? 'relative'
    : isWine
      ? 'surface-wine'
      : feature.tone === 'dark'
        ? 'surface-velvet'
        : 'surface-parchment'

  const headingColor = isDark ? '#F5EFE6' : 'var(--ink)'
  const emColor = isDark ? '#E6D9B5' : '#5A1625'
  const bodyColor = isDark ? 'rgba(242,237,228,0.78)' : 'var(--ink-soft)'
  const ruleColor = isDark ? 'rgba(201,168,76,0.5)' : 'rgba(90,22,37,0.4)'
  const numberColor = isDark ? '#C9A84C' : '#5A1625'

  return (
    <section
      className={`${surfaceClass} relative py-20 md:py-28 overflow-hidden`}
      style={sectionStyle}
    >
      {/* Ambient pro flatDark — sem vinheta vinho, só um brilho dourado discreto */}
      {feature.flatDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(70% 40% at 90% 50%, rgba(201,168,76,0.10) 0%, transparent 65%)',
          }}
        />
      )}

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
            className="text-base md:text-lg mb-5 max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
            style={{
              color: bodyColor,
              fontFamily: 'var(--font-body)',
              lineHeight: 1.6,
            }}
          >
            {feature.description}
          </p>

          {feature.bullets && feature.bullets.length > 0 && (
            <ul className="flex flex-col gap-2.5 max-w-xl mx-auto lg:mx-0">
              {feature.bullets.map(item => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm md:text-[15px]"
                  style={{
                    color: bodyColor,
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{
                      background: isDark
                        ? 'rgba(201,168,76,0.12)'
                        : 'rgba(90,22,37,0.08)',
                      border: `1px solid ${
                        isDark ? 'rgba(201,168,76,0.35)' : 'rgba(90,22,37,0.28)'
                      }`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: isDark ? '#C9A84C' : '#5A1625',
                      }}
                    />
                  </span>
                  {item}
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
