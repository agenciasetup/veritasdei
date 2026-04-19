'use client'

export default function ProgressTrack({
  percent,
  label,
}: {
  percent: number
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(201,168,76,0.12)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${clamped}%`,
            background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
          }}
        />
      </div>
      {label ? (
        <span
          className="text-[10px] tracking-[0.15em] uppercase whitespace-nowrap"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}
