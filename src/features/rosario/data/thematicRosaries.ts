/**
 * Terços temáticos.
 *
 * Cada terço temático usa a estrutura padrão do rosário (5 dezenas com
 * Pai Nosso + 10 Ave Marias + Glória entre cada mistério), mas substitui
 * os 5 mistérios meditativos por um conjunto temático: vida de um santo,
 * dogmas marianos, etc.
 *
 * As orações em si (Sinal da Cruz, Pai Nosso, Ave Maria, Glória, Salve
 * Rainha, Oração de Fátima) permanecem as mesmas — herdadas de
 * `data/prayers.ts`. Apenas o `MysteryGroup` é trocado.
 *
 * Unlock:
 *   - 'free'         — disponível pra todos.
 *   - 'coming_soon'  — visível no catálogo mas não rezável (conteúdo wip).
 *   - 'requires_study:<topic>' — destrava ao concluir o tópico de estudo
 *     correspondente. Por enquanto a verificação é estática (returnsfalse
 *     until trilhas progress is wired up).
 *
 * Adicionar um novo terço temático:
 *   1. Criar o objeto `ThematicRosary` com 5 mistérios.
 *   2. Importar em `THEMATIC_ROSARIES`.
 *   3. (Opcional) Definir critério de unlock em `evaluateThematicUnlock`.
 */

import type { Mystery, MysteryGroup } from './types'

export type ThematicCategory = 'devocional' | 'doutrina' | 'santo'

export type ThematicUnlockKind =
  | { kind: 'free' }
  | { kind: 'coming_soon'; etaLabel?: string }
  | { kind: 'requires_study'; studyTopic: string; label: string }

