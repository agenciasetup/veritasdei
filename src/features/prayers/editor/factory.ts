import type { Block } from '../types'

/**
 * Defaults para cada tipo de bloco — usado quando se insere um
 * novo bloco no canvas. Todos começam com conteúdo placeholder
 * pra não ficar visualmente vazio.
 */
export function createBlock(type: Block['type']): Block {
  switch (type) {
    case 'heading':
      return { type: 'heading', level: 2, text: 'Novo título' }
    case 'paragraph':
      return { type: 'paragraph', text: '' }
    case 'verse':
      return { type: 'verse', text: '' }
    case 'divider':
      return { type: 'divider' }
    case 'list':
      return { type: 'list', ordered: false, items: [''] }
    case 'quote':
      return { type: 'quote', text: '' }
    case 'callout':
      return { type: 'callout', tone: 'info', text: '' }
  }
}

export function labelForBlockType(type: Block['type']): string {
  return (
    {
      heading: 'Título',
      paragraph: 'Parágrafo',
      verse: 'Oração / verso',
      divider: 'Divisor ornamental',
      list: 'Lista',
      quote: 'Citação',
      callout: 'Destaque',
    } as const
  )[type]
}
