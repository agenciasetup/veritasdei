import AuthGuard from '@/components/auth/AuthGuard'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PrivacidadeActions } from './PrivacidadeActions'

export const metadata = {
  title: 'Privacidade e dados | Veritas Dei',
  description: 'Exercite seus direitos LGPD: exportar dados, excluir conta, gerenciar consentimentos.',
}

export default function PrivacidadePerfilPage() {
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
              <ShieldCheck className="w-5 h-5" style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                Privacidade e dados
              </h1>
              <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Seus direitos previstos na LGPD (art. 18).
              </p>
            </div>
          </div>

          <PrivacidadeActions />

          <div className="mt-8 pt-6 space-y-2" style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}>
            <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Dúvidas sobre privacidade? Escreva para{' '}
              <a href="mailto:privacidade@veritasdei.com.br" style={{ color: '#C9A84C' }}>
                privacidade@veritasdei.com.br
              </a>
              . Resposta em até 15 dias corridos.
            </p>
            <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Saiba mais em{' '}
              <Link href="/privacidade" style={{ color: '#C9A84C' }}>
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
