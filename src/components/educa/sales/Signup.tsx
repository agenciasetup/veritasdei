'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'
import type { EducaSalesIntervalo, EducaSalesPrice } from '@/lib/educa/server-data'

const NOMES: Record<EducaSalesIntervalo, string> = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
  unico: 'Único',
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export type SignupProps = {
  isAuthenticated: boolean
  prefillName: string | null
  prefillEmail: string | null
  intervalo: EducaSalesIntervalo
  selectedPrice: EducaSalesPrice | null

  // Form state
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  emailConfirm: string
  setEmailConfirm: (v: string) => void
  telefoneMasked: string
  setTelefone: (v: string) => void
  cpfMasked: string
  setCpf: (v: string) => void
  password: string
  setPassword: (v: string) => void
  passwordConfirm: string
  setPasswordConfirm: (v: string) => void
  showPassword: boolean
  togglePassword: () => void
  acceptedLegal: boolean
  setAcceptedLegal: (v: boolean) => void
  ageConfirmed: boolean
  setAgeConfirmed: (v: boolean) => void

  loading: boolean
  error: string | null
  info: string | null

  onSubmit: (e: React.FormEvent) => void
  onGoogle: () => void
  onSubscribe: () => void
}

const Signup = function Signup(props: SignupProps) {
  const {
    isAuthenticated,
    prefillName,
    prefillEmail,
    intervalo,
    selectedPrice,
    name,
    setName,
    email,
    setEmail,
    emailConfirm,
    setEmailConfirm,
    telefoneMasked,
    setTelefone,
    cpfMasked,
    setCpf,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    showPassword,
    togglePassword,
    acceptedLegal,
    setAcceptedLegal,
    ageConfirmed,
    setAgeConfirmed,
    loading,
    error,
    info,
    onSubmit,
    onGoogle,
    onSubscribe,
  } = props

  return (
    <section
      id="cadastro"
      className="surface-parchment relative py-20 md:py-28 overflow-hidden scroll-mt-4"
    >
      <div className="relative max-w-5xl mx-auto px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="eyebrow-label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 tag-light mb-6">
            <span className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
            {isAuthenticated ? 'Finalize sua assinatura' : 'Crie sua conta'}
          </span>
          <h2
            className="display-cormorant text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-4"
            style={{ color: 'var(--ink)', textWrap: 'balance' }}
          >
            {isAuthenticated ? (
              <>
                Falta só{' '}
                <span className="italic" style={{ color: '#5A1625' }}>
                  o pagamento.
                </span>
              </>
            ) : (
              <>
                Crie a conta e{' '}
                <span className="italic" style={{ color: '#5A1625' }}>
                  já comece a estudar.
                </span>
              </>
            )}
          </h2>
          <p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.6,
            }}
          >
            Plano selecionado:{' '}
            <strong style={{ color: '#5A1625' }}>{NOMES[intervalo]}</strong>
            {selectedPrice ? <> — {formatBRL(selectedPrice.amountCents)}.</> : '.'}{' '}
            {isAuthenticated
              ? 'Confirme abaixo e siga pro pagamento.'
              : 'Em seguida você cai direto no checkout.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="card-noble-light p-6 md:p-10 max-w-xl mx-auto"
        >
          {error && (
            <div
              className="mb-5 p-3 rounded-2xl text-sm"
              style={{
                background: 'rgba(217,79,92,0.10)',
                border: '1px solid rgba(217,79,92,0.35)',
                color: '#9B2832',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {error}
            </div>
          )}

          {info && (
            <div
              className="mb-5 p-3 rounded-2xl text-sm flex items-start gap-2"
              style={{
                background: 'rgba(90,22,37,0.06)',
                border: '1px solid rgba(90,22,37,0.25)',
                color: '#3D0F1A',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Check
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: '#5A1625' }}
              />
              {info}
            </div>
          )}

          {isAuthenticated ? (
            <SubscribePanel
              prefillName={prefillName}
              prefillEmail={prefillEmail}
              intervalo={intervalo}
              selectedPrice={selectedPrice}
              loading={loading}
              onSubscribe={onSubscribe}
            />
          ) : (
            <SignupForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              emailConfirm={emailConfirm}
              setEmailConfirm={setEmailConfirm}
              telefoneMasked={telefoneMasked}
              setTelefone={setTelefone}
              cpfMasked={cpfMasked}
              setCpf={setCpf}
              password={password}
              setPassword={setPassword}
              passwordConfirm={passwordConfirm}
              setPasswordConfirm={setPasswordConfirm}
              showPassword={showPassword}
              togglePassword={togglePassword}
              acceptedLegal={acceptedLegal}
              setAcceptedLegal={setAcceptedLegal}
              ageConfirmed={ageConfirmed}
              setAgeConfirmed={setAgeConfirmed}
              loading={loading}
              onSubmit={onSubmit}
              onGoogle={onGoogle}
            />
          )}

          <p
            className="text-[11px] text-center mt-5 flex items-center justify-center gap-1.5"
            style={{ color: 'var(--ink-muted)', fontFamily: 'Poppins, sans-serif' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#5A1625' }} />
            Pagamento processado com segurança. Cancele quando quiser.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Signup

/* ──────────────────────────────────────────────────────────────────────────
   Painel quando o usuário já está logado
   ────────────────────────────────────────────────────────────────────────── */
function SubscribePanel({
  prefillName,
  prefillEmail,
  intervalo,
  selectedPrice,
  loading,
  onSubscribe,
}: {
  prefillName: string | null
  prefillEmail: string | null
  intervalo: EducaSalesIntervalo
  selectedPrice: EducaSalesPrice | null
  loading: boolean
  onSubscribe: () => void
}) {
  return (
    <div>
      <p
        className="text-sm mb-6 flex items-start gap-2"
        style={{ color: 'var(--ink-soft)', fontFamily: 'Poppins, sans-serif' }}
      >
        <ShieldCheck
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          style={{ color: '#5A1625' }}
        />
        <span>
          Você está logado
          {prefillName || prefillEmail ? (
            <>
              {' '}como{' '}
              <strong style={{ color: 'var(--ink)' }}>
                {prefillName ?? prefillEmail}
              </strong>
            </>
          ) : null}
          . A assinatura fica vinculada a esta conta.
        </span>
      </p>
      <button
        type="button"
        onClick={onSubscribe}
        disabled={loading}
        className="w-full px-5 py-4 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #5A1625 0%, #3D0F1A 100%)',
          color: '#F5EFE6',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 14px 34px rgba(90,22,37,0.3)',
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Assinar — {NOMES[intervalo]}
            {selectedPrice ? ` · ${formatBRL(selectedPrice.amountCents)}` : ''}
          </>
        )}
      </button>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Formulário (visitante deslogado)
   ────────────────────────────────────────────────────────────────────────── */
type FormProps = Omit<SignupProps, 'isAuthenticated' | 'prefillName' | 'prefillEmail' | 'intervalo' | 'selectedPrice' | 'error' | 'info' | 'onSubscribe'>

function SignupForm({
  name,
  setName,
  email,
  setEmail,
  emailConfirm,
  setEmailConfirm,
  telefoneMasked,
  setTelefone,
  cpfMasked,
  setCpf,
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  showPassword,
  togglePassword,
  acceptedLegal,
  setAcceptedLegal,
  ageConfirmed,
  setAgeConfirmed,
  loading,
  onSubmit,
  onGoogle,
}: FormProps) {
  return (
    <div>
      {/* Google primeiro — caminho rápido sem checkboxes */}
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: '#FFFFFF',
          color: '#1F1F1F',
          fontFamily: 'var(--font-body)',
          border: '1px solid rgba(28,20,12,0.12)',
          fontWeight: 500,
        }}
      >
        <GoogleIcon />
        Continuar com Google
      </button>
      <p
        className="text-[11px] text-center mt-2 leading-relaxed"
        style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
      >
        Ao continuar com Google, você aceita os{' '}
        <Link href="/termos" target="_blank" className="underline" style={{ color: '#5A1625' }}>
          Termos
        </Link>{' '}
        e a{' '}
        <Link href="/privacidade" target="_blank" className="underline" style={{ color: '#5A1625' }}>
          Política de Privacidade
        </Link>
        .
      </p>

      <div className="flex items-center gap-3 my-6">
        <span className="flex-1 h-px" style={{ background: 'rgba(28,20,12,0.12)' }} />
        <span
          className="text-[11px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--ink-muted)', fontFamily: 'Cinzel, serif' }}
        >
          ou preencha
        </span>
        <span className="flex-1 h-px" style={{ background: 'rgba(28,20,12,0.12)' }} />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field
          label="Nome completo"
          type="text"
          autoComplete="name"
          value={name}
          onChange={setName}
          placeholder="Seu nome"
        />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
        />
        <Field
          label="Confirme o e-mail"
          type="email"
          autoComplete="off"
          value={emailConfirm}
          onChange={setEmailConfirm}
          placeholder="Digite o e-mail de novo"
        />
        <Field
          label="Telefone (com DDD)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={telefoneMasked}
          onChange={setTelefone}
          placeholder="(11) 99999-9999"
        />
        <Field
          label="CPF"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cpfMasked}
          onChange={setCpf}
          placeholder="000.000.000-00"
          hint="Necessário pra emitir o pagamento."
        />
        <PasswordField
          label="Senha"
          value={password}
          onChange={setPassword}
          show={showPassword}
          toggle={togglePassword}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirme a senha"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          show={showPassword}
          toggle={togglePassword}
          placeholder="Repita a senha"
          autoComplete="new-password"
        />

        <div className="flex flex-col gap-2 mt-1">
          <label
            className="flex items-start gap-2 text-xs cursor-pointer"
            style={{ color: 'var(--ink-soft)', fontFamily: 'Poppins, sans-serif' }}
          >
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={e => setAcceptedLegal(e.target.checked)}
              className="mt-0.5"
              style={{ accentColor: '#5A1625' }}
            />
            <span>
              Li e concordo com os{' '}
              <Link
                href="/termos"
                target="_blank"
                className="underline"
                style={{ color: '#5A1625' }}
              >
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link
                href="/privacidade"
                target="_blank"
                className="underline"
                style={{ color: '#5A1625' }}
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          <label
            className="flex items-start gap-2 text-xs cursor-pointer"
            style={{ color: 'var(--ink-soft)', fontFamily: 'Poppins, sans-serif' }}
          >
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={e => setAgeConfirmed(e.target.checked)}
              className="mt-0.5"
              style={{ accentColor: '#5A1625' }}
            />
            <span>Declaro ter 14 anos completos ou mais.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-5 py-4 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #5A1625 0%, #3D0F1A 100%)',
            color: '#F5EFE6',
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 14px 34px rgba(90,22,37,0.3)',
          }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Criar conta e ir pro pagamento
            </>
          )}
        </button>

        <p
          className="text-[11px] text-center mt-1"
          style={{ color: 'var(--ink-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          Já tem conta?{' '}
          <Link href="/login?next=/educa" className="underline" style={{ color: '#5A1625' }}>
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  hint,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  hint?: string
}) {
  return (
    <div>
      <label
        className="block text-[11px] mb-1.5 uppercase"
        style={{
          color: 'var(--ink-muted)',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.16em',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: '#FFFCF3',
          border: '1px solid rgba(28,20,12,0.18)',
          color: 'var(--ink)',
          fontFamily: 'Poppins, sans-serif',
        }}
        onFocus={e => {
          e.target.style.borderColor = '#5A1625'
          e.target.style.boxShadow = '0 0 0 3px rgba(90,22,37,0.12)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(28,20,12,0.18)'
          e.target.style.boxShadow = 'none'
        }}
      />
      {hint && (
        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--ink-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  toggle: () => void
  placeholder: string
  autoComplete?: string
}) {
  return (
    <div>
      <label
        className="block text-[11px] mb-1.5 uppercase"
        style={{
          color: 'var(--ink-muted)',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.16em',
        }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={8}
          required
          className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
          style={{
            background: '#FFFCF3',
            border: '1px solid rgba(28,20,12,0.18)',
            color: 'var(--ink)',
            fontFamily: 'Poppins, sans-serif',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#5A1625'
            e.target.style.boxShadow = '0 0 0 3px rgba(90,22,37,0.12)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(28,20,12,0.18)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5"
          style={{ color: 'var(--ink-muted)' }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
