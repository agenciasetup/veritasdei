export default function Loading() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--surface-1)' }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border-1)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  )
}
