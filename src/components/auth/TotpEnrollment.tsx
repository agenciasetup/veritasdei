'use client'

import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck, ShieldOff, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Factor = {
  id: string
  status: 'unverified' | 'verified'
  friendly_name?: string | null
}

type EnrollState =
  | { kind: 'loading' }
  | { kind: 'disabled'; verifiedFactors: Factor[] }
  | { kind: 'enrolling'; factorId: string; qrSvg: string; secret: string }
  | { kind: 'verified'; factors: Factor[] }
  | { kind: 'error'; message: string }

export function TotpEnrollment() {
  const supabase = createClient()
  const [state, setState] = useState<EnrollState>({ kind: 'loading' })
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function loadFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setState({ kind: 'error', message: error.message })
      return
    }
    const verified = ((data?.totp ?? []) as Array<{ id: string; status: string; friendly_name?: string | null }>)
      .filter((f) => f.status === 'verified') as unknown as Factor[]
    if (verified.length > 0) {
      setState({ kind: 'verified', factors: verified })
    } else {
      setState({ kind: 'disabled', verifiedFactors: [] })
    }
  }

  useEffect(() => {
    void loadFactors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startEnrollment() {
    setState({ kind: 'loading' })
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Veritas Dei · ${new Date().toLocaleDateString('pt-BR')}`,
    })
    if (error || !data) {
      setState({ kind: 'error', message: error?.message ?? 'Falha ao iniciar 2FA.' })
      return
    }
    setState({
      kind: 'enrolling',
      factorId: data.id,
      qrSvg: data.totp.qr_code,
      secret: data.totp.secret,
    })
  }

  async function verifyEnrollment() {
    if (state.kind !== 'enrolling') return
    setVerifying(true)
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: state.factorId })
      if (challenge.error || !challenge.data) {
        setState({ kind: 'error', message: challenge.error?.message ?? 'Falha no challenge.' })
        return
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      })
      if (error) {
        setState((s) =>
          s.kind === 'enrolling'
            ? s
            : s,
        )
        setCode('')
        setVerifying(false)
        alert(error.message)
        return
      }
      await loadFactors()
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  async function disableFactor(factorId: string) {
    if (!confirm('Tem certeza que quer desativar o 2FA? Seu login voltará a ser só e-mail+senha.')) return
    setState({ kind: 'loading' })
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) {
      setState({ kind: 'error', message: error.message })
      return
    }
    await loadFactors()
  }

  if (state.kind === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
        {state.message}
      </div>
    )
  }

  if (state.kind === 'verified') {
    return (
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: '#10b981' }} />
          <p className="text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
            2FA (TOTP) ativo. Seu login exigirá código do autenticador.
          </p>
        </div>
        {state.factors.map((f) => (
          <button
            key={f.id}
            onClick={() => disableFactor(f.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontFamily: 'Poppins, sans-serif' }}
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Desativar ({f.friendly_name ?? 'autenticador'})
          </button>
        ))}
      </div>
    )
  }

  if (state.kind === 'enrolling') {
    return (
      <div className="space-y-3">
        <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
          Escaneie o QR Code com seu autenticador (Google Authenticator, Authy, 1Password, etc.).
          Se não puder escanear, use a chave manual logo abaixo.
        </p>
        <div className="flex justify-center p-3 rounded-xl" style={{ background: '#FFFFFF' }}>
          <div
            dangerouslySetInnerHTML={{ __html: state.qrSvg }}
            className="[&_svg]:w-40 [&_svg]:h-40"
          />
        </div>
        <div className="p-2 rounded-lg font-mono text-[11px] break-all" style={{ background: 'rgba(0,0,0,0.3)', color: '#F2EDE4', border: '1px solid rgba(201,168,76,0.15)' }}>
          {state.secret}
        </div>
        <label className="block text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
          Código de 6 dígitos do app
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="mt-1 w-full px-3 py-2 rounded-lg text-sm font-mono tracking-widest"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#F2EDE4',
              outline: 'none',
            }}
          />
        </label>
        <button
          type="button"
          disabled={code.length !== 6 || verifying}
          onClick={verifyEnrollment}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          style={{ background: '#C9A84C', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif' }}
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Confirmar e ativar 2FA
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
        A autenticação em dois fatores (2FA) protege sua conta mesmo se sua senha vazar.
        Recomendamos fortemente ativar.
      </p>
      <button
        onClick={startEnrollment}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
      >
        <ShieldCheck className="w-4 h-4" />
        Ativar 2FA (TOTP)
      </button>
    </div>
  )
}
