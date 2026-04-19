export type ReliquiaCategory = 'estudo' | 'oracao' | 'streak' | 'comunidade' | 'liturgia'
export type ReliquiaRarity = 'comum' | 'rara' | 'epica' | 'lendaria'
export type ReliquiaUnlockType = 'level' | 'pillar_complete' | 'streak' | 'achievement_count' | 'custom'

export interface Reliquia {
  id: string
  slug: string
  name: string
  description: string
  lore: string | null
  image_url: string | null
  category: ReliquiaCategory
  rarity: ReliquiaRarity
  unlock_type: ReliquiaUnlockType
  unlock_value: number | null
  unlock_ref: string | null
  sort_order: number
}

export interface UserGamification {
  user_id: string
  total_xp: number
  current_level: number
  equipped_reliquia_id: string | null
  current_streak: number
  longest_streak: number
  last_study_at: string | null
  updated_at: string
}

export interface UserReliquia {
  user_id: string
  reliquia_id: string
  unlocked_at: string
  seen: boolean
}

export type MissionType = 'study_subtopic' | 'pray_rosary' | 'read_liturgy' | 'review_pillar'

export interface DailyMission {
  user_id: string
  mission_date: string
  mission_type: MissionType
  target: number
  progress: number
  xp_reward: number
  completed: boolean
  claimed: boolean
}

/** Faixa visual do nível (só cor/glow — sem nome). */
export interface LevelTier {
  minLevel: number
  maxLevel: number
  color: string
  glow: string
}

export const RARITY_META: Record<ReliquiaRarity, { label: string; color: string; border: string; bg: string }> = {
  comum: {
    label: 'Comum',
    color: '#B8AFA7',
    border: 'rgba(184,175,167,0.35)',
    bg: 'rgba(184,175,167,0.08)',
  },
  rara: {
    label: 'Rara',
    color: '#C9A84C',
    border: 'rgba(201,168,76,0.45)',
    bg: 'rgba(201,168,76,0.1)',
  },
  epica: {
    label: 'Épica',
    color: '#A78BFA',
    border: 'rgba(167,139,250,0.45)',
    bg: 'rgba(167,139,250,0.1)',
  },
  lendaria: {
    label: 'Lendária',
    color: '#F2EDE4',
    border: 'rgba(242,237,228,0.5)',
    bg: 'rgba(242,237,228,0.08)',
  },
}

export const CATEGORY_META: Record<ReliquiaCategory, { label: string }> = {
  estudo: { label: 'Estudo' },
  oracao: { label: 'Oração' },
  streak: { label: 'Devoção' },
  comunidade: { label: 'Comunidade' },
  liturgia: { label: 'Liturgia' },
}
