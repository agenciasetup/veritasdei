import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: '#0D0D0D' }}
    >
      <div
        className="text-6xl mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        404
      </div>
      <div
        className="text-lg mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        Página não encontrada
      </div>
      <p
        className="text-sm mb-6 max-w-md"
        style={{ fontFamily: 'Poppins, sans-serif', color: '#A89B8A' }}
      >
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid #C9A84C',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        Voltar ao Início
      </Link>
    </div>
  )
}
