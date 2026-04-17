import type { NextConfig } from "next"

// Cabeçalhos de segurança aplicados a TODAS as rotas.
// CSP deliberadamente permissiva por enquanto (allow 'unsafe-inline' em style
// e 'unsafe-eval' em script), porque o app usa inline styles extensivamente e
// algumas libs (framer-motion, Stripe.js) injetam scripts inline. O objetivo
// deste sprint é fechar o baseline: HSTS, clickjacking, sniffing, referrer,
// permissions. CSP com nonce fica para um sprint dedicado.
const SECURITY_HEADERS = [
  {
    // Força HTTPS por 2 anos + preload. Mesmo que alguém digite http://, o
    // browser bloqueia antes de sair da máquina.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Bloqueia MIME sniffing — impede o browser de tratar .txt como HTML etc.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Impede o site de ser carregado em <iframe> de terceiros — defesa
    // contra clickjacking. Mantemos 'SAMEORIGIN' por precaução (o app não
    // precisa de iframes próprios, mas o dashboard Vercel/Supabase usa para
    // previews).
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    // Referrer limitado — envia só origin em cross-origin (não vaza path).
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Permissions Policy — corta features sensíveis que o app não usa.
    // geolocation e camera precisam ficar habilitadas (paroquias/buscar usa
    // localização; upload de foto de perfil pode usar câmera em mobile).
    key: 'Permissions-Policy',
    value: [
      'geolocation=(self)',
      'camera=(self)',
      'microphone=()',
      'payment=(self)',       // Stripe checkout
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=(self)',     // alguns PWAs Android usam
      'accelerometer=(self)',
      'fullscreen=(self)',
      'interest-cohort=()',   // bloqueia FLoC
    ].join(', '),
  },
  {
    // Cross-Origin Opener Policy — isola browsing context. Evita que outras
    // janelas (popups) consigam referenciar window.opener.
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Tree-shaking agressivo dos imports nomeados destas libs
    // (reduz bytes quando só usamos um subset).
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
    ],
  },
  async headers() {
    return [
      {
        // Aplica em tudo, exceto assets servidos pelo Next com cache próprio.
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
