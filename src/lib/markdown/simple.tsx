/**
 * Renderizador de markdown SIMPLES — só os recursos que a IA católica usa
 * (negrito **texto**, itálico *texto* e quebras de linha duplas como
 * parágrafos). Sem dependência externa.
 *
 * Uso:
 *   <SimpleMarkdown text={result.insight.summary} />
 *
 * Suporta:
 *  - **negrito**
 *  - *itálico* (sem confundir com listas)
 *  - Parágrafos separados por \n\n
 *  - Listas com hífen ou bullet (- item, • item) por linha
 *
 * Não suporta links, imagens, headings — se precisar, troque por
 * react-markdown depois. Pra os textos que a IA gera, isto basta.
 */

import { Fragment, type CSSProperties } from 'react'

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }

/**
 * Tokeniza uma linha em pedaços de texto/negrito/itálico.
 * Negrito tem precedência sobre itálico (** é casado antes de *).
 */
function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let buffer = ''
  const flushBuffer = () => {
    if (buffer.length > 0) {
      tokens.push({ type: 'text', value: buffer })
      buffer = ''
    }
  }

  while (i < line.length) {
    // **bold**
    if (line.startsWith('**', i)) {
      const end = line.indexOf('**', i + 2)
      if (end > i + 2) {
        flushBuffer()
        tokens.push({ type: 'bold', value: line.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    // *italic* — não casa quando é o início de uma "lista" (sequência "* "
    // sem fechamento). Pra evitar falso positivo, exige fechamento com *
    // antes de quebra de linha.
    if (line[i] === '*' && line[i + 1] !== '*' && line[i + 1] !== ' ') {
      const end = line.indexOf('*', i + 1)
      if (end > i + 1) {
        flushBuffer()
        tokens.push({ type: 'italic', value: line.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    buffer += line[i]
    i++
  }
  flushBuffer()
  return tokens
}

/** Identifica se a linha é um item de lista. */
function listMatch(line: string): string | null {
  const trimmed = line.trimStart()
  if (trimmed.startsWith('- ')) return trimmed.slice(2)
  if (trimmed.startsWith('• ')) return trimmed.slice(2)
  if (trimmed.startsWith('* ')) return trimmed.slice(2)
  return null
}

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'list'; items: string[] }

/** Agrupa linhas em blocos de parágrafo ou lista. */
function blockify(text: string): Block[] {
  const lines = text.split(/\r?\n/)
  const blocks: Block[] = []
  let para: string[] = []
  let list: string[] = []

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ kind: 'paragraph', lines: para })
      para = []
    }
  }
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ kind: 'list', items: list })
      list = []
    }
  }

  for (const raw of lines) {
    const item = listMatch(raw)
    if (item !== null) {
      flushPara()
      list.push(item)
    } else if (raw.trim() === '') {
      flushPara()
      flushList()
    } else {
      flushList()
      para.push(raw)
    }
  }
  flushPara()
  flushList()
  return blocks
}

function renderTokens(tokens: Token[]): React.ReactNode {
  return tokens.map((t, i) => {
    if (t.type === 'bold') {
      return (
        <strong
          key={i}
          style={{ color: 'var(--text-1)', fontWeight: 600 }}
        >
          {t.value}
        </strong>
      )
    }
    if (t.type === 'italic') {
      return (
        <em key={i} style={{ fontStyle: 'italic' }}>
          {t.value}
        </em>
      )
    }
    return <Fragment key={i}>{t.value}</Fragment>
  })
}

export default function SimpleMarkdown({
  text,
  className,
  style,
}: {
  text: string
  className?: string
  style?: CSSProperties
}) {
  const blocks = blockify(text)

  return (
    <div className={className} style={style}>
      {blocks.map((b, bi) => {
        if (b.kind === 'list') {
          return (
            <ul key={bi} className="space-y-1.5 my-3">
              {b.items.map((item, ii) => (
                <li
                  key={ii}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                  style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                >
                  <span
                    className="inline-block w-1 h-1 rounded-full mt-2 flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                  />
                  <span>{renderTokens(tokenizeLine(item))}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p
            key={bi}
            className="text-sm md:text-base leading-relaxed my-3"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            {b.lines.map((l, li) => (
              <Fragment key={li}>
                {renderTokens(tokenizeLine(l))}
                {li < b.lines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
