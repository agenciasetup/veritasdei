'use client'

import PedidosOracaoFeed from '@/app/pedidos-oracao/PedidosOracaoFeed'

export default function PedidosDoSantoSection({ santoId, santoNome }: { santoId: string; santoNome: string }) {
  return <PedidosOracaoFeed santoId={santoId} santoNome={santoNome} />
}
