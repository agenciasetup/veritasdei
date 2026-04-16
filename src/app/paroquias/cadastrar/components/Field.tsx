'use client'

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  invalid?: boolean
  required?: boolean
  autoFocus?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'url'
  type?: string
}

/**
 * Input field padrão do wizard, com indicador de erro e suporte a
 * autoFocus / inputMode mobile-friendly.
 */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  invalid,
  required,
  autoFocus,
  inputMode = 'text',
  type = 'text',
}: FieldProps) {
  return (
    <div>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoFocus={autoFocus}
        className="w-full px-4 py-3 rounded-xl text-sm touch-target-lg"
        style={{
          background: 'rgba(10,10,10,0.6)',
          border: invalid
            ? '1px solid rgba(217,79,92,0.6)'
            : '1px solid rgba(201,168,76,0.12)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          outline: 'none',
        }}
      />
    </div>
  )
}
