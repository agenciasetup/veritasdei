import type { Vocacao } from '@/types/auth'

/* ─── Time-of-day helpers ─── */

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

export function getTimeLabel(time: TimeOfDay): string {
  switch (time) {
    case 'morning':   return 'Bom dia'
    case 'afternoon': return 'Boa tarde'
    case 'evening':   return 'Boa noite'
    case 'night':     return 'Boa noite'
  }
}

/* ─── Greeting with vocation-aware prefix ─── */

function getVocacaoGreeting(vocacao: Vocacao | undefined, firstName: string): string {
  switch (vocacao) {
    case 'padre':
      return `Pe. ${firstName}`
    case 'bispo':
      return `Dom ${firstName}`
    case 'cardeal':
      return `Cardeal ${firstName}`
    case 'papa':
      return firstName
    case 'diacono':
      return `Diac. ${firstName}`
    case 'catequista':
      return `Catequista ${firstName}`
    case 'leigo':
    default:
      return firstName
  }
}

/** Phrases that vary — picked deterministically based on day of year */
const GREETING_PHRASES: Record<Vocacao | 'default', string[]> = {
  padre: [
    'Dominus vobiscum,',
    'A paz do Senhor,',
    'Pax Christi,',
    'Deus te abençoe,',
  ],
  bispo: [
    'Ad multos annos,',
    'A paz do Senhor,',
    'Pax et bonum,',
    'Deus lhe guarde,',
  ],
  cardeal: [
    'Pax Christi,',
    'A paz do Senhor,',
    'Deus lhe abençoe,',
  ],
  papa: [
    'Habemus Papam!',
    'A paz de Cristo,',
  ],
  diacono: [
    'A paz do Senhor,',
    'Deus te abençoe,',
    'Pax et bonum,',
  ],
  catequista: [
    'Salve Maria,',
    'A paz de Cristo,',
    'Deus te abençoe,',
  ],
  leigo: [
    'A paz de Cristo,',
    'Salve Maria,',
    'Deus te abençoe,',
    'A paz do Senhor,',
    'Pax et bonum,',
  ],
  default: [
    'A paz de Cristo,',
    'Deus te abençoe,',
    'A paz do Senhor,',
  ],
}

/** Subtitle phrases that rotate below the greeting */
export const SUBTITLE_PHRASES = [
  'Qual sua dúvida hoje?',
  'O que procura hoje?',
  'Em que posso ajudar?',
  'O que deseja aprender?',
  'Sobre o que quer saber?',
  'O que o Espírito pôs no seu coração?',
]

/** Pick a phrase deterministically based on the day of year */
function pickByDay<T>(arr: T[]): T {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return arr[dayOfYear % arr.length]
}

/** Returns a personalized greeting based on vocação (varies daily) */
export function getGreeting(vocacao: Vocacao | undefined, name: string | null): string {
  const firstName = name?.split(' ')[0] ?? ''
  const phrases = GREETING_PHRASES[vocacao ?? 'default'] ?? GREETING_PHRASES.default
  const phrase = pickByDay(phrases)
  const displayName = getVocacaoGreeting(vocacao, firstName)
  return `${phrase} ${displayName}!`
}

/** Returns just the greeting phrase (without name) */
export function getGreetingPhrase(vocacao: Vocacao | undefined): string {
  const phrases = GREETING_PHRASES[vocacao ?? 'default'] ?? GREETING_PHRASES.default
  return pickByDay(phrases)
}

/** Returns a rotating subtitle */
export function getSubtitlePhrase(): string {
  return pickByDay(SUBTITLE_PHRASES)
}

/** Returns a short title prefix based on vocação */
export function getVocacaoPrefix(vocacao: Vocacao | undefined): string {
  switch (vocacao) {
    case 'padre': return 'Pe.'
    case 'bispo': return 'Dom'
    case 'cardeal': return 'Card.'
    case 'diacono': return 'Diac.'
    case 'catequista': return 'Cat.'
    default: return ''
  }
}

/** Returns a display name with vocação prefix */
export function getDisplayName(vocacao: Vocacao | undefined, name: string | null): string {
  const prefix = getVocacaoPrefix(vocacao)
  const firstName = name?.split(' ')[0] ?? ''
  return prefix ? `${prefix} ${firstName}` : firstName
}
