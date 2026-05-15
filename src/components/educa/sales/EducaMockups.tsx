/**
 * Mockups SVG das 5 funções do Veritas Educa + o mockup do dashboard
 * que voa no hero.
 *
 * Tudo é puramente decorativo — viewBox fixo (420×520) pra encaixar nos
 * frames `.mockup-frame-dark`/`.mockup-frame-light` do globals.css.
 */

const GOLD = '#C9A84C'
const WINE = '#5A1625'

type Tone = 'dark' | 'light'

interface MockupProps {
  tone?: Tone
  className?: string
}

const bg = (t: Tone) => (t === 'dark' ? '#14100B' : '#FFFCF3')
const line = (t: Tone) => (t === 'dark' ? 'rgba(242,237,228,0.15)' : 'rgba(90,22,37,0.18)')
const text = (t: Tone) => (t === 'dark' ? '#E6D9B5' : '#2A1D14')
const muted = (t: Tone) => (t === 'dark' ? 'rgba(242,237,228,0.45)' : 'rgba(90,22,37,0.45)')
const soft = (t: Tone) => (t === 'dark' ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.10)')

/* ──────────────────────────────────────────────────────────────────────────
   HERO — mini "phone" espelhando o dashboard mobile real do Veritas Educa.
   Labels conferem com os componentes reais (GreetingStrip, ContinueHeroCard,
   TodayCard, EducaBottomNav). Pilar e tópico usados são reais (vindos de
   public.content_groups / content_topics). Missão exibida é uma das
   variantes de mission_type (`pray_rosary`).
   ────────────────────────────────────────────────────────────────────────── */
type HeroDashboardProps = MockupProps & {
  /** Nome do tempo litúrgico atual (ex.: "Tempo Comum", "Páscoa"). */
  liturgia?: string
}

