// ═══════════════════════════════════════════════════════
// VERITAS DEI — Auth & Profile Types
// ═══════════════════════════════════════════════════════

export type UserRole = 'user' | 'admin'
export type AccountStatus = 'active' | 'pending_verification' | 'suspended'
export type PlanKey = 'free' | 'estudos'

export type Vocacao =
  | 'leigo'
  | 'diacono'
  | 'padre'
  | 'bispo'
  | 'cardeal'
  | 'papa'
  | 'catequista'

export type Sacramento =
  | 'batismo'
  | 'eucaristia'
  | 'crisma'
  | 'reconciliacao'
  | 'uncao_dos_enfermos'
  | 'ordem'
  | 'matrimonio'

export const VOCACOES: { value: Vocacao; label: string }[] = [
  { value: 'leigo', label: 'Leigo(a)' },
  { value: 'catequista', label: 'Catequista' },
  { value: 'diacono', label: 'Diácono' },
  { value: 'padre', label: 'Padre' },
  { value: 'bispo', label: 'Bispo' },
  { value: 'cardeal', label: 'Cardeal' },
  { value: 'papa', label: 'Papa' },
]

export const SACRAMENTOS: { value: Sacramento; label: string }[] = [
  { value: 'batismo', label: 'Batismo' },
  { value: 'eucaristia', label: 'Eucaristia' },
  { value: 'crisma', label: 'Crisma (Confirmação)' },
  { value: 'reconciliacao', label: 'Reconciliação (Confissão)' },
  { value: 'uncao_dos_enfermos', label: 'Unção dos Enfermos' },
  { value: 'ordem', label: 'Ordem' },
  { value: 'matrimonio', label: 'Matrimônio' },
]

export interface Profile {
  id: string
  user_number: number | null
  name: string | null
  email: string
  cpf: string | null
  role: UserRole
  status: AccountStatus
  plan: PlanKey
  vocacao: Vocacao
  verified: boolean
  has_password_set: boolean
  onboarding_completed: boolean
  falecido: boolean

  // Pessoal
  profile_image_url: string | null
  instagram: string | null
  whatsapp: string | null
  data_nascimento: string | null
  genero: 'masculino' | 'feminino' | null

  // Endereço
  endereco: string | null
  cidade: string | null
  estado: string | null
  pais: string | null
  cep: string | null

  // Vida Católica
  paroquia: string | null
  diocese: string | null
  tempo_catolico: string | null
  sacramentos: Sacramento[]
  pastoral: string | null
  veio_de_outra_religiao: boolean
  religiao_anterior: string | null
  comunidade: string | null

  // Metadados
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email' | 'role' | 'created_at' | 'updated_at'>>
