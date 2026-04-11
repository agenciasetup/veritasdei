import CrossIcon from '@/components/icons/CrossIcon'

export default function Header() {
  return (
    <header className="w-full pt-10 pb-6 px-4 text-center relative z-10">
      {/* Gothic Cross */}
      <div className="flex justify-center mb-5">
        <CrossIcon size="lg" className="gothic-cross" />
      </div>

      {/* Title */}
      <h1
        className="text-4xl md:text-5xl font-bold tracking-widest uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        Veritas Dei
      </h1>

      {/* Ornamental divider */}
      <div className="flex items-center justify-center gap-4 mt-4 mb-2 max-w-xs mx-auto">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.3)]" />
        <span style={{ color: '#C9A84C', opacity: 0.5, fontSize: '0.75rem' }}>&#10022;</span>
        <span style={{ color: '#6B1D2A', opacity: 0.7, fontSize: '0.6rem' }}>&#9670;</span>
        <span style={{ color: '#C9A84C', opacity: 0.5, fontSize: '0.75rem' }}>&#10022;</span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.3)]" />
      </div>

      {/* Subtitle */}
      <p
        className="text-sm tracking-wider uppercase"
        style={{ fontFamily: 'Poppins, sans-serif', color: '#7A7368', letterSpacing: '0.15em' }}
      >
        O que a Igreja ensina — com as fontes
      </p>
    </header>
  )
}
