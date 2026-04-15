import { ChevronDown } from 'lucide-react'

interface ScrollCueProps {
  label?: string
  className?: string
}

export function ScrollCue({ label = 'descer', className = '' }: ScrollCueProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 scroll-cue ${className}`}
      aria-hidden
    >
      <span
        className="text-[10px] uppercase tracking-[0.32em]"
        style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'Cinzel, serif' }}
      >
        {label}
      </span>
      <div
        className="w-px h-9"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.6))',
        }}
      />
      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.75)' }} />
    </div>
  )
}
