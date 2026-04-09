'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SegurancaPage() {
  return (
    <AuthGuard>
      <SegurancaContent />
    </AuthGuard>
  )
}

function SegurancaContent() {
  const { updatePassword, profile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const isFirstAccess = !profile?.has_password_set

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)

    if (error) {
      setError(error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 relative">
      <div className="bg-glow" />

      <Link
        href="/perfil"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors z-10"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Perfil
      </Link>

      <div
        className="w-full max-w-md rounded-2xl p-6 md:p-8 relative z-10"
        style={{
          background: 'rgba(16,16,16,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.15)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <Lock className="w-5 h-5" style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              {isFirstAccess ? 'Criar Senha' : 'Alterar Senha'}
            </h1>
            <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              {isFirstAccess
                ? 'Defina uma senha para acessar sua conta'
                : 'Atualize sua senha de acesso'}
            </p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#C9A84C' }} />
            <p className="text-lg font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
              Senha {isFirstAccess ? 'criada' : 'alterada'}!
            </p>
            <p className="text-sm mb-6" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Sua senha foi atualizada com sucesso.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: '#0A0A0A',
              }}
            >
              Ir para o Início
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(107,29,42,0.15)',
                  border: '1px solid rgba(107,29,42,0.3)',
                  color: '#D94F5C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {error}
              </div>
            )}

            <div className="relative">
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Nova senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] p-1"
                style={{ color: '#7A7368' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Confirmar senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              style={{
                fontFamily: 'Cinzel, serif',
                background: loading
                  ? 'rgba(201,168,76,0.15)'
                  : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: loading ? '#7A7368' : '#0A0A0A',
              }}
            >
              {loading ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
                />
              ) : (
                <>{isFirstAccess ? 'Criar Senha' : 'Alterar Senha'}</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
