'use client'

interface SantoCoverFallbackProps {
  nome: string
  invocacao?: string | null
  className?: string
  fullName?: boolean
}

export default function SantoCoverFallback({
  nome,
  invocacao,
  className = '',
  fullName = false,
}: SantoCoverFallbackProps) {
  const displayName = fullName ? nome : nome.replace(/^(São|Santa|Santo|Beato|Beata)\s+/i, '')
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.28) 0%, transparent 55%), linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(60,30,10,0.65) 55%, rgba(10,10,10,0.85) 100%)',
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <div
          style={{
            fontFamily: 'Cinzel, Georgia, serif',
            color: '#F2EDE4',
            fontSize: 'clamp(1.25rem, 4vw, 2rem)',
            fontWeight: 600,
            letterSpacing: '0.03em',
            lineHeight: 1.15,
            textShadow: '0 2px 8px rgba(0,0,0,0.55)',
          }}
        >
          {displayName}
        </div>
        {invocacao && (
          <div
            className="mt-2"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: 'rgba(242,237,228,0.72)',
              fontSize: 'clamp(0.72rem, 2vw, 0.9rem)',
              fontStyle: 'italic',
              letterSpacing: '0.02em',
              textShadow: '0 1px 4px rgba(0,0,0,0.45)',
            }}
          >
            «{invocacao}»
          </div>
        )}
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,10,0.55), transparent)',
        }}
      />
    </div>
  )
}
