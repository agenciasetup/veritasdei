/**
 * Id → Prayer lookup, built from the canonical prayer exports.
 * Keep in sync with `prayers.ts` and `beadSequence.ts`'s `PRAYER_IDS`.
 */
import type { Prayer } from './types'
import {
  SINAL_DA_CRUZ,
  CREDO,
  PAI_NOSSO,
  AVE_MARIA,
  GLORIA,
  ORACAO_FATIMA,
  SALVE_RAINHA,
  ORACAO_FINAL,
} from './prayers'

export const PRAYERS_BY_ID: Readonly<Record<string, Prayer>> = Object.freeze({
  [SINAL_DA_CRUZ.id]: SINAL_DA_CRUZ,
  [CREDO.id]: CREDO,
  [PAI_NOSSO.id]: PAI_NOSSO,
  [AVE_MARIA.id]: AVE_MARIA,
  [GLORIA.id]: GLORIA,
  [ORACAO_FATIMA.id]: ORACAO_FATIMA,
  [SALVE_RAINHA.id]: SALVE_RAINHA,
  [ORACAO_FINAL.id]: ORACAO_FINAL,
})

export function getPrayerById(id: string | null | undefined): Prayer | null {
  if (!id) return null
  return PRAYERS_BY_ID[id] ?? null
}
