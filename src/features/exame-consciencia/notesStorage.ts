/**
 * Notas privadas do exame de consciência.
 *
 * Regras:
 * - Apenas localStorage. Nunca syncado com servidor — conteúdo é íntimo.
 * - Auto-limpeza após 30 dias da última escrita (privacidade).
 * - 1 nota por mandamento (id 1..10).
 */

const KEY = 'veritasdei_exame_notas'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export interface ExameNotes {
  byCommandment: Record<number, string>
  updatedAt: number
}

function emptyNotes(): ExameNotes {
  return { byCommandment: {}, updatedAt: 0 }
}

export function loadNotes(): ExameNotes {
  if (typeof window === 'undefined') return emptyNotes()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyNotes()
    const parsed = JSON.parse(raw) as ExameNotes
    if (
      typeof parsed !== 'object' ||
      typeof parsed.updatedAt !== 'number' ||
      typeof parsed.byCommandment !== 'object'
    ) {
      return emptyNotes()
    }
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY)
      return emptyNotes()
    }
    return parsed
  } catch {
    return emptyNotes()
  }
}

export function saveNoteFor(commandmentId: number, text: string): ExameNotes {
  const next = loadNotes()
  if (text.trim() === '') {
    delete next.byCommandment[commandmentId]
  } else {
    next.byCommandment[commandmentId] = text
  }
  next.updatedAt = Date.now()
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }
  return next
}

export function clearAllNotes(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
}
