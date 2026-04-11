import TipologiaEdge from './TipologiaEdge'
import DoutrinaEdge from './DoutrinaEdge'
import ProfeticaEdge from './ProfeticaEdge'
import MagisterioEdge from './MagisterioEdge'
import PropostaEdge from './PropostaEdge'

export const edgeTypes = {
  tipologia: TipologiaEdge,
  doutrina: DoutrinaEdge,
  profetica: ProfeticaEdge,
  magistério: MagisterioEdge,
  patristica: DoutrinaEdge,     // Reuses doutrina style with different color (applied via data)
  citacao_direta: DoutrinaEdge, // Reuses doutrina style
  etimologia: DoutrinaEdge,     // Reuses doutrina style
  proposta: PropostaEdge,
} as const
