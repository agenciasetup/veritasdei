import type { Metadata } from 'next'
import Verbum from '@/verbum'

export const metadata: Metadata = {
  title: 'Verbum — Mappa Fidei | Veritas Dei',
  description: 'Grafo de conhecimento teológico católico. In principio erat Verbum — Jo 1:1',
}

export default function VerbumPage() {
  return <Verbum />
}
