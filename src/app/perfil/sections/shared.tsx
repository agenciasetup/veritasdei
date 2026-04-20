'use client'

/**
 * Helpers reutilizados entre as seções do Perfil. Antes inlined em
 * `perfil/page.tsx` (que ultrapassava 1600 linhas).
 */

export function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType
  title: string
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-1)' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
      </div>
      <h2
        className="text-lg font-bold tracking-wider uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
      >
        {title}
      </h2>
    </div>
  )
}

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-3)' }}
          >
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 touch-target-lg"
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid var(--border-1)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            paddingLeft: icon ? '2.5rem' : undefined,
          }}
        />
      </div>
    </div>
  )
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 touch-target-lg"
        style={{
          background: 'var(--surface-inset)',
          border: '1px solid var(--border-1)',
          color: 'var(--text-1)',
          fontFamily: 'var(--font-body)',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0A0A0A' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
