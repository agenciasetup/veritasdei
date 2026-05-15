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
   HERO — mini "phone" mostrando a dashboard do Educa
   ────────────────────────────────────────────────────────────────────────── */
export function HeroDashboardMockup({ className = '' }: MockupProps) {
  const tone: Tone = 'dark'
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

      {/* Eyebrow */}
      <text x="32" y="76" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2.5">
        BOM DIA
      </text>
      <text x="32" y="102" fontFamily="Cormorant Garamond, serif" fontSize="22" fill={text(tone)} fontWeight="600">
        Continue de onde parou
      </text>

      {/* Continue card */}
      <rect
        x="24"
        y="124"
        width="312"
        height="120"
        rx="18"
        fill="url(#heroContinueGrad)"
        stroke={GOLD}
        strokeOpacity="0.5"
      />
      <text x="44" y="156" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2">
        TRILHA · MAGISTÉRIO
      </text>
      <text x="44" y="186" fontFamily="Cormorant Garamond, serif" fontSize="20" fill="#F2EDE4" fontWeight="600">
        Concílio de Trento
      </text>
      <text x="44" y="204" fontFamily="Cormorant Garamond, serif" fontSize="13" fill="rgba(242,237,228,0.6)">
        Lição 4 de 12 — 32 min restantes
      </text>
      {/* Progress bar */}
      <rect x="44" y="218" width="270" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
      <rect x="44" y="218" width="92" height="6" rx="3" fill={GOLD} />

      {/* Row: Hoje + Sequência */}
      <rect x="24" y="262" width="148" height="84" rx="14" fill="rgba(255,255,255,0.04)" stroke={line(tone)} />
      <text x="40" y="288" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2">
        ✦ MISSÃO HOJE
      </text>
      <text x="40" y="312" fontFamily="Cormorant Garamond, serif" fontSize="16" fill={text(tone)} fontWeight="600">
        Reze o terço
      </text>
      <text x="40" y="330" fontFamily="Poppins, sans-serif" fontSize="10" fill={muted(tone)}>
        +120 XP
      </text>

      <rect x="188" y="262" width="148" height="84" rx="14" fill="rgba(255,255,255,0.04)" stroke={line(tone)} />
      <text x="204" y="288" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2">
        SEQUÊNCIA
      </text>
      <text x="204" y="318" fontFamily="Cinzel, serif" fontSize="26" fill={text(tone)} fontWeight="600">
        14
      </text>
      <text x="234" y="318" fontFamily="Poppins, sans-serif" fontSize="10" fill={muted(tone)}>
        dias
      </text>
      {/* mini flame */}
      <path
        d="M270 308 Q278 296 274 286 Q286 296 286 312 Q286 324 276 326 Q266 324 266 314 Q266 312 270 308 Z"
        fill={GOLD}
        fillOpacity="0.85"
      />

      {/* Pilares */}
      <text x="32" y="376" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="2">
        ESTUDAR
      </text>
      {[
        { x: 24, label: 'Bíblia' },
        { x: 128, label: 'Magistério' },
        { x: 232, label: 'Patrística' },
      ].map((p, i) => (
        <g key={p.label}>
          <rect
            x={p.x}
            y="388"
            width="104"
            height="104"
            rx="14"
            fill={i === 1 ? 'rgba(201,168,76,0.10)' : 'rgba(255,255,255,0.04)'}
            stroke={i === 1 ? GOLD : line(tone)}
            strokeOpacity={i === 1 ? 0.5 : 1}
          />
          {/* book icon */}
          <path
            d={`M${p.x + 36} 414 L${p.x + 36} 446 Q${p.x + 36} 442 ${p.x + 52} 442 L${p.x + 68} 442 Q${p.x + 68} 442 ${p.x + 68} 414 Q${p.x + 68} 416 ${p.x + 52} 418 Q${p.x + 36} 416 ${p.x + 36} 414 Z`}
            fill="none"
            stroke={GOLD}
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
          <text
            x={p.x + 52}
            y="476"
            textAnchor="middle"
            fontFamily="Cormorant Garamond, serif"
            fontSize="13"
            fill={text(tone)}
            fontWeight="600"
          >
            {p.label}
          </text>
        </g>
      ))}

      {/* Cartas strip */}
      <text x="32" y="524" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="2">
        SUAS CARTAS
      </text>
      {[
        { x: 24, name: 'Tomás' },
        { x: 104, name: 'Agostinho' },
        { x: 184, name: 'Teresa' },
        { x: 264, name: 'Pio X' },
      ].map((c, i) => (
        <g key={c.name} transform={`rotate(${(i - 1.5) * 1.2} ${c.x + 36} 580)`}>
          <rect
            x={c.x}
            y="540"
            width="72"
            height="92"
            rx="8"
            fill={i === 0 ? '#1C1610' : 'rgba(255,255,255,0.03)'}
            stroke={GOLD}
            strokeOpacity={i === 0 ? 0.7 : 0.25}
          />
          <circle cx={c.x + 36} cy="568" r="14" fill="none" stroke={GOLD} strokeOpacity="0.6" />
          <path
            d={`M${c.x + 36} 558 L${c.x + 36} 578 M${c.x + 28} 568 L${c.x + 44} 568`}
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          <text
            x={c.x + 36}
            y="608"
            textAnchor="middle"
            fontFamily="Cinzel, serif"
            fontSize="8"
            fill={muted(tone)}
            letterSpacing="0.5"
          >
            {c.name.toUpperCase()}
          </text>
        </g>
      ))}

      {/* Bottom nav */}
      <rect x="24" y="660" width="312" height="44" rx="22" fill="rgba(255,255,255,0.04)" stroke={line(tone)} />
      {['Hoje', 'Estudar', 'Comunidade', 'Perfil'].map((label, i) => (
        <text
          key={label}
          x={48 + i * 80}
          y="688"
          fontFamily="Poppins, sans-serif"
          fontSize="10"
          fill={i === 0 ? GOLD : muted(tone)}
        >
          {label}
        </text>
      ))}

      <defs>
        <linearGradient id="heroContinueGrad" x1="0" y1="0" x2="312" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(107,29,42,0.45)" />
          <stop offset="100%" stopColor="rgba(22,18,14,0.95)" />
        </linearGradient>
      </defs>
    </svg>
  )
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
        Debate com IA reformista
      </text>

      {/* AI message */}
      <rect x="24" y="92" width="288" height="92" rx="14" fill={tone === 'dark' ? 'rgba(139,49,69,0.18)' : 'rgba(139,36,53,0.10)'} stroke={WINE} strokeOpacity="0.5" />
      <circle cx="44" cy="116" r="10" fill={WINE} />
      <text x="44" y="120" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="10" fill="#fff" fontWeight="600">
        R
      </text>
      <text x="62" y="118" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="1.6">
        REFORMADOR · IA
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

