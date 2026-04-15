/**
 * SVG ornaments used as floating/decorative pieces in the landing.
 * All purely decorative (aria-hidden).
 */

interface Svg {
  className?: string
  color?: string
  opacity?: number
}

export function GothicCross({ className = '', color = '#C9A84C', opacity = 0.8 }: Svg) {
  return (
    <svg
      viewBox="0 0 80 120"
      fill="none"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <linearGradient id="crossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <g stroke="url(#crossGrad)" strokeWidth="1.2" fill="none">
        <path d="M40 6 L40 110" />
        <path d="M14 40 L66 40" />
        <path d="M32 6 L48 6" />
        <path d="M32 110 L48 110" />
        <path d="M14 32 L14 48" />
        <path d="M66 32 L66 48" />
        <circle cx="40" cy="40" r="5" />
        <circle cx="40" cy="40" r="1.5" fill={color} />
        <path d="M40 52 L40 72" strokeDasharray="1 3" opacity="0.5" />
      </g>
    </svg>
  )
}

export function QuatrefoilOrnament({ className = '', color = '#C9A84C', opacity = 0.7 }: Svg) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <g stroke={color} strokeWidth="1" fill="none">
        <circle cx="60" cy="30" r="22" />
        <circle cx="60" cy="90" r="22" />
        <circle cx="30" cy="60" r="22" />
        <circle cx="90" cy="60" r="22" />
        <circle cx="60" cy="60" r="8" />
        <circle cx="60" cy="60" r="2" fill={color} />
      </g>
    </svg>
  )
}

export function ArchOrnament({ className = '', color = '#C9A84C', opacity = 0.5 }: Svg) {
  return (
    <svg viewBox="0 0 200 280" fill="none" className={className} aria-hidden style={{ opacity }}>
      <g stroke={color} strokeWidth="1" fill="none">
        <path d="M20 280 L20 120 Q20 20 100 20 Q180 20 180 120 L180 280" />
        <path d="M40 280 L40 130 Q40 40 100 40 Q160 40 160 130 L160 280" />
        <path d="M60 280 L60 140 Q60 60 100 60 Q140 60 140 140 L140 280" />
        <path d="M100 20 L100 80" />
        <circle cx="100" cy="90" r="10" />
        <path d="M100 100 L100 140" />
      </g>
    </svg>
  )
}

/**
 * PapalKeys — Brasão das Chaves de São Pedro com a Tiara Pontifícia (Triregnum).
 *
 * Símbolo do munus petrino: as duas chaves cruzadas em sautor representam
 * o poder de "ligar e desligar" (Mt 16,19) — o céu e a terra, o juízo
 * e a misericórdia. A tiara papal de três coroas (sacerdote, pastor, mestre)
 * encima as chaves, unidas por um cordão (umbilicus) de dois nós.
 *
 * Desenho line-art em traço único pra harmonizar com os demais ornamentos.
 */