export function HeroDashboardMockup({
  className = '',
  liturgia = 'Tempo Comum',
}: HeroDashboardProps) {
  const tone: Tone = 'dark'
  // Limita o rótulo da liturgia pra não quebrar o card no SVG.
  const liturgiaShort = liturgia.length > 18 ? liturgia.slice(0, 16) + '…' : liturgia
  return (
    <svg viewBox="0 0 360 720" className={className} aria-hidden>
      {/* Phone outer */}
      <rect x="0" y="0" width="360" height="720" rx="44" fill="#0A0806" stroke={GOLD} strokeOpacity="0.4" />
      <rect x="6" y="6" width="348" height="708" rx="38" fill={bg(tone)} />

      {/* Status bar */}
      <text x="32" y="38" fontFamily="Cinzel, serif" fontSize="10" fill={muted(tone)} letterSpacing="1.5">
        09:24
      </text>
      <rect x="312" y="28" width="18" height="10" rx="2" fill="none" stroke={muted(tone)} />
      <rect x="314" y="30" width="13" height="6" rx="1" fill={GOLD} fillOpacity="0.7" />

      {/* ─── Greeting ─── */}
      <text x="24" y="76" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2.5">
        BOM DIA
      </text>

      {/* ─── Continue de onde parou ─── */}
      <rect
        x="24"
        y="92"
        width="312"
        height="148"
        rx="20"
        fill="url(#heroContinueGrad)"
        stroke={GOLD}
        strokeOpacity="0.4"
      />
      {/* tag "Continue de onde parou" */}
      <rect x="40" y="108" width="156" height="22" rx="11" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.08)" />
      {/* play icon */}
      <path d="M52 119 L48 115 L48 123 Z" fill={GOLD} />
      <text x="60" y="123" fontFamily="Poppins, sans-serif" fontSize="9" fill={GOLD}>
        Continue de onde parou
      </text>
      {/* group title (real pilar) */}
      <text x="40" y="156" fontFamily="Poppins, sans-serif" fontSize="9.5" fill={muted(tone)} letterSpacing="1">
        Dogmas da Igreja Católica
      </text>
      {/* subtopic title (real topic) */}
      <text x="40" y="184" fontFamily="Cormorant Garamond, serif" fontSize="22" fill="#F2EDE4" fontWeight="600">
        Dogmas sobre Deus
      </text>
      <text x="40" y="208" fontFamily="Poppins, sans-serif" fontSize="11" fill="rgba(242,237,228,0.65)">
        Você parou aqui. Continue de onde estava.
      </text>
      <text x="40" y="226" fontFamily="Poppins, sans-serif" fontSize="11" fill={GOLD} fontWeight="500">
        Continuar
      </text>
      <path d="M88 222 L92 226 L88 230" stroke={GOLD} strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* ─── Hoje (TodayCard) ─── */}
      <rect
        x="24"
        y="258"
        width="312"
        height="230"
        rx="20"
        fill="#141210"
        stroke="rgba(255,255,255,0.05)"
      />
      {/* Flame icon */}
      <path
        d="M44 286 Q52 274 48 264 Q60 274 60 290 Q60 302 50 304 Q40 302 40 292 Q40 290 44 286 Z"
        fill={GOLD}
        fillOpacity="0.85"
      />
      <text x="70" y="290" fontFamily="Cormorant Garamond, serif" fontSize="14" fill={text(tone)} fontWeight="500">
        Hoje
      </text>
      <text
        x="316"
        y="290"
        textAnchor="end"
        fontFamily="Poppins, sans-serif"
        fontSize="9.5"
        fill={muted(tone)}
      >
        5 dias de sequência
      </text>

      {/* Missão do dia (sub-card) */}
      <rect
        x="40"
        y="302"
        width="280"
        height="92"
        rx="14"
        fill="rgba(0,0,0,0.25)"
        stroke="rgba(255,255,255,0.04)"
      />
      <text x="56" y="322" fontFamily="Poppins, sans-serif" fontSize="9" fill={GOLD} letterSpacing="1.5">
        MISSÃO DO DIA
      </text>
      <text x="304" y="322" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="9.5" fill={muted(tone)}>
        +20 XP
      </text>
      <text x="56" y="346" fontFamily="Cormorant Garamond, serif" fontSize="15" fill={text(tone)} fontWeight="500">
        Reze o rosário de hoje
      </text>
      <text x="56" y="376" fontFamily="Poppins, sans-serif" fontSize="11" fill={GOLD} fontWeight="500">
        Cumprir missão
      </text>
      <path d="M124 372 L128 376 L124 380" stroke={GOLD} strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Semana — 7 dot pills */}
      {Array.from({ length: 7 }).map((_, i) => {
        const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
        const cx = 56 + i * 36
        const checked = i < 5
        const isToday = i === 4
        return (
          <g key={i}>
            <text
              x={cx}
              y="416"
              textAnchor="middle"
              fontFamily="Poppins, sans-serif"
              fontSize="9"
              fill={isToday ? GOLD : muted(tone)}
              fontWeight={isToday ? 600 : 400}
            >
              {labels[i]}
            </text>
            <circle
              cx={cx}
              cy="438"
              r="9"
              fill={checked ? GOLD : 'transparent'}
              stroke={isToday ? GOLD : line(tone)}
              strokeWidth={isToday ? 1.5 : 1}
            />
            {checked && !isToday && (
              <path
                d={`M${cx - 4} 438 L${cx - 1} 441 L${cx + 4} 435`}
                stroke="#1C140C"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {isToday && <circle cx={cx} cy="438" r="3" fill="#1C140C" />}
          </g>
        )
      })}

      {/* XP bar */}
      <text x="40" y="468" fontFamily="Poppins, sans-serif" fontSize="9.5" fill={muted(tone)}>
        Nível 3
      </text>
      <text x="320" y="468" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="9.5" fill={muted(tone)}>
        320 / 500 XP
      </text>
      <rect x="40" y="476" width="280" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="40" y="476" width="170" height="6" rx="3" fill={GOLD} />

      {/* ─── Cards rail (Rosário do dia + Liturgia) ─── */}
      <rect x="24" y="504" width="150" height="76" rx="16" fill="#141210" stroke="rgba(255,255,255,0.05)" />
      <text x="40" y="526" fontFamily="Poppins, sans-serif" fontSize="9" fill={GOLD} letterSpacing="1.5">
        ROSÁRIO DO DIA
      </text>
      <text x="40" y="548" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={text(tone)} fontWeight="500">
        Mistérios Gloriosos
      </text>
      <text x="40" y="566" fontFamily="Poppins, sans-serif" fontSize="10" fill={GOLD}>
        Rezar agora →
      </text>

      <rect x="186" y="504" width="150" height="76" rx="16" fill="#141210" stroke="rgba(255,255,255,0.05)" />
      <text x="202" y="526" fontFamily="Poppins, sans-serif" fontSize="9" fill={GOLD} letterSpacing="1.5">
        LITURGIA
      </text>
      <text x="202" y="548" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={text(tone)} fontWeight="500">
        {liturgiaShort}
      </text>
      <text x="202" y="566" fontFamily="Poppins, sans-serif" fontSize="10" fill={GOLD}>
        Ler hoje →
      </text>

      {/* ─── Magistério + Modo Debate ─── */}
      <rect x="24" y="596" width="150" height="46" rx="14" fill="#141210" stroke="rgba(255,255,255,0.05)" />
      <text x="40" y="620" fontFamily="Poppins, sans-serif" fontSize="11" fill={text(tone)} fontWeight="500">
        Magistério
      </text>
      <text x="40" y="632" fontFamily="Poppins, sans-serif" fontSize="8.5" fill={muted(tone)}>
        Pergunte com IA
      </text>

      <rect x="186" y="596" width="150" height="46" rx="14" fill="#141210" stroke="rgba(255,255,255,0.05)" />
      <text x="202" y="620" fontFamily="Poppins, sans-serif" fontSize="11" fill={text(tone)} fontWeight="500">
        Modo debate
      </text>
      <text x="202" y="632" fontFamily="Poppins, sans-serif" fontSize="8.5" fill={muted(tone)}>
        Treine apologética
      </text>

      {/* ─── Bottom nav real: Início | Estudo | Rosário | Coleção | Perfil ─── */}
      <line x1="6" y1="660" x2="354" y2="660" stroke="rgba(255,255,255,0.06)" />

      {[
        { label: 'Início', active: true },
        { label: 'Estudo', active: false },
        { label: 'Rosário', active: false },
        { label: 'Coleção', active: false },
        { label: 'Perfil', active: false },
      ].map((tab, i) => {
        const cx = 36 + i * 72
        const cy = 678
        const fill = tab.active ? GOLD : muted(tone)
        return (
          <g key={tab.label}>
            {/* Top indicator pill if active */}
            {tab.active && <rect x={cx - 14} y={660} width="28" height="2" rx="1" fill={GOLD} />}
            <NavIcon label={tab.label} x={cx} y={cy} color={fill} />
            <text
              x={cx}
              y={702}
              textAnchor="middle"
              fontFamily="Poppins, sans-serif"
              fontSize="9"
              fill={fill}
              fontWeight={tab.active ? 600 : 400}
            >
              {tab.label}
            </text>
          </g>
        )
      })}

      <defs>
        <linearGradient id="heroContinueGrad" x1="0" y1="0" x2="312" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(107,29,42,0.45)" />
          <stop offset="100%" stopColor="rgba(22,18,14,0.95)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Mini ícones lineares pro bottom nav do hero mockup. Tamanho ~16, centralizados em (x, y).
function NavIcon({ label, x, y, color }: { label: string; x: number; y: number; color: string }) {
  const s = 1.4 // stroke width
  switch (label) {
    case 'Início':
      // House (Home)
      return (
        <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${x - 7} ${y + 1} L${x} ${y - 6} L${x + 7} ${y + 1} L${x + 7} ${y + 7} L${x - 7} ${y + 7} Z`} />
          <path d={`M${x - 2} ${y + 7} L${x - 2} ${y + 3} L${x + 2} ${y + 3} L${x + 2} ${y + 7}`} />
        </g>
      )
    case 'Estudo':
      // BookOpen
      return (
        <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${x - 7} ${y - 5} L${x - 7} ${y + 5} Q${x - 4} ${y + 3} ${x} ${y + 4} Q${x + 4} ${y + 3} ${x + 7} ${y + 5} L${x + 7} ${y - 5} Q${x + 4} ${y - 7} ${x} ${y - 6} Q${x - 4} ${y - 7} ${x - 7} ${y - 5}`} />
          <path d={`M${x} ${y - 6} L${x} ${y + 4}`} />
        </g>
      )
    case 'Rosário':
      // Cross
      return (
        <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round">
          <path d={`M${x} ${y - 7} L${x} ${y + 7}`} />
          <path d={`M${x - 6} ${y - 2} L${x + 6} ${y - 2}`} />
        </g>
      )
    case 'Coleção':
      // Layers
      return (
        <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${x - 7} ${y - 3} L${x} ${y - 7} L${x + 7} ${y - 3} L${x} ${y + 1} Z`} />
          <path d={`M${x - 7} ${y} L${x} ${y + 4} L${x + 7} ${y}`} />
          <path d={`M${x - 7} ${y + 3} L${x} ${y + 7} L${x + 7} ${y + 3}`} />
        </g>
      )
    case 'Perfil':
      // User
      return (
        <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round">
          <circle cx={x} cy={y - 3} r="3.5" />
          <path d={`M${x - 6} ${y + 7} Q${x - 6} ${y + 2} ${x} ${y + 2} Q${x + 6} ${y + 2} ${x + 6} ${y + 7}`} />
        </g>
      )
    default:
      return null
  }
}



/* ──────────────────────────────────────────────────────────────────────────
   2. TERÇO EM GRUPO — contador circular + avatares
   ────────────────────────────────────────────────────────────────────────── */
export function TercoMockup({ tone = 'light', className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      {/* Header */}
      <text x="210" y="48" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2.5">
        SALA · TERÇO JUNTOS
      </text>
      <text x="210" y="74" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="20" fill={text(tone)} fontWeight="600">
        Mistérios Gloriosos
      </text>
      <text x="210" y="94" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="11" fill={muted(tone)}>
        2º — A Ascensão do Senhor
      </text>

      {/* Live dot + members count */}
      <circle cx="40" cy="62" r="4" fill="#D94F5C" />
      <text x="52" y="66" fontFamily="Poppins, sans-serif" fontSize="10" fill={text(tone)} fontWeight="600">
        ao vivo
      </text>
      <text x="380" y="66" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="10" fill={muted(tone)}>
        7 rezando
      </text>

      {/* Rosary counter circle */}
      <circle cx="210" cy="260" r="98" fill="none" stroke={line(tone)} strokeWidth="6" />
      <circle
        cx="210"
        cy="260"
        r="98"
        fill="none"
        stroke={GOLD}
        strokeWidth="6"
        strokeDasharray={`${(7 / 10) * 615} 615`}
        strokeLinecap="round"
        transform="rotate(-90 210 260)"
      />
      {/* beads */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2
        const cx = 210 + Math.cos(angle) * 98
        const cy = 260 + Math.sin(angle) * 98
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i < 7 ? 6 : 4}
            fill={i < 7 ? GOLD : tone === 'dark' ? '#2A2018' : '#E3D5BE'}
            stroke={GOLD}
            strokeOpacity="0.5"
          />
        )
      })}
      {/* center text */}
      <text x="210" y="252" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11" fill={muted(tone)} letterSpacing="2">
        AVE-MARIAS
      </text>
      <text x="210" y="284" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="38" fill={text(tone)} fontWeight="600">
        7 / 10
      </text>
      <text x="210" y="306" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={muted(tone)} fontStyle="italic">
        bendita sois vós entre as mulheres
      </text>

      {/* Members avatars */}
      <text x="32" y="402" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.8">
        REZANDO AGORA
      </text>
      {[
        { x: 32, l: 'M', c: '#8B2435' },
        { x: 70, l: 'J', c: '#C9A84C' },
        { x: 108, l: 'A', c: '#7A4C82' },
        { x: 146, l: 'P', c: '#3B7A57' },
        { x: 184, l: 'C', c: '#8B2435' },
        { x: 222, l: 'R', c: '#C9A84C' },
        { x: 260, l: 'L', c: '#7A4C82' },
      ].map((m, i) => (
        <g key={i}>
          <circle cx={m.x + 14} cy="428" r="14" fill={m.c} fillOpacity="0.85" stroke={bg(tone)} strokeWidth="2" />
          <text
            x={m.x + 14}
            y="433"
            textAnchor="middle"
            fontFamily="Cinzel, serif"
            fontSize="11"
            fill="#fff"
            fontWeight="600"
          >
            {m.l}
          </text>
        </g>
      ))}

      {/* Code box */}
      <rect x="24" y="464" width="372" height="38" rx="10" fill={soft(tone)} stroke={GOLD} strokeOpacity="0.5" />
      <text x="40" y="484" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="2">
        CÓDIGO DA SALA
      </text>
      <text x="380" y="488" textAnchor="end" fontFamily="Cinzel, serif" fontSize="14" fill={GOLD} letterSpacing="3" fontWeight="600">
        AVE-934
      </text>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   3. MODO DEBATE — chat com IA + scorecard
   ────────────────────────────────────────────────────────────────────────── */
export function DebateMockup({ tone = 'dark', className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      {/* Header */}
      <text x="24" y="44" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2.5">
        TEMA · SOLA SCRIPTURA
      </text>
      <text x="24" y="68" fontFamily="Cormorant Garamond, serif" fontSize="18" fill={text(tone)} fontWeight="600">
        IA protestante questiona
      </text>

      {/* AI message */}
      <rect x="24" y="92" width="288" height="92" rx="14" fill={tone === 'dark' ? 'rgba(139,49,69,0.18)' : 'rgba(139,36,53,0.10)'} stroke={WINE} strokeOpacity="0.5" />
      <circle cx="44" cy="116" r="10" fill={WINE} />
      <text x="44" y="120" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="10" fill="#fff" fontWeight="600">
        P
      </text>
      <text x="62" y="118" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.6">
        IA · PROTESTANTE
      </text>
      <text x="42" y="142" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={text(tone)}>
        &ldquo;A Escritura sozinha basta. Onde
      </text>
      <text x="42" y="158" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={text(tone)}>
        a Bíblia ensina a tradição como
      </text>
      <text x="42" y="174" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={text(tone)}>
        regra da fé?&rdquo;
      </text>

      {/* User message */}
      <rect x="108" y="200" width="288" height="92" rx="14" fill={soft(tone)} stroke={GOLD} strokeOpacity="0.5" />
      <circle cx="376" cy="224" r="10" fill={GOLD} />
      <text x="376" y="228" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="10" fill="#1C140C" fontWeight="600">
        V
      </text>
      <text x="358" y="226" textAnchor="end" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.6">
        VOCÊ
      </text>
      <text x="126" y="250" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={text(tone)}>
        2 Ts 2,15: &ldquo;mantende as tradições
      </text>
      <text x="126" y="266" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={text(tone)}>
        que recebestes, seja por palavra,
      </text>
      <text x="126" y="282" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={text(tone)}>
        seja por carta&rdquo;…
      </text>

      {/* Scorecard */}
      <rect x="24" y="312" width="372" height="170" rx="14" fill={tone === 'dark' ? 'rgba(255,255,255,0.025)' : '#FBF6EC'} stroke={line(tone)} />
      <text x="40" y="338" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2">
        AVALIAÇÃO DESTA RODADA
      </text>

      {[
        { label: 'Bíblico', score: 3, y: 360 },
        { label: 'Magistério', score: 2, y: 396 },
        { label: 'Caridade', score: 3, y: 432 },
      ].map(row => (
        <g key={row.label}>
          <text x="40" y={row.y + 14} fontFamily="Cormorant Garamond, serif" fontSize="13" fill={text(tone)} fontWeight="600">
            {row.label}
          </text>
          {[0, 1, 2].map(i => (
            <circle
              key={i}
              cx={200 + i * 24}
              cy={row.y + 10}
              r="8"
              fill={i < row.score ? GOLD : 'transparent'}
              stroke={GOLD}
              strokeOpacity={i < row.score ? 1 : 0.4}
              strokeWidth="1.3"
            />
          ))}
          <text x="360" y={row.y + 14} textAnchor="end" fontFamily="Cinzel, serif" fontSize="11" fill={text(tone)} fontWeight="600">
            {row.score}/3
          </text>
        </g>
      ))}

      <text x="40" y="468" fontFamily="Cormorant Garamond, serif" fontSize="12" fill={muted(tone)} fontStyle="italic">
        Bom uso do verso — desenvolva o Magistério.
      </text>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   4. GRUPO DE ESTUDOS — dashboard do grupo
   ────────────────────────────────────────────────────────────────────────── */
export function GrupoMockup({ tone = 'light', className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      {/* Header */}
      <text x="24" y="44" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2.5">
        GRUPO · 6 MEMBROS
      </text>
      <text x="24" y="72" fontFamily="Cormorant Garamond, serif" fontSize="22" fill={text(tone)} fontWeight="600">
        Patrística aos sábados
      </text>
      <text x="24" y="92" fontFamily="Poppins, sans-serif" fontSize="11" fill={muted(tone)}>
        Meta semanal: 3 lições por pessoa
      </text>

      {/* Weekly progress */}
      <rect x="24" y="116" width="372" height="78" rx="14" fill={soft(tone)} stroke={GOLD} strokeOpacity="0.5" />
      <text x="40" y="138" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="1.8">
        ESTA SEMANA
      </text>
      <text x="40" y="170" fontFamily="Cinzel, serif" fontSize="28" fill={text(tone)} fontWeight="600">
        14
      </text>
      <text x="86" y="170" fontFamily="Cormorant Garamond, serif" fontSize="14" fill={muted(tone)}>
        de 18 lições
      </text>
      <rect x="40" y="180" width="340" height="6" rx="3" fill={line(tone)} />
      <rect x="40" y="180" width={Math.round(340 * (14 / 18))} height="6" rx="3" fill={GOLD} />

      {/* Members list */}
      <text x="24" y="226" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.8">
        EM DIA
      </text>
      {[
        { name: 'Maria S.', dots: 3, c: '#8B2435' },
        { name: 'João P.', dots: 3, c: '#C9A84C' },
        { name: 'Ana L.', dots: 2, c: '#7A4C82' },
        { name: 'Pedro V.', dots: 3, c: '#3B7A57' },
        { name: 'Clara M.', dots: 1, c: '#8B2435' },
      ].map((m, i) => (
        <g key={i}>
          <rect
            x="24"
            y={244 + i * 46}
            width="372"
            height="38"
            rx="10"
            fill={tone === 'dark' ? 'rgba(255,255,255,0.025)' : '#FBF6EC'}
            stroke={line(tone)}
          />
          <circle cx="50" cy={263 + i * 46} r="13" fill={m.c} fillOpacity="0.85" />
          <text
            x="50"
            y={268 + i * 46}
            textAnchor="middle"
            fontFamily="Cinzel, serif"
            fontSize="11"
            fill="#fff"
            fontWeight="600"
          >
            {m.name[0]}
          </text>
          <text x="74" y={269 + i * 46} fontFamily="Cormorant Garamond, serif" fontSize="13" fill={text(tone)} fontWeight="600">
            {m.name}
          </text>
          {[0, 1, 2].map(d => (
            <circle
              key={d}
              cx={328 + d * 18}
              cy={263 + i * 46}
              r="5"
              fill={d < m.dots ? GOLD : 'transparent'}
              stroke={GOLD}
              strokeOpacity={d < m.dots ? 1 : 0.4}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

