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
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com https://maps.googleapis.com https://places.googleapis.com https://vitals.vercel-insights.com https://*.r2.cloudflarestorage.com https://media.veritasdei.com.br",
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
    // geolocation/camera/microphone ficam habilitadas pra self:
    //   - geolocation: /paroquias/buscar
    //   - camera: upload de foto de perfil em mobile
    //   - microphone: áudio em grupo no terço compartilhado
    key: 'Permissions-Policy',
    value: [
      'geolocation=(self)',
      'camera=(self)',
      'microphone=(self)',
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
  images: {
    // R2 já serve variantes prontas (thumb/feed/detail); usamos loader
    // custom pass-through pra evitar double-processing do otimizador.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'media.veritasdei.com.br' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      // Supabase Storage (avatar/cover do profile_image_url).
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
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
  async redirects() {
    // Migração UX Fase 1: rotas antigas redirecionam para as canônicas.
    // Mantemos 301 (permanent) para que SEO e PWA respeitem as novas URLs.
    //
    // Nota: só redirecionamos as raízes dos hubs. Subrotas de /paroquias
    // (cadastrar, buscar, [id], etc) continuam servindo em /paroquias/*
    // até a Fase 2 migrar o CRUD para /igrejas/*.
    return [
      // Hub: Rezar
      { source: '/orar', destination: '/rezar', permanent: true },
      // Hub: Formação (premium)
      { source: '/aprender', destination: '/formacao', permanent: true },
      // Hub: Igrejas (renome de Paróquias)
      { source: '/paroquias', destination: '/igrejas', permanent: true },

      // Pilares doutrinais: rota canônica é /estudo/[pilar] (StudyReader
      // com deepdive + anotações + quiz). As rotas estáticas antigas
      // eram wrappers de DynamicContentView puxando dos MESMOS
      // content_groups — mesma fonte, UX inferior. 308 preserva método
      // e cache de PWA/bookmarks.
      { source: '/dogmas', destination: '/estudo/dogmas', permanent: true },
      { source: '/dogmas/:path*', destination: '/estudo/dogmas/:path*', permanent: true },
      { source: '/sacramentos', destination: '/estudo/sacramentos', permanent: true },
      { source: '/sacramentos/:path*', destination: '/estudo/sacramentos/:path*', permanent: true },
      { source: '/mandamentos', destination: '/estudo/mandamentos', permanent: true },
      { source: '/mandamentos/:path*', destination: '/estudo/mandamentos/:path*', permanent: true },
      { source: '/preceitos', destination: '/estudo/preceitos', permanent: true },
      { source: '/preceitos/:path*', destination: '/estudo/preceitos/:path*', permanent: true },
      { source: '/obras-misericordia', destination: '/estudo/obras-misericordia', permanent: true },
      { source: '/obras-misericordia/:path*', destination: '/estudo/obras-misericordia/:path*', permanent: true },
      { source: '/virtudes-pecados', destination: '/estudo/virtudes-pecados', permanent: true },
      { source: '/virtudes-pecados/:path*', destination: '/estudo/virtudes-pecados/:path*', permanent: true },
    ]
  },
}

export default nextConfig