export function PapalKeys({ className = '', color = '#C9A84C', opacity = 0.5 }: Svg) {
  return (
    <svg
      viewBox="0 0 280 420"
      fill="none"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <linearGradient id="papalKeysGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="45%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#papalKeysGrad)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ─────────── TRIREGNUM (Tiara Papal) ─────────── */}
        {/* Cruz que coroa a tiara */}
        <path d="M140 6 L140 30" />
        <path d="M130 16 L150 16" />

        {/* Globus cruciger (orbe) sob a cruz */}
        <circle cx="140" cy="38" r="3.5" />
        <path d="M136.5 38 L143.5 38" />

        {/* Coroa superior (mais estreita) */}
        <path d="M120 50 Q140 44 160 50 L158 64 L122 64 Z" />
        <path d="M120 50 L160 50" />
        <circle cx="130" cy="56" r="1.1" fill={color} />
        <circle cx="140" cy="55" r="1.1" fill={color} />
        <circle cx="150" cy="56" r="1.1" fill={color} />

        {/* Coroa do meio */}
        <path d="M112 68 Q140 62 168 68 L166 84 L114 84 Z" />
        <path d="M112 68 L168 68" />
        <circle cx="124" cy="76" r="1.1" fill={color} />
        <circle cx="135" cy="75" r="1.1" fill={color} />
        <circle cx="145" cy="75" r="1.1" fill={color} />
        <circle cx="156" cy="76" r="1.1" fill={color} />

        {/* Coroa da base (mais larga) */}
        <path d="M104 88 Q140 80 176 88 L174 110 L106 110 Z" />
        <path d="M104 88 L176 88" />
        <circle cx="116" cy="98" r="1.1" fill={color} />
        <circle cx="128" cy="97" r="1.1" fill={color} />
        <circle cx="140" cy="96" r="1.1" fill={color} />
        <circle cx="152" cy="97" r="1.1" fill={color} />
        <circle cx="164" cy="98" r="1.1" fill={color} />

        {/* Infulae — duas fitas pendentes da base da tiara */}
        <path d="M118 110 Q110 134 116 158 Q120 178 114 200" />
        <path d="M162 110 Q170 134 164 158 Q160 178 166 200" />
        {/* Franjas das fitas */}
        <path d="M108 200 L120 200" />
        <path d="M160 200 L172 200" />
        <path d="M111 203 L113 209" />
        <path d="M115 203 L117 209" />
        <path d="M163 203 L165 209" />
        <path d="M167 203 L169 209" />

        {/* ─────────── CHAVES CRUZADAS EM SAUTOR ─────────── */}
        {/* Cruzamento exato em (140, 280) */}

        {/* ── Haste da chave esquerda (ouro): bow inferior-esquerdo → palhetão superior-direito ── */}
        <path d="M70 380 L210 180" />

        {/* ── Haste da chave direita (prata): bow inferior-direito → palhetão superior-esquerdo ── */}
        <path d="M210 380 L70 180" />

        {/* ── Bow (anel/cabeça) da chave esquerda ── */}
        <circle cx="62" cy="388" r="16" />
        <circle cx="62" cy="388" r="9" />
        {/* Quatrefólio interno do bow */}
        <circle cx="62" cy="380" r="2.4" />
        <circle cx="62" cy="396" r="2.4" />
        <circle cx="54" cy="388" r="2.4" />
        <circle cx="70" cy="388" r="2.4" />
        {/* Centro do bow */}
        <circle cx="62" cy="388" r="0.8" fill={color} />

        {/* ── Bow da chave direita ── */}
        <circle cx="218" cy="388" r="16" />
        <circle cx="218" cy="388" r="9" />
        <circle cx="218" cy="380" r="2.4" />
        <circle cx="218" cy="396" r="2.4" />
        <circle cx="210" cy="388" r="2.4" />
        <circle cx="226" cy="388" r="2.4" />
        <circle cx="218" cy="388" r="0.8" fill={color} />

        {/* ── Palhetão (bit) da chave esquerda — extremo superior direito ── */}
        <path d="M210 180 L226 168 L234 176 L228 184" />
        <path d="M218 174 L222 170" />
        <path d="M216 184 L222 188" />
        <path d="M204 186 L210 180" />

        {/* ── Palhetão da chave direita — extremo superior esquerdo ── */}
        <path d="M70 180 L54 168 L46 176 L52 184" />
        <path d="M62 174 L58 170" />
        <path d="M64 184 L58 188" />
        <path d="M76 186 L70 180" />

        {/* ─────────── UMBILICUS — Cordão que une as chaves ─────────── */}
        {/* Nó central no cruzamento */}
        <circle cx="140" cy="280" r="5" />
        <circle cx="140" cy="280" r="1.6" fill={color} />

        {/* Dois cordões descendentes */}
        <path d="M135 284 Q124 300 130 316 Q138 326 140 316" />
        <path d="M145 284 Q156 300 150 316 Q142 326 140 316" />

        {/* Borlas terminais (tassels) */}
        <path d="M126 316 L132 316" />
        <path d="M148 316 L154 316" />
        <path d="M128 318 L130 324" />
        <path d="M130 318 L132 324" />
        <path d="M150 318 L152 324" />
        <path d="M152 318 L154 324" />
        <path d="M129 322 L131 322" />
        <path d="M151 322 L153 322" />
      </g>
    </svg>
  )
}

export function FleurDeLis({ className = '', color = '#C9A84C', opacity = 0.9 }: Svg) {
  return (
    <svg viewBox="0 0 60 80" fill="none" className={className} aria-hidden style={{ opacity }}>
      <g stroke={color} strokeWidth="1.1" fill="none">
        <path d="M30 8 Q22 22 22 36 Q22 46 30 52 Q38 46 38 36 Q38 22 30 8 Z" />
        <path d="M30 52 L30 72" />
        <path d="M14 52 Q14 38 22 36" />
        <path d="M46 52 Q46 38 38 36" />
        <path d="M16 66 L44 66" />
        <circle cx="30" cy="36" r="1.5" fill={color} />
      </g>
    </svg>
  )
}
