import type { Metadata, Viewport } from "next"
import { Cinzel, Cormorant_Garamond, Poppins } from "next/font/google"
import "./globals.css"
import AppShell from "@/components/layout/AppShell"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import ThemeScript from "@/components/ThemeScript"
import ThemeSupabaseSync from "@/components/theme/ThemeSupabaseSync"
import PwaRegister from "@/components/layout/PwaRegister"
import NoZoom from "@/components/layout/NoZoom"
import GamificationEventsProvider from "@/components/gamification/GamificationEventsProvider"

// next/font/google: self-hosting + auto-subset + preload com display:swap.
// Pesos reduzidos vs versão antiga (-400/-500 typical) para economia de bytes.
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-display-loaded',
  fallback: ['Georgia', 'serif'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  // optional: browser só aplica se carregar em <100ms — reduz CLS em
  // conexões lentas. Fonte de acento (citações, welcome); fallback
  // Georgia é aceitável se a custom não chegar a tempo.
  display: 'optional',
  variable: '--font-elegant-loaded',
  fallback: ['Georgia', 'serif'],
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-body-loaded',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
})

export const metadata: Metadata = {
  title: "Veritas Dei — Fé Católica",
  description:
    "Terço, liturgia do dia, orações, paróquias e aprendizado católico — tudo em um só lugar.",
  applicationName: "Veritas Dei",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Veritas Dei",
  },
  openGraph: {
    title: "Veritas Dei — Fé Católica",
    description: "Terço, liturgia, orações, paróquias e aprendizado católico.",
    type: "website",
  },
  // Favicon e icon principal vêm de src/app/favicon.ico + src/app/icon.svg
  // (convenção de arquivo do Next). Apple touch icon usa o SVG maskable de
  // public/icon.svg (quadrado arredondado, melhor para home-screen iOS).
  icons: {
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom de página desabilitado — evita layout quebrado no iOS
  // (pinch-zoom na estrutura). Imagens no lightbox têm zoom próprio.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${cinzel.variable} ${cormorant.variable} ${poppins.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeScript />
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        <ThemeProvider>
          <AuthProvider>
            <ThemeSupabaseSync />
            <GamificationEventsProvider>
              <AppShell>{children}</AppShell>
            </GamificationEventsProvider>
          </AuthProvider>
        </ThemeProvider>
        <PwaRegister />
        <NoZoom />
      </body>
    </html>
  )
}
