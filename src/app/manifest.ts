import type { MetadataRoute } from 'next'

/**
 * Web App Manifest para instalação como PWA.
 *
 * Esta é a base para notificações push futuras (Fase 2).
 * No iOS Safari, push só funciona após "Adicionar à Tela de Início".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veritas Dei — Fé Católica',
    short_name: 'Veritas Dei',
    description:
      'Terço, liturgia do dia, orações, paróquias e aprendizado católico — tudo em um só lugar.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    lang: 'pt-BR',
    categories: ['lifestyle', 'education', 'books'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
