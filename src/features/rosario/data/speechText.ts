import type { RosaryStep } from './beadSequence'
import type { MysteryGroup } from './types'
import type { RosaryLanguage } from './theme'
import { getPrayerById } from './prayerMap'

/**
 * Deriva o texto que deve ser lido em voz alta para um dado passo do terço.
 *
 * Mantém a mesma lógica que o `PrayerStage` usa para renderizar visualmente:
 *   - `mystery_announce` fala o título + reflexão do mistério ativo
 *   - Demais passos falam o `prayer.text` associado via `prayerId`
 *   - Se nada disso se aplicar, retorna `null` (nada a falar)
 *
 * Quando `language === 'la'`, usa os campos latinos quando disponíveis,
 * com fallback para o português (caso o conteúdo em latim não exista).
 */
export function getSpeechText(
  step: RosaryStep,
  mysteryGroup: MysteryGroup,
  language: RosaryLanguage = 'pt',
): string | null {
  if (step.type === 'mystery_announce' && step.decade !== undefined) {
    const mystery = mysteryGroup.mysteries[step.decade - 1]
    if (!mystery) return null
    if (language === 'la') {
      const title = mystery.latinTitle ?? mystery.title
      const reflection = mystery.latinReflection ?? mystery.reflection
      return `${title}. ${reflection}`
    }
    return `${mystery.title}. ${mystery.reflection}`
  }

  const prayer = getPrayerById(step.prayerId)
  if (!prayer) return null
  if (language === 'la' && prayer.latinText) return prayer.latinText
  return prayer.text
}