/* ──────────────────────────────────────────────────────────────────────────
   5. CARTAS — três cartas santo empilhadas
   ────────────────────────────────────────────────────────────────────────── */
export function CartasMockup({ tone = 'dark', className = '' }: MockupProps) {
  return (
    <svg viewBox="0 0 420 520" className={className} aria-hidden>
      <rect x="0" y="0" width="420" height="520" rx="22" fill={bg(tone)} />
      <rect x="0" y="0" width="420" height="520" rx="22" fill="none" stroke={GOLD} strokeOpacity="0.35" />

      <text x="210" y="44" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="10" fill={GOLD} letterSpacing="2.5">
        CÓDEX · 47 CARTAS
      </text>
      <text x="210" y="72" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="20" fill={text(tone)} fontWeight="600">
        Sua coleção cresce
      </text>

      {/* Back card */}
      <g transform="rotate(-8 130 270)">
        <rect x="40" y="116" width="180" height="280" rx="14" fill={tone === 'dark' ? '#1C1610' : '#FFF7E5'} stroke={GOLD} strokeOpacity="0.45" />
        <text x="130" y="146" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill={muted(tone)} letterSpacing="1.8">
          DOUTOR DA IGREJA
        </text>
        <circle cx="130" cy="220" r="42" fill="none" stroke={GOLD} strokeOpacity="0.55" />
        <path d="M130 184 L130 256 M94 220 L166 220" stroke={GOLD} strokeOpacity="0.6" strokeWidth="1.4" />
        <circle cx="130" cy="220" r="6" fill={WINE} stroke={GOLD} />
        <text x="130" y="298" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="16" fill={text(tone)} fontWeight="600">
          Santo Tomás
        </text>
        <text x="130" y="316" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill={muted(tone)} fontStyle="italic">
          de Aquino
        </text>
        <text x="130" y="346" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill={GOLD} letterSpacing="1.6">
          ◆ ÉPICA ◆
        </text>
        <line x1="80" y1="358" x2="180" y2="358" stroke={GOLD} strokeOpacity="0.45" />
        <text x="130" y="380" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill={muted(tone)}>
          1225 — 1274
        </text>
      </g>

      {/* Right back card */}
      <g transform="rotate(7 290 280)">
        <rect x="200" y="124" width="180" height="280" rx="14" fill={tone === 'dark' ? '#1C1610' : '#FFF7E5'} stroke={GOLD} strokeOpacity="0.4" />
        <text x="290" y="154" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill={muted(tone)} letterSpacing="1.8">
          MÍSTICA
        </text>
        <circle cx="290" cy="226" r="42" fill="none" stroke={GOLD} strokeOpacity="0.55" />
        <path d="M290 190 L290 262" stroke={GOLD} strokeOpacity="0.6" strokeWidth="1.4" />
        <path d="M270 220 Q290 200 310 220 Q290 240 270 220" fill="none" stroke={GOLD} strokeOpacity="0.6" />
        <text x="290" y="306" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="16" fill={text(tone)} fontWeight="600">
          Santa Teresa
        </text>
        <text x="290" y="324" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill={muted(tone)} fontStyle="italic">
          de Ávila
        </text>
        <text x="290" y="354" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill={GOLD} letterSpacing="1.6">
          ◆ RARA ◆
        </text>
      </g>

      {/* Top center card (highlighted) */}
      <g>
        <rect
          x="120"
          y="96"
          width="180"
          height="320"
          rx="14"
          fill="url(#cartaCenterGrad)"
          stroke={GOLD}
          strokeWidth="1.8"
        />
        <text x="210" y="128" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2">
          PADRE DA IGREJA
        </text>
        <circle cx="210" cy="220" r="56" fill="none" stroke={GOLD} strokeOpacity="0.85" strokeWidth="1.5" />
        <circle cx="210" cy="220" r="44" fill="none" stroke={GOLD} strokeOpacity="0.4" />
        <path d="M210 168 L210 272 M158 220 L262 220" stroke={GOLD} strokeWidth="1.6" />
        <circle cx="210" cy="220" r="10" fill={WINE} stroke={GOLD} strokeWidth="1.2" />
        <text x="210" y="310" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="20" fill="#F2EDE4" fontWeight="700">
          Santo Agostinho
        </text>
        <text x="210" y="332" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="12" fill="#E6D9B5" fontStyle="italic">
          de Hipona
        </text>
        <text x="210" y="362" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="9" fill={GOLD} letterSpacing="2">
          ◆ LENDÁRIA ◆
        </text>
        <line x1="150" y1="376" x2="270" y2="376" stroke={GOLD} strokeOpacity="0.65" />
        <text x="210" y="398" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill="#E6D9B5">
          354 — 430 d.C.
        </text>
      </g>

      {/* Just unlocked badge */}
      <g transform="translate(330 100)">
        <circle r="28" fill={GOLD} />
        <text y="3" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill="#1C140C" fontWeight="700" letterSpacing="1.2">
          NOVA
        </text>
        <text y="15" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="6" fill="#1C140C" letterSpacing="1">
          DESBLOQUEADA
        </text>
      </g>

      <text x="210" y="464" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="9" fill={muted(tone)} letterSpacing="2">
        47 DE 312 NA SUA COLEÇÃO
      </text>
      <rect x="60" y="478" width="300" height="6" rx="3" fill={line(tone)} />
      <rect x="60" y="478" width={Math.round(300 * (47 / 312))} height="6" rx="3" fill={GOLD} />

      <defs>
        <linearGradient id="cartaCenterGrad" x1="120" y1="96" x2="300" y2="416" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1F1810" />
          <stop offset="100%" stopColor="#0F0E0C" />
        </linearGradient>
      </defs>
    </svg>
  )
}
