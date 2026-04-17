import type { CommunityRole } from '@/lib/community/types'

interface RoleStyle {
  label: string
  bg: string
  border: string
  color: string
}

const ROLE_STYLES: Record<CommunityRole, RoleStyle> = {
  leigo: {
    label: 'Leigo',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    color: '#B8B0A2',
  },
  diacono: {
    label: 'Diácono',
    bg: 'rgba(201,168,76,0.08)',
    border: 'rgba(201,168,76,0.28)',
    color: '#C9A84C',
  },
  padre: {
    label: 'Padre',
    bg: 'rgba(201,168,76,0.12)',
    border: 'rgba(201,168,76,0.45)',
    color: '#E3C265',
  },
  bispo: {
    label: 'Bispo',
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(233,196,106,0.55)',
    color: '#E9C46A',
  },
  religioso: {
    label: 'Religioso',
    bg: 'rgba(160,113,188,0.10)',
    border: 'rgba(160,113,188,0.35)',
    color: '#C5A0D8',
  },
  artista: {
    label: 'Artista',
    bg: 'rgba(217,123,178,0.10)',
    border: 'rgba(217,123,178,0.35)',
    color: '#E9A0C5',
  },
  moderator: {
    label: 'Moderador',
    bg: 'rgba(102,187,106,0.10)',
    border: 'rgba(102,187,106,0.35)',
    color: '#8AD088',
  },
  admin: {
    label: 'Admin',
    bg: 'rgba(217,79,92,0.10)',
    border: 'rgba(217,79,92,0.35)',
    color: '#EB8692',
  },
}

export default function RoleBadge({
  role,
  size = 'md',
}: {
  role: CommunityRole
  size?: 'sm' | 'md'
}) {
  if (role === 'leigo') return null
  const style = ROLE_STYLES[role]
  if (!style) return null

  const pad = size === 'sm' ? '1.5px 8px' : '3px 10px'
  const fontSize = size === 'sm' ? '10px' : '11px'

  return (
    <span
      className="inline-flex items-center rounded-full uppercase tracking-[0.08em]"
      style={{
        padding: pad,
        fontSize,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 500,
      }}
    >
      {style.label}
    </span>
  )
}
