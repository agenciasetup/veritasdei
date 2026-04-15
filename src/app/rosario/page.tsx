import { RosarySession } from '@/features/rosario/session/RosarySession'

export const metadata = {
  title: 'Santo Rosário — Veritas Dei',
  description: 'Reze o Santo Rosário interativo meditando os mistérios da vida de Cristo com Nossa Senhora.',
}

export default function RosarioPage() {
  return <RosarySession />
}
