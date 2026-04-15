/**
 * Mockups visuais estilizados (SVG) para cada devotion section.
 * Dão a sensação de "produto pronto" em vez de bullets.
 * Todos puramente decorativos.
 */

const GOLD = '#C9A84C'
const GOLD_LIGHT = '#E6D9B5'
const WINE = '#5A1625'

interface MockupProps {
  tone: 'dark' | 'light'
  className?: string
}

const bg = (tone: 'dark' | 'light') => (tone === 'dark' ? '#14100B' : '#FFFCF3')
const line = (tone: 'dark' | 'light') => (tone === 'dark' ? 'rgba(242,237,228,0.15)' : 'rgba(90,22,37,0.18)')
const text = (tone: 'dark' | 'light') => (tone === 'dark' ? '#E6D9B5' : '#2A1D14')
const muted = (tone: 'dark' | 'light') => (tone === 'dark' ? 'rgba(242,237,228,0.45)' : 'rgba(90,22,37,0.45)')

/* ─────────────────────────────────────────────────────────
   LITURGIA DO DIA
   ───────────────────────────────────────────────────────── */
export function LiturgiaMockup({ tone, className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      {/* frame */}
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      {/* header bar */}
      <rect x="24" y="24" width="372" height="56" rx="12" fill={tone === 'dark' ? '#1C1610' : '#F7EFDD'} />
      <circle cx="48" cy="52" r="12" fill="none" stroke={GOLD} strokeWidth="1.2" />
      <path d="M48 44 L48 60 M40 52 L56 52" stroke={GOLD} strokeWidth="1.2" />
      <text x="72" y="48" fontFamily="Cinzel, serif" fontSize="10" fill={muted(tone)} letterSpacing="2">
        TERÇA — 2ª SEMANA DA PÁSCOA
      </text>
      <text x="72" y="68" fontFamily="Cormorant Garamond, serif" fontSize="18" fill={text(tone)} fontWeight="600">
        Liturgia do Dia
      </text>

      {/* liturgical color pill */}
      <rect x="310" y="38" width="80" height="28" rx="14" fill="none" stroke={WINE} strokeWidth="1" />
      <circle cx="326" cy="52" r="4" fill={WINE} />
      <text x="336" y="56" fontFamily="Poppins, sans-serif" fontSize="9" fill={WINE}>
        BRANCO
      </text>

      {/* Primeira leitura header */}
      <text x="24" y="118" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2">
        ✦ PRIMEIRA LEITURA
      </text>
      <line x1="24" y1="126" x2="396" y2="126" stroke={line(tone)} />
      <text x="24" y="146" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={muted(tone)}>
        At 4, 32-37
      </text>

      {/* Text lines */}
      {[0, 1, 2, 3].map(i => (
        <rect
          key={`l1-${i}`}
          x="24"
          y={162 + i * 14}
          width={i === 3 ? 240 : 372}
          height="6"
          rx="3"
          fill={line(tone)}
        />
      ))}

      {/* Salmo */}
      <text x="24" y="244" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2">
        ✦ SALMO RESPONSORIAL
      </text>
      <line x1="24" y1="252" x2="396" y2="252" stroke={line(tone)} />
      <rect
        x="24"
        y="266"
        width="372"
        height="42"
        rx="8"
        fill={tone === 'dark' ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.08)'}
        stroke={GOLD}
        strokeOpacity="0.3"
      />
      <text
        x="210"
        y="294"
        textAnchor="middle"
        fontFamily="Cormorant Garamond, serif"
        fontSize="14"
        fill={text(tone)}
        fontStyle="italic"
      >
        &ldquo;O Senhor é meu pastor, nada me faltará.&rdquo;
      </text>

      {/* Evangelho */}
      <text x="24" y="338" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2">
        ✦ EVANGELHO
      </text>
      <line x1="24" y1="346" x2="396" y2="346" stroke={line(tone)} />
      <text x="24" y="366" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={muted(tone)}>
        Jo 3, 7b-15
      </text>
      {[0, 1, 2, 3, 4].map(i => (
        <rect
          key={`l2-${i}`}
          x="24"
          y={382 + i * 14}
          width={i === 4 ? 280 : 372}
          height="6"
          rx="3"
          fill={line(tone)}
        />
      ))}

      {/* Santo do dia footer */}
      <rect
        x="24"
        y="464"
        width="372"
        height="40"
        rx="10"
        fill={tone === 'dark' ? 'rgba(90,22,37,0.12)' : 'rgba(90,22,37,0.08)'}
        stroke={WINE}
        strokeOpacity="0.3"
      />
      <circle cx="44" cy="484" r="10" fill="none" stroke={WINE} strokeOpacity="0.6" />
      <path d="M44 478 L44 490 M38 484 L50 484" stroke={WINE} strokeOpacity="0.6" strokeWidth="1" />
      <text x="62" y="480" fontFamily="Cinzel, serif" fontSize="9" fill={WINE} letterSpacing="1.5">
        SANTO DO DIA
      </text>
      <text x="62" y="494" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={text(tone)} fontWeight="600">
        São Martinho I, Papa e Mártir
      </text>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────
   ORAÇÕES
   ───────────────────────────────────────────────────────── */
export function OracoesMockup({ tone, className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      {/* Header */}
      <text x="210" y="52" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11" fill={GOLD} letterSpacing="3">
        ORAÇÕES
      </text>
      <line x1="140" y1="62" x2="200" y2="62" stroke={GOLD} strokeOpacity="0.4" />
      <line x1="220" y1="62" x2="280" y2="62" stroke={GOLD} strokeOpacity="0.4" />
      <circle cx="210" cy="62" r="2" fill={GOLD} />

      {/* Ave Maria — main card */}
      <rect
        x="24"
        y="84"
        width="372"
        height="176"
        rx="14"
        fill={tone === 'dark' ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.08)'}
        stroke={GOLD}
        strokeOpacity="0.35"
      />
      <rect x="24" y="84" width="4" height="176" fill={GOLD} />
      <text x="44" y="112" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2">
        CLÁSSICA · MARIANA
      </text>
      <text x="44" y="140" fontFamily="Cormorant Garamond, serif" fontSize="22" fill={text(tone)} fontWeight="600">
        Ave, Maria
      </text>
      <text x="44" y="168" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)} fontStyle="italic">
        Ave Maria, cheia de graça, o Senhor é
      </text>
      <text x="44" y="184" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)} fontStyle="italic">
        convosco; bendita sois vós entre as mulheres
      </text>
      <text x="44" y="200" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)} fontStyle="italic">
        e bendito é o fruto do vosso ventre, Jesus…
      </text>

      {/* Favorite heart */}
      <circle cx="360" cy="108" r="14" fill="none" stroke={GOLD} strokeOpacity="0.4" />
      <path
        d="M355 106 Q353 104 355 102 Q357 100 360 103 Q363 100 365 102 Q367 104 365 106 L360 112 Z"
        fill={GOLD}
        fillOpacity="0.8"
      />

      {/* List of other prayers */}
      {[
        ['PATER NOSTER', 'Pai-Nosso'],
        ['SYMBOLUM', 'Credo dos Apóstolos'],
        ['ANGELUS DOMINI', 'Ângelus'],
        ['SALVE REGINA', 'Salve-Rainha'],
      ].map(([eye, name], i) => (
        <g key={name}>
          <rect
            x="24"
            y={284 + i * 52}
            width="372"
            height="44"
            rx="10"
            fill="none"
            stroke={line(tone)}
          />
          <circle
            cx="48"
            cy={306 + i * 52}
            r="10"
            fill="none"
            stroke={GOLD}
            strokeOpacity="0.4"
          />
          <text
            x="48"
            y={310 + i * 52}
            textAnchor="middle"
            fontFamily="Cinzel, serif"
            fontSize="10"
            fill={GOLD}
          >
            {i + 1}
          </text>
          <text
            x="70"
            y={301 + i * 52}
            fontFamily="Cinzel, serif"
            fontSize="8"
            fill={muted(tone)}
            letterSpacing="1.5"
          >
            {eye}
          </text>
          <text
            x="70"
            y={316 + i * 52}
            fontFamily="Cormorant Garamond, serif"
            fontSize="14"
            fill={text(tone)}
            fontWeight="600"
          >
            {name}
          </text>
          <path d={`M378 ${306 + i * 52} L388 ${306 + i * 52}`} stroke={GOLD} strokeWidth="1" />
          <path
            d={`M385 ${302 + i * 52} L389 ${306 + i * 52} L385 ${310 + i * 52}`}
            stroke={GOLD}
            strokeWidth="1"
            fill="none"
          />
        </g>
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────
   SANTO TERÇO
   ───────────────────────────────────────────────────────── */
export function TercoMockup({ tone, className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      {/* Eyebrow */}
      <text
        x="210"
        y="44"
        textAnchor="middle"
        fontFamily="Cinzel, serif"
        fontSize="9"
        fill={GOLD}
        letterSpacing="2"
      >
        ✦ TERÇA-FEIRA ✦
      </text>
      <text x="210" y="78" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="20" fill={text(tone)} fontWeight="600">
        Mistérios Dolorosos
      </text>

      {/* Rosary visual — circular bead layout */}
      <g transform="translate(210,240)">
        {/* Center cross */}
        <g transform="translate(0,0)">
          <circle r="32" fill="none" stroke={GOLD} strokeOpacity="0.4" strokeWidth="1" />
          <circle r="24" fill={tone === 'dark' ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.12)'} stroke={GOLD} strokeOpacity="0.5" />
          <path d="M0 -14 L0 14 M-10 0 L10 0" stroke={GOLD} strokeWidth="1.5" />
          <circle r="3" fill={GOLD} />
        </g>

        {/* Decades - circle of beads */}
        {Array.from({ length: 50 }).map((_, i) => {
          const angle = (i / 50) * Math.PI * 2 - Math.PI / 2
          const r = 90
          const cx = Math.cos(angle) * r
          const cy = Math.sin(angle) * r
          const isPater = i % 10 === 0
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isPater ? 4 : 2.2}
              fill={isPater ? GOLD : GOLD_LIGHT}
              fillOpacity={i < 13 ? 1 : 0.3}
            />
          )
        })}

        {/* Progress arc */}
        <circle
          r="90"
          fill="none"
          stroke={GOLD}
          strokeWidth="0.6"
          strokeOpacity="0.25"
          strokeDasharray="2 4"
        />
      </g>

      {/* Current mystery indicator */}
      <rect
        x="60"
        y="380"
        width="300"
        height="50"
        rx="10"
        fill={tone === 'dark' ? 'rgba(90,22,37,0.14)' : 'rgba(90,22,37,0.08)'}
        stroke={WINE}
        strokeOpacity="0.4"
      />
      <text x="210" y="402" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="9" fill={WINE} letterSpacing="2">
        2º MISTÉRIO DOLOROSO
      </text>
      <text x="210" y="420" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="14" fill={text(tone)} fontStyle="italic">
        A Flagelação de Nosso Senhor
      </text>

      {/* Counter */}
      <text x="210" y="458" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11" fill={GOLD} letterSpacing="3">
        AVE MARIA  ·  3 / 10
      </text>

      {/* Bottom controls */}
      <rect x="140" y="476" width="140" height="30" rx="15" fill="none" stroke={GOLD} strokeOpacity="0.5" />
      <circle cx="168" cy="491" r="6" fill="none" stroke={GOLD} />
      <path d="M172 487 L164 495" stroke={GOLD} />
      <text x="210" y="495" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="9" fill={GOLD} letterSpacing="2">
        AVANÇAR
      </text>
      <path d="M252 487 L260 495" stroke={GOLD} />
      <circle cx="252" cy="491" r="6" fill="none" stroke={GOLD} />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────
   EXAME DE CONSCIÊNCIA
   ───────────────────────────────────────────────────────── */
export function ExameMockup({ tone, className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      <text x="24" y="50" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2">
        EXAME DE CONSCIÊNCIA
      </text>
      <line x1="24" y1="60" x2="396" y2="60" stroke={GOLD} strokeOpacity="0.35" />
      <text x="24" y="88" fontFamily="Cormorant Garamond, serif" fontSize="20" fill={text(tone)} fontWeight="600">
        Segundo os Dez Mandamentos
      </text>
      <text x="24" y="108" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)} fontStyle="italic">
        Antes de começar, faça um instante de silêncio.
      </text>

      {/* Progress bar */}
      <rect x="24" y="126" width="372" height="6" rx="3" fill={line(tone)} />
      <rect x="24" y="126" width="148" height="6" rx="3" fill={GOLD} />
      <text x="24" y="148" fontFamily="Poppins, sans-serif" fontSize="10" fill={muted(tone)}>
        Mandamento 4 de 10
      </text>
      <text x="396" y="148" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="10" fill={GOLD}>
        40%
      </text>

      {/* Mandamento card */}
      <rect
        x="24"
        y="168"
        width="372"
        height="148"
        rx="14"
        fill={tone === 'dark' ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.08)'}
        stroke={GOLD}
        strokeOpacity="0.3"
      />
      <circle cx="52" cy="200" r="16" fill="none" stroke={GOLD} strokeOpacity="0.6" />
      <text x="52" y="206" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="14" fill={GOLD} fontWeight="700">
        IV
      </text>
      <text x="80" y="196" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.5">
        QUARTO MANDAMENTO
      </text>
      <text x="80" y="214" fontFamily="Cormorant Garamond, serif" fontSize="15" fill={text(tone)} fontWeight="600">
        Honrar pai e mãe
      </text>

      <text x="40" y="244" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)}>
        ✓  Respeitei meus pais com palavras e atos?
      </text>
      <text x="40" y="264" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)}>
        ✓  Rezei por eles?
      </text>
      <text x="40" y="284" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)}>
        ✓  Cumpri meus deveres em família?
      </text>
      <text x="40" y="304" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={muted(tone)}>
        ✓  Fui autoridade justa com os meus?
      </text>

      {/* Next section CTA */}
      <rect x="24" y="348" width="372" height="52" rx="12" fill="none" stroke={GOLD} strokeWidth="1" />
      <text x="44" y="372" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.5">
        PRÓXIMO
      </text>
      <text x="44" y="388" fontFamily="Cormorant Garamond, serif" fontSize="14" fill={text(tone)} fontWeight="600">
        V. Não matarás
      </text>
      <path d="M370 374 L382 374" stroke={GOLD} strokeWidth="1.2" />
      <path d="M378 370 L382 374 L378 378" stroke={GOLD} strokeWidth="1.2" fill="none" />

      {/* Confissão CTA */}
      <rect
        x="24"
        y="420"
        width="372"
        height="72"
        rx="14"
        fill={tone === 'dark' ? 'rgba(90,22,37,0.2)' : 'rgba(90,22,37,0.08)'}
        stroke={WINE}
        strokeOpacity="0.5"
      />
      <circle cx="56" cy="456" r="18" fill="none" stroke={WINE} strokeOpacity="0.7" />
      <path d="M56 444 L56 468 M44 456 L68 456" stroke={WINE} strokeWidth="1.4" />
      <text x="90" y="452" fontFamily="Cinzel, serif" fontSize="10" fill={WINE} letterSpacing="2">
        PRÓXIMO PASSO
      </text>
      <text x="90" y="470" fontFamily="Cormorant Garamond, serif" fontSize="15" fill={text(tone)} fontWeight="600">
        Procurar uma confissão
      </text>
    </svg>
  )
}
