'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: '#0D0D0D' }}
    >
      <div
        className="text-4xl mb-3"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        Erro Inesperado
      </div>
      <p
        className="text-sm mb-6 max-w-md"
        style={{ fontFamily: 'Poppins, sans-serif', color: '#A89B8A' }}
      >
        Algo deu errado. Tente novamente ou volte para a página inicial.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid #C9A84C',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Tentar Novamente
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(58,42,16,0.5)',
            color: '#A89B8A',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Página Inicial
        </a>
      </div>
    </div>
  )
}
