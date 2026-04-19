'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BadgeCheck, CheckCircle, Church, FileText, Upload } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import { Field } from '../../cadastrar/components/Field'
import { submitClaim } from './actions'

interface Props {
  paroquia: {
    id: string
    nome: string
    cidade: string
    estado: string
    foto_url: string | null
  }
  userId: string
  isOrphan: boolean
  pendingClaim: { id: string; role_solicitada: string; created_at: string } | null
  prefill: { nome: string; email: string; whatsapp: string }
}

export default function ClaimForm({
  paroquia,
  userId,
  isOrphan,
  pendingClaim,
  prefill,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState(prefill.nome)
  const [email, setEmail] = useState(prefill.email)
  const [whatsapp, setWhatsapp] = useState(prefill.whatsapp)
  const [relacao, setRelacao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [documento, setDocumento] = useState<File | null>(null)
  const [roleSolicitada, setRoleSolicitada] = useState<'admin' | 'moderator'>(
    isOrphan ? 'admin' : 'moderator',
  )

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (pendingClaim) {
    return (
      <CenterMessage
        icon={CheckCircle}
        title="Reivindicação em análise"
        body={`Você já enviou uma solicitação para "${paroquia.nome}" como ${pendingClaim.role_solicitada === 'admin' ? 'administrador' : 'moderador'}. Aguarde a revisão.`}
        primaryHref="/conta/minhas-igrejas"
        primaryLabel="Minhas igrejas"
        secondaryHref={`/paroquias/${paroquia.id}`}
        secondaryLabel="Voltar à igreja"
      />
    )
  }

  if (done) {
    return (
      <CenterMessage
        icon={CheckCircle}
        title="Reivindicação enviada!"
        body={`Um administrador vai revisar sua solicitação para "${paroquia.nome}" em breve. Você receberá uma notificação assim que houver resposta.`}
        primaryHref="/conta/minhas-igrejas"
        primaryLabel="Minhas igrejas"
        secondaryHref={`/paroquias/${paroquia.id}`}
        secondaryLabel="Voltar à igreja"
      />
    )
  }

  async function uploadDocumento(file: File): Promise<string | null> {
    setUploading(true)
    setError(null)
    try {
      // Comprime se for imagem; PDFs passam direto (compressImage
      // reconhece tipos não-imagem e devolve original sem recomprimir).
      const isImage = file.type.startsWith('image/')
      const prepared = isImage ? (await compressImage(file)).file : file
      const ext = (prepared.name.split('.').pop() ?? 'bin').toLowerCase()
      const path = `claims/${userId}/${paroquia.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('paroquia-documentos')
        .upload(path, prepared, { upsert: true })
      if (upErr) {
        setError(`Falha no upload: ${upErr.message}`)
        return null
      }
      return path
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nome.trim()) return setError('Informe seu nome.')
    if (!email.trim()) return setError('Informe seu email.')

    setSaving(true)

    let documentoPath: string | null = null
    if (documento) {
      documentoPath = await uploadDocumento(documento)
      if (!documentoPath) {
        setSaving(false)
        return
      }
    }

    const result = await submitClaim({
      paroquiaId: paroquia.id,
      nome: nome.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || null,
      relacao: relacao.trim() || null,
      roleSolicitada,
      mensagem: mensagem.trim() || null,
      documentoPath,
    })

    if (!result.ok) {
      setError(result.error)
      setSaving(false)
      return
    }

    setDone(true)
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="bg-glow" aria-hidden />
      <div className="max-w-2xl mx-auto relative z-10 px-4 md:px-8 pt-6">
        <Link
          href={`/paroquias/${paroquia.id}`}
          className="inline-flex items-center gap-2 text-sm mb-4"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div
          className="rounded-2xl p-5 mb-6 flex gap-4 items-center"
          style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.15)' }}
        >
          {paroquia.foto_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={paroquia.foto_url}
              alt={paroquia.nome}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <Church className="w-6 h-6" style={{ color: '#C9A84C' }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-semibold truncate"
              style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
            >
              {paroquia.nome}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {paroquia.cidade}, {paroquia.estado}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <BadgeCheck className="w-6 h-6" style={{ color: '#C9A84C' }} />
          <h1
            className="text-2xl md:text-3xl font-semibold"
            style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
          >
            {isOrphan ? 'Reivindicar esta igreja' : 'Solicitar ser representante'}
          </h1>
        </div>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {isOrphan
            ? 'Esta igreja ainda não tem um representante oficial. Você será o primeiro administrador assim que sua solicitação for aprovada.'
            : 'Esta igreja já tem administradores. Sua solicitação passa primeiro pela revisão deles (ou da equipe Veritas Dei) antes de você ganhar acesso.'}
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          {!isOrphan && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
            >
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
              >
                Tipo de acesso solicitado
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RoleChoice
                  active={roleSolicitada === 'moderator'}
                  onClick={() => setRoleSolicitada('moderator')}
                  title="Moderador"
                  desc="Editar dados, horários, postar no feed"
                />
                <RoleChoice
                  active={roleSolicitada === 'admin'}
                  onClick={() => setRoleSolicitada('admin')}
                  title="Administrador"
                  desc="Tudo acima + gerenciar equipe"
                  note="Apenas admins Veritas Dei aprovam esta opção"
                />
              </div>
            </div>
          )}

          <div
            className="rounded-2xl p-4 md:p-5 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <h2
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ fontFamily: 'var(--font-elegant)', color: '#C9A84C' }}
            >
              Seus dados
            </h2>
            <Field label="Nome completo *" value={nome} onChange={setNome} placeholder="Seu nome" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Email *"
                value={email}
                onChange={setEmail}
                placeholder="seu@email.com"
                inputMode="email"
              />
              <Field
                label="WhatsApp"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="(11) 90000-0000"
                inputMode="tel"
              />
            </div>
            <Field
              label="Sua relação com a igreja"
              value={relacao}
              onChange={setRelacao}
              placeholder="Pároco, secretário, voluntário..."
            />
          </div>

          <div
            className="rounded-2xl p-4 md:p-5 space-y-3"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <h2
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ fontFamily: 'var(--font-elegant)', color: '#C9A84C' }}
            >
              Documento comprobatório
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Envie um documento que comprove seu vínculo: declaração do pároco, contrato, foto com
              crachá, registro eclesiástico, etc. PDF ou imagem (máx. 10MB).
            </p>
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm cursor-pointer hover:opacity-90"
              style={{
                background: 'rgba(10,10,10,0.6)',
                border: '1px dashed rgba(201,168,76,0.3)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Upload className="w-4 h-4" style={{ color: '#C9A84C' }} />
              <span className="flex-1 truncate">
                {documento ? documento.name : 'Selecionar arquivo'}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f && f.size > 10 * 1024 * 1024) {
                    setError('Arquivo grande demais (máx. 10MB).')
                    return
                  }
                  setDocumento(f ?? null)
                }}
                className="hidden"
              />
            </label>
            {documento && (
              <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <FileText className="w-3 h-3" />
                {Math.round(documento.size / 1024)} KB
              </p>
            )}
          </div>

          <div
            className="rounded-2xl p-4 md:p-5 space-y-3"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <h2
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ fontFamily: 'var(--font-elegant)', color: '#C9A84C' }}
            >
              Mensagem (opcional)
            </h2>
            <textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              placeholder="Conte mais sobre sua relação com a igreja para ajudar na aprovação."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(10,10,10,0.6)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

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
            disabled={saving || uploading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold touch-target-lg active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {saving || uploading ? (
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(15,14,12,0.3)', borderTopColor: '#0F0E0C' }}
              />
            ) : (
              <>
                <BadgeCheck className="w-4 h-4" />
                Enviar reivindicação
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function RoleChoice({
  active,
  onClick,
  title,
  desc,
  note,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
  note?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl p-3 transition-all active:scale-[0.98]"
      style={{
        background: active ? 'rgba(201,168,76,0.1)' : 'rgba(10,10,10,0.6)',
        border: active ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(201,168,76,0.12)',
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: active ? '#C9A84C' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
      >
        {title}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {desc}
      </p>
      {note && (
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
          {note}
        </p>
      )}
    </button>
  )
}

function CenterMessage({
  icon: Icon,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: React.ElementType
  title: string
  body: string
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
}) {
  return (
    <div className="min-h-screen px-4 py-10 relative">
      <div className="bg-glow" aria-hidden />
      <div className="max-w-md mx-auto relative z-10 text-center mt-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          <Icon className="w-8 h-8" style={{ color: '#C9A84C' }} />
        </div>
        <h1
          className="text-2xl font-semibold mb-3"
          style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {body}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href={secondaryHref}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {secondaryLabel}
          </Link>
          <Link
            href={primaryHref}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
