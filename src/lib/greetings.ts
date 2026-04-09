import type { Vocacao } from '@/types/auth'

/** Returns a personalized greeting based on vocação */
export function getGreeting(vocacao: Vocacao | undefined, name: string | null): string {
  const firstName = name?.split(' ')[0] ?? ''

  switch (vocacao) {
    case 'padre':
      return `Dominus vobiscum, Pe. ${firstName}!`
    case 'bispo':
      return `Ad multos annos, Dom ${firstName}!`
    case 'cardeal':
      return `Pax Christi, Cardeal ${firstName}!`
    case 'papa':
      return `Habemus Papam! ${firstName}`
    case 'diacono':
      return `A paz do Senhor, Diac. ${firstName}!`
    case 'catequista':
      return `Salve Maria, Catequista ${firstName}!`
    case 'leigo':
    default:
      return `A paz de Cristo, ${firstName}!`
  }
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
