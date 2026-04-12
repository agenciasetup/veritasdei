import { BadgeCheck } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  title?: string
}

/**
 * Visual badge for a verified church profile.
 * Rendered only when paroquias.verificado = true.
 */
export default function SeloVerificado({ size = 'md', showLabel = true, title }: Props) {
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16
  const fontSize = size === 'sm' ? '0.625rem' : size === 'lg' ? '0.75rem' : '0.6875rem'
  const padding  = size === 'sm' ? '2px 8px'   : size === 'lg' ? '5px 12px' : '3px 10px'

  return (
    <span
      title={title ?? 'Igreja verificada pelo time Veritas Dei'}
      className="inline-flex items-center gap-1 rounded-full whitespace-nowrap"
      style={{
        padding,
        background: 'rgba(201,168,76,0.12)',
        border: '1px solid rgba(201,168,76,0.35)',
        color: '#C9A84C',
        fontFamily: 'Poppins, sans-serif',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      <BadgeCheck size={iconSize} strokeWidth={2.25} />
      {showLabel && <span>Verificada</span>}
    </span>
  )
}
