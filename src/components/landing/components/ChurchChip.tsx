import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface ChurchChipProps {
  href: string
  label: string
  meta: string
  tone?: 'dark' | 'light'
}

export function ChurchChip({ href, label, meta, tone = 'dark' }: ChurchChipProps) {
  return (
    <Link
      href={href}
      className={tone === 'dark' ? 'church-chip' : 'church-chip-light'}
      title={label}
    >
      <MapPin
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: tone === 'dark' ? '#C9A84C' : '#5A1625' }}
      />
      <span className="truncate max-w-[18ch] sm:max-w-[28ch]">{label}</span>
      <span
        className="flex-shrink-0 font-semibold"
        style={{ color: tone === 'dark' ? '#D9C077' : '#5A1625' }}
      >
        {meta}
      </span>
    </Link>
  )
}
