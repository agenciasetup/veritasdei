/**
 * Tipos de Propósitos Espirituais.
 *
 * Um "propósito" é um compromisso pessoal do usuário com uma prática de fé
 * (rezar o terço, confessar-se, ir à missa diária, jejuar, etc.).
 *
 * Cada check-in no propósito é um registro em `user_propositos_log`.
 */

export type PropositoCadencia = 'diaria' | 'semanal' | 'mensal' | 'dias_semana'

/**
 * Tipos pré-definidos que a UI reconhece e estiliza. 'custom' libera
 * o usuário para criar o seu próprio.
 */
export type PropositoTipo =
  | 'rosario'
  | 'confissao'
  | 'missa'
  | 'jejum'
  | 'leitura'
  | 'adoracao'
  | 'custom'

export interface Proposito {
  id: string
  user_id: string
  tipo: PropositoTipo | string
  titulo: string
  descricao: string | null
  cadencia: PropositoCadencia
  meta_por_periodo: number
  dias_semana: number[] | null // 0=domingo..6=sábado quando cadencia='dias_semana'
  horario_sugerido: string | null // 'HH:MM' ou 'HH:MM:SS'
  ativo: boolean
  created_at: string
}

export interface PropositoLog {
  id: string
  proposito_id: string
  user_id: string
  feito_em: string // 'YYYY-MM-DD' em timezone do usuário
  observacao: string | null
  created_at: string
}

export interface PropositoComProgresso extends Proposito {
  /** Quantos check-ins no período atual (semana/mês/dia). */
  periodo_atual: number
  /** Sequência de dias/períodos consecutivos cumpridos. */
  streak: number
  /** Logs recentes (últimos 30) para visualizações. */
  logs_recentes: PropositoLog[]
  /** true se já houve check-in hoje. */
  feito_hoje: boolean
}

export interface NotificacoesPrefs {
  user_id: string
  push_enabled: boolean
  push_endpoint: string | null
  push_p256dh: string | null
  push_auth: string | null
  push_user_agent: string | null
  timezone: string
  rezar_terco_hora: string | null
  lembrete_confissao_dias: number
  lembrete_missa: boolean
  atualizado_em: string
}
