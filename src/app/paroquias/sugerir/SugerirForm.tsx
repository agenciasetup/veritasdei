'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Church } from 'lucide-react'
import { TIPOS_IGREJA, type TipoIgreja } from '@/types/paroquia'
import { maskCnpj } from '@/lib/utils/cnpj'
import { Field } from '../cadastrar/components/Field'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      el: string | HTMLElement,
      opts: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: 'auto' | 'light' | 'dark'
      },
    ) => string
    remove: (id: string) => void
    reset: (id: string) => void
  }
}

export default function SugerirForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ id: string; nome: string } | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const turnstileIdRef = useRef<string | null>(null)

  const [nome, setNome] = useState('')
  const [cnpjMasked, setCnpjMasked] = useState('')
  const [tipoIgreja, setTipoIgreja] = useState<TipoIgreja | ''>('')
  const [diocese, setDiocese] = useState('')
  const [padreResponsavel, setPadreResponsavel] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cep, setCep] = useState('')
  const [telefone, setTelefone] = useState('')
  const [emailIgreja, setEmailIgreja] = useState('')
  const [site, setSite] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [submitterWhatsapp, setSubmitterWhatsapp] = useState('')

  useEffect(() => {
    if (!SITE_KEY) return
    if (document.querySelector('script[data-turnstile]')) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.setAttribute('data-turnstile', 'true')
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!SITE_KEY) return
    if (!turnstileRef.current) return
    let cancelled = false
    const tryRender = () => {
      if (cancelled) return
      const w = window as unknown as TurnstileWindow
      if (w.turnstile && turnstileRef.current && !turnstileIdRef.current) {
        turnstileIdRef.current = w.turnstile.render(turnstileRef.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          callback: token => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(null),
          'error-callback': () => setTurnstileToken(null),
        })
      } else {
        setTimeout(tryRender, 300)
      }
    }
    tryRender()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nome.trim()) return setError('Informe o nome da igreja.')
    if (!tipoIgreja) return setError('Selecione o tipo da igreja.')
    if (!cidade.trim()) return setError('Informe a cidade.')
    if (estado.trim().length !== 2) return setError('Informe o estado (UF, 2 letras).')
    if (!submitterName.trim()) return setError('Informe seu nome.')
    if (!submitterEmail.trim()) return setError('Informe seu email.')
    if (SITE_KEY && !turnstileToken) return setError('Aguarde a verificação anti-robô concluir.')

    setSaving(true)
    try {
      const res = await fetch('/api/paroquias/publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          tipoIgreja,
          cnpj: cnpjMasked || null,
          diocese: diocese.trim() || null,
          padreResponsavel: padreResponsavel.trim() || null,
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(),
          rua: rua.trim() || null,
          numero: numero.trim() || null,
          bairro: bairro.trim() || null,
          cep: cep.trim() || null,
          telefone: telefone.trim() || null,
          emailIgreja: emailIgreja.trim() || null,
          site: site.trim() || null,
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          submitterWhatsapp: submitterWhatsapp.trim() || null,
          turnstileToken,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error ?? 'Erro ao enviar. Tente novamente.')
        const w = window as unknown as TurnstileWindow
        if (turnstileIdRef.current && w.turnstile) {
          w.turnstile.reset(turnstileIdRef.current)
          setTurnstileToken(null)
        }
        setSaving(false)
        return
      }
      setDone({ id: json.id, nome: json.nome })
    } catch {
      setError('Erro de rede. Verifique sua conexão e tente novamente.')
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen px-4 md:px-8 py-10 relative">
        <div className="bg-glow" aria-hidden />
        <div className="max-w-xl mx-auto relative z-10 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)' }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: '#4CAF50' }} />
          </div>
          <h1
            className="text-2xl md:text-3xl font-semibold mb-3"
            style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
          >
            Obrigado! Sua sugestão foi enviada.
          </h1>
          <p
            className="text-sm mb-2"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>{done.nome}</strong> entrou na fila
            de moderação. Nossa equipe revisa novos cadastros em até 48h úteis.
          </p>
          <p
            className="text-xs mb-8"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            Se você é representante dessa igreja, crie uma conta e faça a reivindicação depois
            da aprovação.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/paroquias"
              className="px-5 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Ver igrejas
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="px-5 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
                fontFamily: 'var(--font-body)',
              }}
            >
              Cadastrar outra
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="bg-glow" aria-hidden />
      <div className="max-w-2xl mx-auto relative z-10 px-4 md:px-8 pt-6">
        <Link
          href="/paroquias"
          className="inline-flex items-center gap-2 text-sm mb-4 active:opacity-70"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Church className="w-6 h-6" style={{ color: '#C9A84C' }} />
          <h1
            className="text-2xl md:text-3xl font-semibold"
            style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
          >
            Sugerir uma igreja
          </h1>
        </div>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Cadastre uma igreja que você conhece. Nossa equipe revisa antes de publicar. Você não
          precisa estar logado, mas informe seu contato para caso precisemos confirmar algo.
        </p>

        <form onSubmit={onSubmit} className="space-y-6">
          <Section title="Dados da igreja">
            <Field
              label="Nome da igreja *"
              value={nome}
              onChange={setNome}
              placeholder="Paróquia Nossa Senhora da..."
              autoFocus
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs mb-2 tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
                >
                  Tipo *
                </label>
                <select
                  value={tipoIgreja}
                  onChange={e => setTipoIgreja(e.target.value as TipoIgreja | '')}
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none touch-target-lg"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.12)',
                    color: tipoIgreja ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                >
                  <option value="">Selecione</option>
                  {TIPOS_IGREJA.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Diocese"
                value={diocese}
                onChange={setDiocese}
                placeholder="Opcional"
              />
            </div>
            <Field
              label="CNPJ"
              value={cnpjMasked}
              onChange={v => setCnpjMasked(maskCnpj(v))}
              placeholder="00.000.000/0000-00 (opcional)"
              inputMode="numeric"
            />
            <Field
              label="Padre responsável"
              value={padreResponsavel}
              onChange={setPadreResponsavel}
              placeholder="Opcional"
            />
          </Section>

          <Section title="Endereço">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Cidade *" value={cidade} onChange={setCidade} placeholder="São Paulo" />
              <Field
                label="UF *"
                value={estado}
                onChange={v => setEstado(v.toUpperCase().slice(0, 2))}
                placeholder="SP"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Rua" value={rua} onChange={setRua} placeholder="Rua..." />
              <Field label="Número" value={numero} onChange={setNumero} placeholder="123" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bairro" value={bairro} onChange={setBairro} placeholder="Centro" />
              <Field label="CEP" value={cep} onChange={setCep} placeholder="00000-000" />
            </div>
          </Section>

          <Section title="Contato da igreja">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Telefone"
                value={telefone}
                onChange={setTelefone}
                placeholder="(11) 0000-0000"
                inputMode="tel"
              />
              <Field
                label="Email"
                value={emailIgreja}
                onChange={setEmailIgreja}
                placeholder="contato@paroquia.org.br"
                inputMode="email"
              />
            </div>
            <Field
              label="Site"
              value={site}
              onChange={setSite}
              placeholder="https://..."
              inputMode="url"
            />
          </Section>

          <Section title="Seus dados" subtitle="Para podermos falar com você se precisarmos.">
            <Field
              label="Seu nome *"
              value={submitterName}
              onChange={setSubmitterName}
              placeholder="Seu nome completo"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Seu email *"
                value={submitterEmail}
                onChange={setSubmitterEmail}
                placeholder="seu@email.com"
                inputMode="email"
              />
              <Field
                label="WhatsApp"
                value={submitterWhatsapp}
                onChange={setSubmitterWhatsapp}
                placeholder="(11) 90000-0000"
                inputMode="tel"
              />
            </div>
          </Section>

          {SITE_KEY && (
            <div className="flex justify-center">
              <div ref={turnstileRef} />
            </div>
          )}

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(107,29,42,0.15)',
                border: '1px solid rgba(107,29,42,0.3)',
                color: '#D94F5C',
                fontFamily: 'var(--font-body)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold touch-target-lg active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {saving ? (
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(15,14,12,0.3)', borderTopColor: '#0F0E0C' }}
              />
            ) : (
              <>
                <Church className="w-4 h-4" />
                Enviar sugestão
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5 space-y-4"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      <div>
        <h2
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ fontFamily: 'var(--font-elegant)', color: '#C9A84C' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
