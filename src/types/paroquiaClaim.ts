import type { ParoquiaMemberRole } from './paroquiaMember'

export type ParoquiaClaimStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado'

export interface ParoquiaClaim {
  id: string
  paroquia_id: string
  user_id: string | null
  nome_solicitante: string
  email_solicitante: string
  whatsapp: string | null
  relacao: string | null
  role_solicitada: ParoquiaMemberRole
  mensagem: string | null
  documento_path: string | null
  status: ParoquiaClaimStatus
  admin_notas: string | null
  revisado_por: string | null
  revisado_em: string | null
  created_at: string
  updated_at: string
}

export interface ParoquiaClaimWithParoquia extends ParoquiaClaim {
  paroquia: {
    id: string
    nome: string
    cidade: string
    estado: string
    foto_url: string | null
  } | null
  solicitante: {
    id: string
    name: string | null
    email: string | null
  } | null
}

export const PAROQUIA_CLAIM_STATUS_LABELS: Record<ParoquiaClaimStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
}
