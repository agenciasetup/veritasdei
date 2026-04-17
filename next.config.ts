import type { NextConfig } from "next"

// Cabeçalhos de segurança aplicados a TODAS as rotas.
// CSP deliberadamente permissiva por enquanto (allow 'unsafe-inline' em style
// e 'unsafe-eval' em script), porque o app usa inline styles extensivamente e
// algumas libs (framer-motion, Stripe.js) injetam scripts inline. O objetivo
// deste sprint é fechar o baseline: HSTS, clickjacking, sniffing, referrer,
// permissions. CSP com nonce fica para um sprint dedicado.
// CSP "report-only" primeiro: ganhamos visibilidade do que o app usa sem
// quebrar nada. Depois de monitorar uma semana, trocar para CSP
// bloqueante. Usamos uma baseline permissiva em script/style porque o app
// usa inline styles extensivamente e libs (Stripe, framer-motion) injetam
// scripts. `object-src 'none'` e `base-uri 'self'` são safe hardening em
// qualquer cenário — bloqueiam Flash/Java plugins e injeção de <base>.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: ",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com https://maps.googleapis.com https://places.googleapis.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join('; ')

const SECURITY_HEADERS = [
  {
    // Força HTTPS por 2 anos + preload. Mesmo que alguém digite http://, o
    // browser bloqueia antes de sair da máquina.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // CSP em report-only durante fase de rollout. Browsers só reportam
    // violações, não bloqueiam. Quando tivermos confiança nos domínios
    // listados, trocar o header name para `Content-Security-Policy`.
    key: 'Content-Security-Policy-Report-Only',
    value: CSP_DIRECTIVES,
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
