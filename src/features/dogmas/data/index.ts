export type { DogmaCategory, Dogma, BibleVerse } from './types'
import { dogmasDeus } from './dogmas-deus'
import { dogmasCristo } from './dogmas-cristo'
import { dogmasCriacao, dogmasHomem } from './dogmas-criacao-homem'
import { dogmasMarianos, dogmasIgreja } from './dogmas-maria-igreja'
import { dogmasSacramentos, dogmasEscatologia } from './dogmas-sacramentos-escatologia'

export const DOGMA_CATEGORIES = [
  dogmasDeus,
  dogmasCristo,
  dogmasCriacao,
  dogmasHomem,
  dogmasMarianos,
  dogmasIgreja,
  dogmasSacramentos,
  dogmasEscatologia,
] as const
