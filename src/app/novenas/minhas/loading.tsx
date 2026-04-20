export default function MinhasNovenasLoading() {
  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <div className="skeleton h-9 w-56 mx-auto mb-2 rounded" />
          <div className="skeleton h-4 w-36 mx-auto rounded" />
        </header>

        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(20, 18, 14, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.18)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="skeleton h-6 w-48 mb-2 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
              <div className="flex gap-1.5 mt-3">
                {Array.from({ length: 9 }, (_, j) => (
                  <div key={j} className="h-1.5 flex-1 rounded-full skeleton" />
                ))}
              </div>
              <div className="skeleton h-3 w-44 mt-2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
