import type { Block, CalloutBlock, HeadingBlock, ListBlock, ParagraphBlock, QuoteBlock, VerseBlock } from './types'

/**
 * PrayerRenderer — Server Component puro.
 *
 * Consome Block[] (produzido por `parsePrayerBody`) e devolve JSX.
 * Tipografia: Cinzel pra headings, Cormorant Garamond pros versos
 * (italic), Poppins pro corpo. Cores usam var(--gold), var(--text-*).
 * Reutiliza `.verse-block` e `.ornament-divider` do globals.css.
 */
export default function PrayerRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prayer-content flex flex-col gap-5">
      {blocks.map((block, idx) => (
        <BlockSwitch key={idx} block={block} />
      ))}
    </div>
  )
}

function BlockSwitch({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <Heading {...block} />
    case 'paragraph':
      return <Paragraph {...block} />
    case 'verse':
      return <Verse {...block} />
    case 'list':
      return <ListRender {...block} />
    case 'quote':
      return <Quote {...block} />
    case 'callout':
      return <Callout {...block} />
    case 'divider':
      return <Divider />
  }
}

function Heading({ level, text }: HeadingBlock) {
  const Tag = (`h${level}`) as 'h2' | 'h3' | 'h4'
  const style: React.CSSProperties = {
    fontFamily: 'Cinzel, serif',
    color: 'var(--gold)',
    letterSpacing: level === 2 ? '0.05em' : '0.03em',
    fontSize:
      level === 2 ? '1.25rem' : level === 3 ? '1.1rem' : '1rem',
    fontWeight: 600,
    textTransform: level === 2 ? 'uppercase' : 'none',
    marginTop: level === 2 ? '1.25rem' : '0.75rem',
  }
  return <Tag style={style}>{text}</Tag>
}

function Paragraph({ text }: ParagraphBlock) {
  return (
    <p
      style={{
        fontFamily: 'Poppins, sans-serif',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        lineHeight: 1.7,
        fontWeight: 300,
        whiteSpace: 'pre-wrap',
      }}
      dangerouslySetInnerHTML={{ __html: renderInline(text) }}
    />
  )
}

function Verse({ text, reference }: VerseBlock) {
  return (
    <figure className="verse-block">
      <blockquote
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '1.2rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </blockquote>
      {reference && (
        <figcaption
          style={{
            fontFamily: 'Cinzel, serif',
            color: 'var(--gold)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: '0.75rem',
            opacity: 0.85,
          }}
        >
          — {reference}
        </figcaption>
      )}
    </figure>
  )
}

function ListRender({ ordered, items }: ListBlock) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag
      style={{
        fontFamily: 'Poppins, sans-serif',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        lineHeight: 1.8,
        fontWeight: 300,
        paddingLeft: '1.5rem',
        listStyleType: ordered ? 'decimal' : 'disc',
      }}
    >
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
      ))}
    </Tag>
  )
}

function Quote({ text, author }: QuoteBlock) {
  return (
    <figure
      style={{
        borderLeft: '2px solid var(--gold-dim)',
        padding: '0.5rem 1rem',
        margin: 0,
      }}
    >
      <blockquote
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.1rem',
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          whiteSpace: 'pre-wrap',
        }}
      >
        “{text}”
      </blockquote>
      {author && (
        <figcaption
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
          }}
        >
          — {author}
        </figcaption>
      )}
    </figure>
  )
}

function Callout({ tone, text }: CalloutBlock) {
  const palette = {
    info: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.25)', color: 'var(--text-primary)' },
    warning: { bg: 'rgba(217,79,92,0.1)', border: 'rgba(217,79,92,0.3)', color: '#F2EDE4' },
    indulgence: { bg: 'rgba(107,29,42,0.18)', border: 'rgba(139,49,69,0.35)', color: '#F2EDE4' },
  }[tone]
  return (
    <aside
      role="note"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: '0.9rem 1.1rem',
        color: palette.color,
        fontFamily: 'Poppins, sans-serif',
        fontSize: '0.9rem',
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
      }}
      dangerouslySetInnerHTML={{ __html: renderInline(text) }}
    />
  )
}

function Divider() {
  return <div className="ornament-divider" aria-hidden />
}

/**
 * Inline formatting minimalista — apenas o necessário pra orações:
 *   **bold**, *italic*, quebras de linha preservadas.
 * Retorna HTML seguro porque o input vem do nosso próprio seed/admin
 * (não é input de usuário público). Ainda assim, escapamos tags HTML
 * cruas para evitar acidentes de admin que cole markup.
 */
function renderInline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
