import type { RosaryStep } from './beadSequence'
import type { MysteryGroup } from './types'
import { getPrayerById } from './prayerMap'

/**
 * Deriva o texto que deve ser lido em voz alta para um dado passo do terço.
 *
 * Mantém a mesma lógica que o `PrayerStage` usa para renderizar visualmente:
 *   - `mystery_announce` fala o título + reflexão do mistério ativo
 *   - Demais passos falam o `prayer.text` associado via `prayerId`
 *   - Se nada disso se aplicar, retorna `null` (nada a falar)
 */
export function getSpeechText(
  step: RosaryStep,
  mysteryGroup: MysteryGroup,
): string | null {
  if (step.type === 'mystery_announce' && step.decade !== undefined) {
    const mystery = mysteryGroup.mysteries[step.decade - 1]
    if (!mystery) return null
    return `${mystery.title}. ${mystery.reflection}`
  }

  const prayer = getPrayerById(step.prayerId)
  if (!prayer) return null
  return prayer.text
}
