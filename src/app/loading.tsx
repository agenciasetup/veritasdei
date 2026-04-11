export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0D0D0D' }}>
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
      />
    </div>
  )
}