export interface ThematicRosary {
  /** ID único, usado em URLs e como identificador de runtime. */
  slug: string
  /** Nome curto exibido nos cards. */
  name: string
  /** Subtítulo / categoria humana ("Vida de um santo"). */
  subtitle: string
  /** Descrição em 1-2 frases. */
  description: string
  /** Verso/citação curta apresentada no card como "epígrafe". */
  epigraph?: string
  category: ThematicCategory
  /** Emoji ou símbolo de capa — usado em cards minimalistas. */
  glyph: string
  /** Critério pra ficar disponível pro usuário. */
  unlock: ThematicUnlockKind
  /** Os 5 mistérios meditativos deste terço temático. */
  mysteries: Mystery[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Terço de São Bento — Vida do Patriarca dos Monges (free)
// ─────────────────────────────────────────────────────────────────────────────

const SAO_BENTO: ThematicRosary = {
  slug: 'sao-bento',
  name: 'Terço de São Bento',
  subtitle: 'Vida do Patriarca dos Monges',
  description:
    'Medite a vida de São Bento de Núrsia (480–547), pai do monaquismo ocidental, intercessor poderoso contra o mal. Reze junto à Cruz de São Bento.',
  epigraph: '"Crux sancti patris Benedicti — Eius in obitu nostro praesentia muniamur."',
  category: 'santo',
  glyph: '✝',
  unlock: { kind: 'free' },
  mysteries: [
    {
      number: 1,
      title: 'A Conversão na Solidão de Subiaco',
      fruit: 'Desapego do mundo',
      scripture: 'Sl 62,2',
      reflection:
        'Bento abandona Roma e seus estudos para buscar a Deus no deserto de Subiaco. Por três anos vive numa gruta, alimentado por Romano. No silêncio aprende a escutar o Senhor: "Só em Deus repousa a minha alma."',
    },
    {
      number: 2,
      title: 'A Vitória sobre a Tentação da Carne',
      fruit: 'Pureza',
      scripture: 'Tg 1,12',
      reflection:
        'Atacado por lembranças impuras, Bento se lança nu sobre um espinheiro até purificar o corpo pela dor. Daquele dia em diante jamais sentiu tal tentação. Ensina: "Feliz o homem que suporta a provação."',
    },
    {
      number: 3,
      title: 'A Cruz e o Veneno Quebrado',
      fruit: 'Confiança em Deus contra o mal',
      scripture: 'Sl 91,13',
      reflection:
        'Monges descontentes oferecem a Bento um cálice envenenado. Ele faz o sinal da cruz sobre ele — o cálice se quebra em pedaços. "Pisarás o leão e a víbora; calcarás o filhote do leão e o dragão."',
    },
    {
      number: 4,
      title: 'A Fundação de Monte Cassino e a Regra',
      fruit: 'Obediência e estabilidade',
      scripture: 'Mt 11,29',
      reflection:
        'No alto do Monte Cassino, Bento funda o mosteiro-mãe e escreve a Regra: ora et labora — reza e trabalha. "Aprendei de mim, que sou manso e humilde de coração."',
    },
    {
      number: 5,
      title: 'A Morte de Pé, de Braços Abertos',
      fruit: 'Perseverança final',
      scripture: '2Tm 4,7',
      reflection:
        'No dia da morte, Bento pede que o levem ao oratório. De pé, sustentado pelos irmãos, com as mãos erguidas, entrega a alma a Deus. "Combati o bom combate, terminei a corrida, guardei a fé."',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Dogmas Marianos — Meditação dos 4 dogmas + Maria Mãe da Igreja
// Destrava ao completar a trilha de Mariologia.
// ─────────────────────────────────────────────────────────────────────────────

const DOGMAS_MARIANOS: ThematicRosary = {
  slug: 'dogmas-marianos',
  name: 'Terço dos Dogmas Marianos',
  subtitle: 'Os quatro dogmas + Maria Mãe da Igreja',
  description:
    'Medite os quatro dogmas marianos definidos pela Igreja — Maternidade Divina (431), Virgindade Perpétua (649), Imaculada Conceição (1854) e Assunção (1950) — culminando em Maria Mãe da Igreja.',
  epigraph: '"Magnificat anima mea Dominum, et exsultavit spiritus meus in Deo salutari meo." (Lc 1, 46-47)',
  category: 'doutrina',
  glyph: '☧',
  unlock: { kind: 'requires_study', studyTopic: 'mariologia', label: 'Conclua o estudo de Mariologia' },
  mysteries: [
    {
      number: 1,
      title: 'Maternidade Divina — Theotókos',
      fruit: 'Veneração à Mãe de Deus',
      scripture: 'Lc 1,43',
      reflection:
        'No Concílio de Éfeso (431), a Igreja proclama: Maria é verdadeiramente Mãe de Deus, não apenas de Cristo homem. Em seu ventre se uniram divindade e humanidade. Isabel exclama: "De onde me vem esta honra de vir a mim a Mãe de meu Senhor?"',
    },
    {
      number: 2,
      title: 'Virgindade Perpétua — Sempre Virgem',
      fruit: 'Pureza de coração',
      scripture: 'Lc 1,34',
      reflection:
        'Maria é Virgem antes, durante e depois do parto — definição do Concílio de Latrão (649). Sua virgindade é fecunda pelo Espírito Santo, sinal de total entrega a Deus. "Como se fará isso, se eu não conheço varão?"',
    },
    {
      number: 3,
      title: 'Imaculada Conceição',
      fruit: 'Horror ao pecado',
      scripture: 'Lc 1,28',
      reflection:
        'Pelo Pio IX (1854): Maria foi preservada do pecado original desde o primeiro instante de sua concepção, por uma graça singular de Deus em vista dos méritos de Cristo. O anjo a saúda: "Salve, cheia de graça."',
    },
    {
      number: 4,
      title: 'Assunção aos Céus',
      fruit: 'Esperança da ressurreição',
      scripture: 'Ap 12,1',
      reflection:
        'Pelo Pio XII (1950): Maria, terminado o curso da vida terrena, foi assunta em corpo e alma à glória celeste. É a primícia dos que ressuscitarão em Cristo. "Apareceu no céu um grande sinal: uma mulher vestida de sol."',
    },
    {
      number: 5,
      title: 'Maria Mãe da Igreja',
      fruit: 'Filiação mariana',
      scripture: 'Jo 19,27',
      reflection:
        'Aos pés da cruz, Jesus entrega Maria como Mãe a todo discípulo: "Eis aí tua mãe." Paulo VI proclama Maria Mater Ecclesiae em 1964. Ela continua a interceder por nós até a consumação dos séculos.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Padre Pio — placeholder coming soon (conteúdo a desenvolver)
// ─────────────────────────────────────────────────────────────────────────────

const PADRE_PIO: ThematicRosary = {
  slug: 'padre-pio',
  name: 'Terço de Padre Pio',
  subtitle: 'Vida do estigmatizado de Pietrelcina',
  description:
    'Medite a vida e os carismas do São Padre Pio (1887–1968), confessor incansável e portador dos estigmas. Em breve.',
  epigraph: '"Reza, espera e não te aflijas." — Pe. Pio',
  category: 'santo',
  glyph: '✠',
  unlock: { kind: 'coming_soon', etaLabel: 'Em breve' },
  // Placeholder mysteries — não rezável (locked). Mantido pra type-safety.
  mysteries: [
    {
      number: 1,
      title: 'A Vocação Capuchinha',
      fruit: 'Generosidade vocacional',
      scripture: 'Lc 5,11',
      reflection: 'Em desenvolvimento.',
    },
    {
      number: 2,
      title: 'Os Estigmas',
      fruit: 'Reparação',
      scripture: 'Gl 6,17',
      reflection: 'Em desenvolvimento.',
    },
    {
      number: 3,
      title: 'O Confessionário',
      fruit: 'Misericórdia',
      scripture: 'Jo 20,23',
      reflection: 'Em desenvolvimento.',
    },
    {
      number: 4,
      title: 'A Casa Alívio do Sofrimento',
      fruit: 'Caridade com os doentes',
      scripture: 'Mt 25,40',
      reflection: 'Em desenvolvimento.',
    },
    {
      number: 5,
      title: 'A Páscoa Eterna',
      fruit: 'Perseverança',
      scripture: 'Fl 1,21',
      reflection: 'Em desenvolvimento.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Misericórdia — placeholder coming soon
// (A Coroa da Divina Misericórdia tem estrutura diferente — não 5 dezenas.
// Seria implementação separada da engine. Listado pra teaser.)
// ─────────────────────────────────────────────────────────────────────────────

const MISERICORDIA: ThematicRosary = {
  slug: 'misericordia',
  name: 'Terço da Divina Misericórdia',
  subtitle: 'Conforme a revelação a Santa Faustina',
  description:
    'A Coroa da Misericórdia, rezada nas contas do terço comum. Em breve, com tipo de sessão adaptado.',
  category: 'devocional',
  glyph: '☩',
  unlock: { kind: 'coming_soon', etaLabel: 'Em desenvolvimento' },
  mysteries: [
    { number: 1, title: 'A Eterna Misericórdia do Pai', fruit: 'Confiança', scripture: 'Sl 136', reflection: 'Em desenvolvimento.' },
    { number: 2, title: 'A Paixão de Jesus', fruit: 'Gratidão', scripture: 'Is 53', reflection: 'Em desenvolvimento.' },
    { number: 3, title: 'A Ressurreição', fruit: 'Esperança', scripture: '1Cor 15', reflection: 'Em desenvolvimento.' },
    { number: 4, title: 'A Igreja como sinal de Misericórdia', fruit: 'Compromisso', scripture: 'Mt 5,7', reflection: 'Em desenvolvimento.' },
    { number: 5, title: 'A Eternidade', fruit: 'Adoração', scripture: 'Ap 7,9-17', reflection: 'Em desenvolvimento.' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Registro principal
// ─────────────────────────────────────────────────────────────────────────────

export const THEMATIC_ROSARIES: readonly ThematicRosary[] = Object.freeze([
  SAO_BENTO,
  DOGMAS_MARIANOS,
  PADRE_PIO,
  MISERICORDIA,
])

export function findThematicRosaryBySlug(slug: string): ThematicRosary | null {
  return THEMATIC_ROSARIES.find((r) => r.slug === slug) ?? null
}

/**
 * Avalia se um terço temático está disponível pro usuário.
 *
 * `completedStudyTopics`: lista de IDs de tópicos/trilhas concluídos.
 * Quando o sistema de tracking estiver wired-up, passe ele aqui.
 * Por padrão (lista vazia), bloqueia os que exigem estudo.
 */
export function evaluateThematicUnlock(
  rosary: ThematicRosary,
  completedStudyTopics: readonly string[] = [],
): { available: boolean; reason?: string } {
  switch (rosary.unlock.kind) {
    case 'free':
      return { available: true }
    case 'coming_soon':
      return { available: false, reason: rosary.unlock.etaLabel ?? 'Em breve' }
    case 'requires_study':
      if (completedStudyTopics.includes(rosary.unlock.studyTopic)) {
        return { available: true }
      }
      return { available: false, reason: rosary.unlock.label }
  }
}

/**
 * Converte um `ThematicRosary` em um `MysteryGroup` compatível com a
 * sessão. Mantém o id como string (slug) — o solo engine não persiste
 * mystery_set no DB com restrição enum, então isto é seguro.
 */
export function thematicToMysteryGroup(
  rosary: ThematicRosary,
): MysteryGroup {
  return {
    // O cast aqui é seguro porque o MysteryGroup nunca é passado pra
    // INSERT no banco com este id — solo session.
    id: rosary.slug as MysteryGroup['id'],
    name: rosary.name,
    days: rosary.subtitle,
    mysteries: rosary.mysteries,
  }
}
