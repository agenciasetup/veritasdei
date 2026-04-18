import type { MetadataRoute } from 'next'

const SITE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.veritasdei.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Áreas logadas e administrativas não devem ser indexadas.
        disallow: ['/admin', '/api', '/perfil', '/onboarding', '/login', '/cadastro'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
