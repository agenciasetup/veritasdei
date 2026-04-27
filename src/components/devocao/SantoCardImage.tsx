'use client'

import { useState } from 'react'
import SantoCoverFallback from './SantoCoverFallback'

interface Props {
  imagemUrl: string | null
  nome: string
  invocacao: string | null
  eager?: boolean
}

export default function SantoCardImage({ imagemUrl, nome, invocacao, eager = false }: Props) {
  const [errored, setErrored] = useState(false)

  if (!imagemUrl || errored) {
    return <SantoCoverFallback nome={nome} invocacao={invocacao} />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imagemUrl}
      alt={nome}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setErrored(true)}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
    />
  )
}
