export type ParoquiaMemberRole = 'admin' | 'moderator'

export interface ParoquiaMember {
  id: string
  paroquia_id: string
  user_id: string
  role: ParoquiaMemberRole
  added_by: string | null
  added_at: string
  revoked_at: string | null
  revoked_by: string | null
  revoke_reason: string | null
}

export interface ParoquiaMemberWithProfile extends ParoquiaMember {
  profile: {
    id: string
    name: string | null
    email: string | null
    profile_image_url: string | null
    public_handle: string | null
  } | null
}

export const PAROQUIA_MEMBER_ROLE_LABELS: Record<ParoquiaMemberRole, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
}
