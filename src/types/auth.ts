// ═══════════════════════════════════════════════════════
// VERITAS DEI — Auth & Profile Types
// ═══════════════════════════════════════════════════════

export type UserRole = 'user' | 'admin'
export type AccountStatus = 'active' | 'pending_verification' | 'suspended'
export type PlanKey = 'free' | 'estudos'

export type RelationshipStatus = 'solteiro' | 'casado' | 'namorando'

export const RELATIONSHIP_STATUSES: { value: RelationshipStatus; label: string }[] = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'namorando', label: 'Namorando' },
  { value: 'casado', label: 'Casado(a)' },
]

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
  public_handle: string | null
  name: string | null
  email: string
  cpf: string | null
  role: UserRole
  status: AccountStatus
  plan: PlanKey
  vocacao: Vocacao
  community_role: 'leigo' | 'diacono' | 'padre' | 'bispo' | 'religioso' | 'artista' | 'moderator' | 'admin'
  verified: boolean
  has_password_set: boolean
  onboarding_completed: boolean
  falecido: boolean

  // Pessoal
  profile_image_url: string | null
  cover_image_url: string | null
  bio_short: string | null
  external_links: Array<{ label: string; url: string }>
  show_likes_public: boolean
  instagram: string | null
  whatsapp: string | null
  tiktok: string | null
  youtube: string | null
  relationship_status: RelationshipStatus | null
  data_nascimento: string | null
  genero: 'masculino' | 'feminino' | null

  // Localização GPS (aba "Próximo" na comunidade)
  location_lat: number | null
  location_lng: number | null
  location_city: string | null
  location_state: string | null
  location_updated_at: string | null

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
