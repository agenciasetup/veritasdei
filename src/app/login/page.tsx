'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { VOCACOES, type Vocacao } from '@/types/auth'
import { LogIn, UserPlus, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Tab = 'login' | 'registro' | 'primeiro-acesso'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [vocacao, setVocacao] = useState<Vocacao>('leigo')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signInWithPassword, signUp, signInWithMagicLink } = useAuth()
  const router = useRouter()

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
        className="w-full max-w-md rounded-2xl p-6 md:p-8 relative z-10"
        style={{
          background: 'rgba(16,16,16,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.15)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
      >
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
            <InputField
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              required
            />
            <div className="relative">
              <InputField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Sua senha"
                required
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

            <button
              type="button"
              onClick={() => { setTab('primeiro-acesso'); clearState() }}
              className="text-xs underline"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Esqueci minha senha
            </button>

            <SubmitButton loading={loading}>Entrar</SubmitButton>
          </form>
        )}

        {/* ═══ REGISTRO TAB ═══ */}
        {tab === 'registro' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <InputField
              label="Nome completo"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Seu nome"
              required
            />
            <InputField
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              required
            />
            <div className="relative">
              <InputField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
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

            {/* Vocação */}
            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Vocação
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VOCACOES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVocacao(v.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      background: vocacao === v.value ? 'rgba(201,168,76,0.12)' : 'rgba(10,10,10,0.5)',
                      border: vocacao === v.value
                        ? '1px solid rgba(201,168,76,0.3)'
                        : '1px solid rgba(201,168,76,0.08)',
                      color: vocacao === v.value ? '#C9A84C' : '#7A7368',
                    }}
                  >
                    <span>{v.icon}</span>
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
            <InputField
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              required
            />
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

function InputField({
  label, type, value, onChange, placeholder, required, minLength,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
  minLength?: number
}) {
  return (
    <div>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
        style={{
          background: 'rgba(10,10,10,0.6)',
          border: '1px solid rgba(201,168,76,0.12)',
          color: '#F2EDE4',
          fontFamily: 'Poppins, sans-serif',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(201,168,76,0.4)'
          e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(201,168,76,0.12)'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

function SubmitButton({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2"
      style={{
        fontFamily: 'Cinzel, serif',
        background: loading
          ? 'rgba(201,168,76,0.15)'
          : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
        color: loading ? '#7A7368' : '#0A0A0A',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? (
        <div
          className="w-4 h-4 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
        />
      ) : (
        children
      )}
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
