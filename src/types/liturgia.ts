/**
 * Tipos compartilhados para a Liturgia do Dia.
 *
 * As leituras reais vêm de Canção Nova via Edge Function `liturgia-scrape`
 * (cacheadas em `public.liturgia_dia`). O tempo / cor / grau ainda é calculado
 * localmente por `getLiturgicalDay` — as duas fontes coexistem: a local é
 * determinística e sempre disponível (offline), a remota traz o texto.
 */

export interface LeituraRef {
  /** Ex.: "(At 2,42-47)" ou "Sl 117(118),2-4.13-15.22-24" */
  referencia: string
  /** Texto completo já sem HTML / entidades */
  texto: string
}

export interface LiturgiaDia {
  /** YYYY-MM-DD (fuso do usuário — por default America/Sao_Paulo) */
  data: string
  /** Título do dia litúrgico ("Domingo da Divina Misericórdia", etc.) */
  titulo: string | null
  primeira_leitura: LeituraRef | null
  salmo: LeituraRef | null
  segunda_leitura: LeituraRef | null
  aclamacao: LeituraRef | null
  evangelho: LeituraRef | null
  fonte: string
  coletado_em: string
  /** Retornada diretamente do cache? */
  cached?: boolean
  /** True se o scrape falhou e retornamos versão antiga */
  stale?: boolean
}
