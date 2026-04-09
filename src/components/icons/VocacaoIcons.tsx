// ═══════════════════════════════════════════════════════
// VERITAS DEI — Vocação SVG Icons
// Custom Catholic iconography for each vocation
// ═══════════════════════════════════════════════════════

interface IconProps {
  className?: string
  size?: number
}

/** Leigo — Praying hands */
export function LeigoIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C12 2 8 6 8 10C8 12 9.5 13.5 12 14C14.5 13.5 16 12 16 10C16 6 12 2 12 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M8.5 14.5L6 17.5C5.5 18.2 5.5 19 6 19.5L8 21.5"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M15.5 14.5L18 17.5C18.5 18.2 18.5 19 18 19.5L16 21.5"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M8 21.5H16"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="1" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

/** Catequista — Open book with cross */
export function CatequistaIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2 4C2 4 5 3 8 3C11 3 12 4.5 12 4.5C12 4.5 13 3 16 3C19 3 22 4 22 4V19C22 19 19 18 16 18C13 18 12 19.5 12 19.5C12 19.5 11 18 8 18C5 18 2 19 2 19V4Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 4.5V19.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 8L17 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 10H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Diácono — Dalmatic / stole diagonal */
export function DiaconoIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 9H16L18 22H6L8 9Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M15 9L9 22"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
      />
      <path d="M10 9V13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

/** Padre — Roman collar / clerical collar */
export function PadreIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 11C7 11 7 9 12 9C17 9 17 11 17 11V14C17 14 17 16 12 16C7 16 7 14 7 14V11Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="11" y="11" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.7" />
      <path
        d="M7 14L5 22H19L17 14"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

/** Bispo — Miter (bishop's hat) */
export function BispoIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L6 10H18L12 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M6 10L5 13H19L18 10"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 2V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M9.5 6H14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path
        d="M8 16C8 16 8 14 12 14C16 14 16 16 16 16V18C16 18 16 20 12 20C8 20 8 18 8 18V16Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="11" y="16" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

/** Cardeal — Galero (cardinal's hat) */
export function CardealIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="6" rx="4" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 6C6 7 4 8 3 10"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <path
        d="M16 6C18 7 20 8 21 10"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="3" cy="11" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="3" cy="13.5" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="21" cy="11" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="21" cy="13.5" r="1" fill="currentColor" opacity="0.6" />
      <path
        d="M8 16C8 16 8 14 12 14C16 14 16 16 16 16V19C16 19 16 21 12 21C8 21 8 19 8 19V16Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="11" y="16.5" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

/** Papa — Papal tiara (triple crown) */
export function PapaIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 12H16L17 14H7L8 12Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9 9H15L16 12H8L9 9Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M10 6H14L15 9H9L10 6Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="12" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 3V1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 1.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M8 17C8 17 8 15 12 15C16 15 16 17 16 17V19.5C16 19.5 16 21.5 12 21.5C8 21.5 8 19.5 8 19.5V17Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="11" y="17" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

/** Map vocação value to its icon component */
export const VOCACAO_ICONS: Record<string, React.ComponentType<IconProps>> = {
  leigo: LeigoIcon,
  catequista: CatequistaIcon,
  diacono: DiaconoIcon,
  padre: PadreIcon,
  bispo: BispoIcon,
  cardeal: CardealIcon,
  papa: PapaIcon,
}

/** Convenience: render icon by vocação key */
export function VocacaoIcon({ vocacao, className, size = 20 }: IconProps & { vocacao: string }) {
  const Icon = VOCACAO_ICONS[vocacao] ?? LeigoIcon
  return <Icon className={className} size={size} />
}
