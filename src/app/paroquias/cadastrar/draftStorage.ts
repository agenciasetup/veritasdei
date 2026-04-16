import type { ParoquiaFormState } from './types'

/**
 * Persistência de rascunho do cadastro de paróquia em localStorage,
 * por usuário (`paroquia-draft-{userId}`). Inclui timestamp para mostrar
 * "última edição" no prompt de continuar.
 *
 * Não persiste o arquivo de verificação (não dá pra serializar).
 */

const KEY_PREFIX = 'paroquia-draft-'

interface DraftEnvelope {
  state: ParoquiaFormState
  step: number
  updatedAt: number
}

function key(userId: string) {
  return `${KEY_PREFIX}${userId}`
}

export function loadDraft(userId: string): DraftEnvelope | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftEnvelope
    if (
      typeof parsed !== 'object' ||
      typeof parsed.state !== 'object' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveDraft(
  userId: string,
  state: ParoquiaFormState,
  step: number,
): void {
  if (typeof window === 'undefined') return
  try {
    const env: DraftEnvelope = { state, step, updatedAt: Date.now() }
    window.localStorage.setItem(key(userId), JSON.stringify(env))
  } catch {
    // ignore quota / private mode
  }
}

export function clearDraft(userId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key(userId))
  } catch {}
}
