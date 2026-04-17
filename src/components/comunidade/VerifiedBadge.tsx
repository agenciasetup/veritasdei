import { BadgeCheck } from 'lucide-react'

export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        color: '#E3C265',
        filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.4))',
      }}
      title="Verificado"
    >
      <BadgeCheck strokeWidth={2.2} style={{ width: size, height: size }} />
    </span>
  )
}
