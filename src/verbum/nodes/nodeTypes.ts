import TrinitasNode from './TrinitasNode'
import FiguraNode from './FiguraNode'
import VersiculoNode from './VersiculoNode'
import DogmaNode from './DogmaNode'
import EncarnacaoNode from './EncarnacaoNode'

export const nodeTypes = {
  trinitas: TrinitasNode,
  figura: FiguraNode,
  versiculo: VersiculoNode,
  dogma: DogmaNode,
  encarnado: EncarnacaoNode,
} as const
