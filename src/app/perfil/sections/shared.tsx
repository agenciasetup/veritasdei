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
        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
      </div>
      <h2
        className="text-lg font-bold tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
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
        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#7A7368' }}
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
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
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
        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 touch-target-lg"
        style={{
          background: 'rgba(10,10,10,0.6)',
          border: '1px solid rgba(201,168,76,0.12)',
          color: '#F2EDE4',
          fontFamily: 'Poppins, sans-serif',
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
