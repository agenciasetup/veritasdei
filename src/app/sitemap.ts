import type { MetadataRoute } from 'next'

import { fetchLibraryTree } from '@/features/prayers/queries'

/**
 * Sitemap dinâmico. Por enquanto foca na biblioteca de Orações —
 * futuras entregas podem estender para Liturgia, Aprender, etc.
 *
 * Next 16: exportação default é o handler da rota /sitemap.xml.
 */

const SITE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.veritasdei.com.br'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE}/orar`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/oracoes`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]

  let prayerRoutes: MetadataRoute.Sitemap = []
  try {
    const tree = await fetchLibraryTree()
    const topicRoutes: MetadataRoute.Sitemap = tree.map((t) => ({
      url: `${SITE}/oracoes/categoria/${t.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    }))
    const itemRoutes: MetadataRoute.Sitemap = tree.flatMap((t) =>
      t.subtopics.flatMap((s) =>
        s.items.map((item) => ({
          url: `${SITE}/oracoes/${item.slug}`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
      )
    )
    prayerRoutes = [...topicRoutes, ...itemRoutes]
  } catch {
    // Se o banco estiver indisponível no build, o sitemap ainda sobe
    // com as rotas estáticas — melhor que falhar a build.
  }

  return [...staticRoutes, ...prayerRoutes]
}
