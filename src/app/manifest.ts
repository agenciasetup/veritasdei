import type { MetadataRoute } from 'next'

/**
 * Web App Manifest para instalação como PWA.
 *
 * iOS Safari 16.4+ só habilita Web Push após "Adicionar à Tela de Início",
 * por isso o manifest + apple-touch-icon 180×180 são obrigatórios para
 * notificações funcionarem no iPhone.
 *
 * SVG maskable isolado não passa em todos os devices Android antigos →
 * incluímos PNGs 192/512 e um 512 maskable. Gerados por
 * `node scripts/gen-pwa-icons.mjs`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veritas Dei — Fé Católica',
    short_name: 'Veritas Dei',
    description:
      'Terço, novenas, liturgia do dia, orações, paróquias e aprendizado católico — tudo em um só lugar.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    lang: 'pt-BR',
    categories: ['lifestyle', 'education', 'books'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
