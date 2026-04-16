import type { NovenaBuiltin } from './types'

// ---------------------------------------------------------------------------
// Catálogo de Novenas Builtin — Veritas Dei
//
// 7 novenas tradicionais católicas com 9 dias de oração cada.
// Textos em PT-BR, baseados na tradição devocional da Igreja.
// Cada novena é um arquivo separado importado aqui para manter o bundle leve.
// ---------------------------------------------------------------------------

import { NOVENA_NATAL } from './novenas/natal'
import { NOVENA_APARECIDA } from './novenas/aparecida'
import { NOVENA_SAO_JOSE } from './novenas/sao-jose'
import { NOVENA_SAGRADO_CORACAO } from './novenas/sagrado-coracao'
import { NOVENA_IMACULADA_CONCEICAO } from './novenas/imaculada-conceicao'
import { NOVENA_ESPIRITO_SANTO } from './novenas/espirito-santo'
import { NOVENA_PERPETUO_SOCORRO } from './novenas/perpetuo-socorro'

export const NOVENAS_CATALOG: NovenaBuiltin[] = [
  NOVENA_NATAL,
  NOVENA_APARECIDA,
  NOVENA_SAO_JOSE,
  NOVENA_SAGRADO_CORACAO,
  NOVENA_IMACULADA_CONCEICAO,
  NOVENA_ESPIRITO_SANTO,
  NOVENA_PERPETUO_SOCORRO,
]

export function getNovenaBySlugl(slug: string): NovenaBuiltin | undefined {
  return NOVENAS_CATALOG.find(n => n.slug === slug)
}
