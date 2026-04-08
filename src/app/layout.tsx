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
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: '#FAFAF8', color: '#111111', fontFamily: 'Inter, sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
