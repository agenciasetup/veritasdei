interface EyebrowTagProps {
  children: React.ReactNode
  tone?: 'dark' | 'light' | 'gold'
  className?: string
}

export function EyebrowTag({ children, tone = 'dark', className = '' }: EyebrowTagProps) {
  const toneClass =
    tone === 'light' ? 'tag-light' : tone === 'gold' ? 'tag-dark' : 'tag-dark'

  return (
    <span
      className={`eyebrow-label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 ${toneClass} ${className}`}
    >
      <span className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}
