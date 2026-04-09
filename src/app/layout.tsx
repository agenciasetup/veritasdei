import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Veritas Dei — O que a Igreja ensina",
  description: "Sistema de consulta da fé católica com fontes da Bíblia, Magistério e Patrística.",
  openGraph: {
    title: "Veritas Dei — O que a Igreja ensina",
    description: "Consulte a fé católica com as fontes: Bíblia, Magistério e Patrística.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  )
}
