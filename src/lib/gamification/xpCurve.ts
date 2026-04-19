/**
 * Curva de XP. MVP: linear 100 XP por nível (mantém compat com progresso
 * já existente). Futuro: trocar por curva progressiva sem quebrar o hook.
 */

export const XP_PER_SUBTOPIC = 10
export const XP_PER_LEVEL = 100

export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1
}

export function xpInLevel(totalXp: number): number {
  return Math.max(0, totalXp) % XP_PER_LEVEL
}

export function xpToNextLevel(totalXp: number): number {
  return XP_PER_LEVEL - xpInLevel(totalXp)
}

export function percentInLevel(totalXp: number): number {
  return Math.round((xpInLevel(totalXp) / XP_PER_LEVEL) * 100)
}
