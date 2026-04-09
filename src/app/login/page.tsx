'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { VOCACOES, type Vocacao } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import { LogIn, UserPlus, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Tab = 'login' | 'registro' | 'primeiro-acesso'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }} />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'login'

  const [tab, setTab] = useState<Tab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [vocacao, setVocacao] = useState<Vocacao>('leigo')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signInWithPassword, signUp, signInWithMagicLink, signInWithOAuth, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) router.push('/')
  }, [isAuthenticated, router])

  const clearState = () => {
    setError(null)
    setSuccess(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearState()
    setLoading(true)

    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError(traduzirErro(error))
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearState()
    setLoading(true)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, name)
    if (error) {
      setError(traduzirErro(error))
    } else {
      setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
    }
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    clearState()
    setLoading(true)

    const { error } = await signInWithMagicLink(email)
    if (error) {
      setError(traduzirErro(error))
    } else {
      setSuccess('Link enviado! Verifique sua caixa de e-mail.')
    }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    clearState()
    setLoading(true)
    const { error } = await signInWithOAuth(provider)
    if (error) setError(traduzirErro(error))
    setLoading(false)
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'login', label: 'Entrar', icon: <LogIn className="w-4 h-4" /> },
    { key: 'registro', label: 'Cadastrar', icon: <UserPlus className="w-4 h-4" /> },
    { key: 'primeiro-acesso', label: 'Primeiro Acesso', icon: <Mail className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 relative">
      <div className="bg-glow" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors z-10"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      {/* Gothic Cross */}
      <div className="mb-6">
        <svg width="28" height="40" viewBox="0 0 36 52" fill="none" className="gothic-cross">
          <rect x="14" y="0" width="8" height="52" rx="1.5" fill="url(#crossGoldLogin)" />
          <rect x="0" y="14" width="36" height="8" rx="1.5" fill="url(#crossGoldLogin)" />
          <circle cx="18" cy="18" r="3" fill="#6B1D2A" stroke="#C9A84C" strokeWidth="1" />
          <defs>
            <linearGradient id="crossGoldLogin" x1="18" y1="0" x2="18" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D9C077" />
              <stop offset="50%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#A88B3A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h1
        className="text-2xl md:text-3xl font-bold tracking-widest uppercase mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        Veritas Dei
      </h1>
      <p className="text-sm mb-8" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        Entre para a comunidade católica
      </p>

      {/* Card */}
      <div
        className="w-full max-w-lg rounded-2xl p-6 md:p-8 relative z-10"
        style={{
          background: 'rgba(16,16,16,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.15)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* ═══ OAuth Buttons ═══ */}
        <div className="space-y-2 mb-5">
          <OAuthButton provider="google" onClick={() => handleOAuth('google')} disabled={loading} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.1)' }} />
          <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            ou com e-mail
          </span>
          <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.1)' }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(10,10,10,0.6)' }}>
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); clearState() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                fontFamily: 'Poppins, sans-serif',
                background: tab === key ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: tab === key ? '#C9A84C' : '#7A7368',
                border: tab === key ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              }}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
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

        {/* Success */}
        {success && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* ═══ LOGIN TAB ═══ */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <InputField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
            <div className="relative">
              <InputField label="Senha" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Sua senha" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] p-1" style={{ color: '#7A7368' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="button" onClick={() => { setTab('primeiro-acesso'); clearState() }} className="text-xs underline" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Esqueci minha senha
            </button>
            <SubmitButton loading={loading}>Entrar</SubmitButton>
          </form>
        )}

        {/* ═══ REGISTRO TAB ═══ */}
        {tab === 'registro' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <InputField label="Nome completo" type="text" value={name} onChange={setName} placeholder="Seu nome" required />
            <InputField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
            <div className="relative">
              <InputField label="Senha" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] p-1" style={{ color: '#7A7368' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Vocação */}
            <div>
              <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>Vocação</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOCACOES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVocacao(v.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      background: vocacao === v.value ? 'rgba(201,168,76,0.12)' : 'rgba(10,10,10,0.5)',
                      border: vocacao === v.value ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(201,168,76,0.08)',
                      color: vocacao === v.value ? '#C9A84C' : '#7A7368',
                    }}
                  >
                    <VocacaoIcon vocacao={v.value} size={16} />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <SubmitButton loading={loading}>Criar Conta</SubmitButton>
          </form>
        )}

        {/* ═══ PRIMEIRO ACESSO / MAGIC LINK TAB ═══ */}
        {tab === 'primeiro-acesso' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              Insira seu e-mail e enviaremos um link de acesso. Ideal para primeiro login ou recuperação de senha.
            </p>
            <InputField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
            <SubmitButton loading={loading}>Enviar Link de Acesso</SubmitButton>
          </form>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// Componentes internos
// ═══════════════════════════════════════════════════════

function OAuthButton({ provider, onClick, disabled }: { provider: 'google' | 'facebook' | 'apple'; onClick: () => void; disabled: boolean }) {
  const config = {
    google: { label: 'Continuar com Google', bg: '#ffffff', color: '#1f1f1f', icon: GoogleIcon },
    facebook: { label: 'Continuar com Facebook', bg: '#1877F2', color: '#ffffff', icon: FacebookIcon },
    apple: { label: 'Continuar com Apple', bg: '#000000', color: '#ffffff', icon: AppleIcon },
  }

  const { label, bg, color, icon: Icon } = config[provider]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
      style={{ background: bg, color, fontFamily: 'Poppins, sans-serif', border: provider === 'apple' ? '1px solid rgba(255,255,255,0.15)' : 'none' }}
    >
      <Icon />
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function InputField({
  label, type, value, onChange, placeholder, required, minLength,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; minLength?: number
}) {
  return (
    <div>
      <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} minLength={minLength}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
        style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)' }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.12)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function SubmitButton({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button
      type="submit" disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2"
      style={{
        fontFamily: 'Cinzel, serif',
        background: loading ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
        color: loading ? '#7A7368' : '#0A0A0A',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }} />
      ) : children}
    </button>
  )
}

function traduzirErro(error: string): string {
  if (error.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (error.includes('Email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.'
  if (error.includes('User already registered')) return 'Este e-mail já está cadastrado.'
  if (error.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (error.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.'
  return error
}
