import type { NextConfig } from "next"

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
}

export default nextConfig
