/**
 * Persistência leve da sessão de terço no `localStorage`.
 *
 * Guardamos apenas o mínimo: conjunto de mistérios, passo atual, flag de
 * concluído e instante da última atualização. O próprio schema é versionado
 * (`v`) para que mudanças futuras não quebrem sessões antigas — payloads com
 * versão diferente são silenciosamente descartados.
 *
 * TTL de 24 h: se o usuário volta no dia seguinte, começamos a sessão do zero
 * (novo dia geralmente significa novos mistérios).
 *
 * Módulo puro: não depende de React nem de `window` no topo — os helpers
 * retornam `null` sob SSR ou quando o storage está indisponível.
 */

import { ROSARY_STEPS } from '@/features/rosario/data/beadSequence'
import type { MysterySet } from '@/features/rosario/data/types'

export const STORAGE_KEY = 'veritasdei:rosario:session:v1'
export const SCHEMA_VERSION = 1 as const
export const TTL_MS = 24 * 60 * 60 * 1000 // 24 h

const VALID_MYSTERY_SETS: readonly MysterySet[] = [
  'gozosos',
  'luminosos',
  'dolorosos',
  'gloriosos',
]

const MAX_STEP_INDEX = ROSARY_STEPS.length - 1

export interface RosarySessionSnapshot {
  /** Conjunto de mistérios em curso. */
  mysterySetId: MysterySet
  /** Índice 0-based em `ROSARY_STEPS`. */
  currentIndex: number
  /** Marca true quando o terço foi concluído. */
  isCompleted: boolean
  /** Timestamp em ms (Date.now()) — usado para aplicar TTL. */
  savedAt: number
}

interface StoredPayload extends RosarySessionSnapshot {
  v: typeof SCHEMA_VERSION
}

/**
 * Retorna `true` somente quando `window.localStorage` é acessível.
 * O acesso está dentro de um try/catch porque alguns contextos (iframes com
 * storage bloqueado, modo privado antigo do Safari, políticas estritas de
 * privacidade) lançam `SecurityError` no simples `window.localStorage`.
 */
function isBrowser(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** Valida um objeto desconhecido e retorna um snapshot ou `null`. */
export function parseSessionPayload(
  raw: unknown,
  now: number = Date.now(),
): RosarySessionSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  if (obj.v !== SCHEMA_VERSION) return null

  const { mysterySetId, currentIndex, isCompleted, savedAt } = obj

  if (typeof mysterySetId !== 'string') return null
  if (!VALID_MYSTERY_SETS.includes(mysterySetId as MysterySet)) return null

  if (typeof currentIndex !== 'number' || !Number.isFinite(currentIndex)) return null
  if (currentIndex < 0 || currentIndex > MAX_STEP_INDEX) return null
  if (!Number.isInteger(currentIndex)) return null

  if (typeof isCompleted !== 'boolean') return null

  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) return null
  if (now - savedAt > TTL_MS) return null
  // Rejeita timestamps no futuro (clock skew suspeito).
  if (savedAt - now > 60_000) return null

  return {
    mysterySetId: mysterySetId as MysterySet,
    currentIndex,
    isCompleted,
    savedAt,
  }
}

/** Lê e valida a sessão salva. Retorna `null` se ausente, expirada ou inválida. */
export function loadSession(now: number = Date.now()): RosarySessionSnapshot | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const snap = parseSessionPayload(parsed, now)
    if (!snap) {
      // Payload corrompido ou expirado — limpa pra evitar ruído.
      window.localStorage.removeItem(STORAGE_KEY)
    }
    return snap
  } catch {
    return null
  }
}

/** Serializa o snapshot. Útil para testes e para `saveSession` reutilizar. */
export function serializeSessionPayload(snapshot: RosarySessionSnapshot): string {
  const payload: StoredPayload = { v: SCHEMA_VERSION, ...snapshot }
  return JSON.stringify(payload)
}

/** Salva (ou sobrescreve) a sessão atual no storage. */
export function saveSession(
  snapshot: Omit<RosarySessionSnapshot, 'savedAt'>,
  now: number = Date.now(),
): void {
  if (!isBrowser()) return
  try {
    const payload = serializeSessionPayload({ ...snapshot, savedAt: now })
    window.localStorage.setItem(STORAGE_KEY, payload)
  } catch {
    // Ignora erros (quota excedida, modo privado, etc.) — persistência é best-effort.
  }
}

/** Remove a sessão salva. Chamado no reset/descartar/concluído. */
export function clearSession(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
