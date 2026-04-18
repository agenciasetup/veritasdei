import type { Metadata } from 'next'

import PrayerLibraryView from '@/features/prayers/PrayerLibraryView'

export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.veritasdei.com.br'

export const metadata: Metadata = {
  title: 'Orações · Veritas Dei',
  description:
    'Biblioteca de orações católicas tradicionais — essenciais, dia a dia, Missa e ocasiões — em português e latim.',
  alternates: { canonical: '/oracoes' },
  openGraph: {
    type: 'website',
    title: 'Orações · Veritas Dei',
    description:
      'Para cada momento da vida cristã — orações tradicionais em português e latim.',
    url: `${SITE}/oracoes`,
    siteName: 'Veritas Dei',
    locale: 'pt_BR',
  },
}

export default function OracoesPage() {
  return <PrayerLibraryView />
}
