import AuthGuard from '@/components/auth/AuthGuard'
import Link from 'next/link'
import { ArrowLeft, Gavel } from 'lucide-react'
import { AppealsList } from './AppealsList'

export const metadata = {
  title: 'Apelações de moderação | Veritas Dei',
  description: 'Conteste decisões de moderação em até 7 dias.',
}

export default function ApelacoesPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 py-10 relative">
        <div className="bg-glow" />

        <Link
          href="/perfil"
          className="self-start flex items-center gap-2 text-sm transition-colors z-10"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Perfil
        </Link>

        <div
          className="w-full max-w-lg rounded-2xl p-6 md:p-8 relative z-10 mt-6"
          style={{
            background: 'rgba(16,16,16,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(201,168,76,0.15)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <Gavel className="w-5 h-5" style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                Apelações
              </h1>
              <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Revisão humana em até 72h. Detalhe bem a situação.
              </p>
            </div>
          </div>

          <AppealsList />

          <p className="mt-6 text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Regras completas em{' '}
            <Link href="/diretrizes" style={{ color: '#C9A84C' }}>
              Diretrizes da Comunidade
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthGuard>
  )
}
