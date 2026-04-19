import type { LevelTier } from '@/types/gamification'

/**
 * Faixas visuais do nível. Apenas cor e glow — sem nome/título.
 * A moldura do avatar e o badge usam essas cores pra progredirem visualmente.
 */
export const LEVEL_TIERS: readonly LevelTier[] = [
  { minLevel: 1,   maxLevel: 10,  color: '#8B7355', glow: 'rgba(139,115,85,0.35)' },       // bronze
  { minLevel: 11,  maxLevel: 30,  color: '#B8A488', glow: 'rgba(184,164,136,0.35)' },      // prata opaca
  { minLevel: 31,  maxLevel: 60,  color: '#C9A84C', glow: 'rgba(201,168,76,0.45)' },       // ouro
  { minLevel: 61,  maxLevel: 100, color: '#D9C077', glow: 'rgba(217,192,119,0.5)' },       // ouro claro
  { minLevel: 101, maxLevel: Number.POSITIVE_INFINITY, color: '#F2EDE4', glow: 'rgba(242,237,228,0.6)' }, // luz
] as const

export function tierForLevel(level: number): LevelTier {
  const n = Math.max(1, Math.floor(level || 1))
  return LEVEL_TIERS.find(t => n >= t.minLevel && n <= t.maxLevel) ?? LEVEL_TIERS[0]
}
