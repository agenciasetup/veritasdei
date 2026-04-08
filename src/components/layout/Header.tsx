export default function Header() {
  return (
    <header className="w-full py-6 px-4 text-center">
      <div className="flex items-center justify-center gap-3">
        <svg
          width="28"
          height="36"
          viewBox="0 0 28 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="11" y="0" width="6" height="36" rx="1" fill="#5C2D0E" />
          <rect x="0" y="10" width="28" height="6" rx="1" fill="#5C2D0E" />
        </svg>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: 'Crimson Pro, serif', color: '#5C2D0E' }}
        >
          Veritas Dei
        </h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        O que a Igreja ensina — com as fontes.
      </p>
    </header>
  )
}
