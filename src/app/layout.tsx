import type { Metadata, Viewport } from "next"
import { Cinzel, Cormorant_Garamond, Poppins } from "next/font/google"
import "./globals.css"
import AppShell from "@/components/layout/AppShell"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import ThemeScript from "@/components/ThemeScript"
import ThemeSupabaseSync from "@/components/theme/ThemeSupabaseSync"
import LiturgicalThemeSync from "@/components/theme/LiturgicalThemeSync"
import PwaRegister from "@/components/layout/PwaRegister"
import InstallPrompt from "@/components/pwa/InstallPrompt"
import NoZoom from "@/components/layout/NoZoom"
import GamificationEventsProvider from "@/components/gamification/GamificationEventsProvider"
import RevenueCatBootstrap from "@/components/payments/RevenueCatBootstrap"
import PushBootstrap from "@/components/notifications/PushBootstrap"
import NotificationToast from "@/components/notifications/NotificationToast"
import { NotificationToastProvider } from "@/contexts/NotificationToastContext"
import NativeAppearanceBootstrap from "@/components/layout/NativeAppearanceBootstrap"
import PremiumWelcomeModal from "@/components/payments/PremiumWelcomeModal"

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
  // (convenção de arquivo do Next). Apple touch icon obrigatoriamente PNG
  // 180×180 — iOS usa pra home screen (e é requisito pra Web Push em PWA).
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
          <LiturgicalThemeSync />
          <AuthProvider>
            <ThemeSupabaseSync />
            <NotificationToastProvider>
              <RevenueCatBootstrap />
              <PushBootstrap />
              <NativeAppearanceBootstrap />
              <NotificationToast />
              <GamificationEventsProvider>
                <AppShell>{children}</AppShell>
                <PremiumWelcomeModal />
              </GamificationEventsProvider>
            </NotificationToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <PwaRegister />
        <InstallPrompt />
        <NoZoom />
      </body>
    </html>
  )
}
