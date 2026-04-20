export default function NovenaProgressoLoading() {
  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        {/* Header skeleton */}
        <div className="mb-6 text-center">
          <div className="skeleton h-4 w-32 mx-auto mb-3 rounded" />
          <div className="skeleton h-8 w-48 mx-auto mb-3 rounded" />
          <div className="ornament-divider max-w-xs mx-auto mt-3">
            <span>&#10022;</span>
          </div>
        </div>

        {/* Progress dots skeleton */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full skeleton"
            />
          ))}
        </div>

        {/* Prayer card skeleton */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            background: 'rgba(20, 18, 14, 0.6)',
            border: '1px solid rgba(201, 168, 76, 0.18)',
          }}
        >
          <div className="skeleton h-6 w-2/3 mb-4 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        </div>

        {/* Button skeleton */}
        <div className="flex justify-center mt-6">
          <div className="skeleton h-12 w-48 rounded-lg" />
        </div>
      </div>
    </main>
  )
}
