export default function VerbumCanvasLoading() {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-screen gap-3"
      style={{ background: 'var(--surface-1)' }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border-1)', borderTopColor: 'var(--accent)' }}
      />
      <span
        className="text-xs tracking-widest uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-3)' }}
      >
        Carregando Verbum...
      </span>
    </div>
  )
}
