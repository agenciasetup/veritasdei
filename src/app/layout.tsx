import type { Metadata, Viewport } from "next"
import { Cinzel, Cormorant_Garamond, Poppins } from "next/font/google"
import "./globals.css"
import AppShell from "@/components/layout/AppShell"
import { AuthProvider } from "@/contexts/AuthContext"
import PwaRegister from "@/components/layout/PwaRegister"

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
  display: 'swap',
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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  )
}
