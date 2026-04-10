/**
 * Ice-breaker questions for the dashboard.
 * Provocative, real questions that Catholics (and curious non-Catholics) ask.
 * Organized by category for future filtering / personalization.
 */

export interface IceBreaker {
  question: string
  category: 'maria' | 'eucaristia' | 'apologetica' | 'sacramentos' | 'biblia' | 'moral' | 'oracao' | 'historia'
}

const ALL_ICEBREAKERS: IceBreaker[] = [
  // Maria
  { question: 'Por que rezamos para Maria?', category: 'maria' },
  { question: 'Maria é deusa para os católicos?', category: 'maria' },
  { question: 'Maria teve outros filhos?', category: 'maria' },
  { question: 'O que significa a Assunção de Maria?', category: 'maria' },

  // Eucaristia
  { question: 'O que é a Eucaristia de verdade?', category: 'eucaristia' },
  { question: 'Jesus está realmente presente na hóstia?', category: 'eucaristia' },
  { question: 'Por que a Missa é um sacrifício?', category: 'eucaristia' },

  // Apologética
  { question: 'A Bíblia fala do Purgatório?', category: 'apologetica' },
  { question: 'Por que os católicos têm imagens?', category: 'apologetica' },
  { question: 'Só a fé salva ou as obras também?', category: 'apologetica' },
  { question: 'Pedro foi mesmo o primeiro Papa?', category: 'apologetica' },
  { question: 'De onde veio a Bíblia?', category: 'apologetica' },

  // Sacramentos
  { question: 'Por que confessar para um padre?', category: 'sacramentos' },
  { question: 'Qual a diferença entre Batismo e Crisma?', category: 'sacramentos' },
  { question: 'O que é a Unção dos Enfermos?', category: 'sacramentos' },

  // Bíblia
  { question: 'Quais livros os protestantes tiraram?', category: 'biblia' },
  { question: 'O que é a Tradição Apostólica?', category: 'biblia' },
  { question: 'O que significa Sola Scriptura?', category: 'biblia' },

  // Moral
  { question: 'O que a Igreja ensina sobre o aborto?', category: 'moral' },
  { question: 'Católico pode ser cremado?', category: 'moral' },

  // Oração
  { question: 'Como rezar o Terço?', category: 'oracao' },
  { question: 'O que é a Liturgia das Horas?', category: 'oracao' },

  // História
  { question: 'A Igreja inventou a Inquisição?', category: 'historia' },
  { question: 'Por que existem tantos santos?', category: 'historia' },
]

/**
 * Returns a set of ice-breakers for the dashboard.
 * Deterministic per day — same questions all day, rotate next day.
 * @param count Number of ice-breakers to return (default 4)
 */
export function getDailyIceBreakers(count = 4): IceBreaker[] {
  const now = new Date()
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  )

  // Shuffle using the day as seed — Fisher-Yates with deterministic seed
  const shuffled = [...ALL_ICEBREAKERS]
  let seed = dayOfYear * 2654435761 // Knuth multiplicative hash

  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const j = seed % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, count)
}

/** Total number of available ice-breakers */
export const TOTAL_ICEBREAKERS = ALL_ICEBREAKERS.length
