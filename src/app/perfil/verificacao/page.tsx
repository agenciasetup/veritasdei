'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import AuthGuard from '@/components/auth/AuthGuard'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  Shield, Upload, FileText, CheckCircle, XCircle, Hourglass,
  ArrowLeft, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

interface Verificacao {
  id: string
  status: string
  tipo: string
  documento_url: string | null
  notas: string | null
  motivo_rejeicao: string | null
  created_at: string
}

const VOCACAO_DOC_INFO: Record<string, { label: string; docs: string }> = {
  padre: { label: 'Padre', docs: 'Celebret ou documento que comprove sua ordenacao' },
  bispo: { label: 'Bispo', docs: 'Celebret ou documento episcopal' },
  cardeal: { label: 'Cardeal', docs: 'Documento cardinalicio' },
  papa: { label: 'Papa', docs: 'Documento pontificio' },
  diacono: { label: 'Diacono', docs: 'Provisao diaconal ou certidao de ordenacao' },
  catequista: { label: 'Catequista', docs: 'Seu padre pode autorizar pelo painel dele, ou envie uma declaracao da paroquia' },
}

export default function VerificacaoPage() {
  return (
    <AuthGuard>
      <VerificacaoContent />
    </AuthGuard>
  )
}

function VerificacaoContent() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [verificacao, setVerificacao] = useState<Verificacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notas, setNotas] = useState('')
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const vocacao = profile?.vocacao ?? 'leigo'
  const needsVerification = vocacao !== 'leigo'
  const isVerified = profile?.verified === true
  const docInfo = VOCACAO_DOC_INFO[vocacao]

  useEffect(() => {
    if (!supabase || !user) return
    async function load() {
      const { data } = await supabase!
        .from('verificacoes')
        .select('id, status, tipo, documento_url, notas, motivo_rejeicao, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setVerificacao(data as Verificacao | null)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0]
    if (!raw || !user || !supabase) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(raw.type)) {
      setError('Formato inválido. Envie uma imagem (JPG, PNG, WebP) ou PDF.')
      return
    }
    if (raw.size > 10 * 1024 * 1024) {
      setError('Arquivo deve ter no máximo 10MB.')
      return
    }

    setUploading(true)
    setError(null)
    // compressImage passa PDFs direto; comprime imagens.
    const { file } = await compressImage(raw)
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('verificacoes').upload(path, file)
    if (uploadError) {
      setError('Erro ao enviar documento. Tente novamente.')
    } else {
      // Store the path — bucket is private, so getPublicUrl won't work
      setDocUrl(path)
    }
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!supabase || !user || !docUrl) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('verificacoes').insert({
      user_id: user.id,
      tipo: vocacao,
      documento_url: docUrl,
      notas: notas.trim() || null,
      status: 'pendente',
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    // Reload
    const { data } = await supabase
      .from('verificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setVerificacao(data as Verificacao | null)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />
      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Perfil
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <Shield className="w-6 h-6" style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Verificacao
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <VocacaoIcon vocacao={vocacao} size={16} />
              <span className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                {docInfo?.label ?? vocacao}
              </span>
            </div>
          </div>
        </div>

        {/* Already verified */}
        {isVerified && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)' }}
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#4CAF50' }} />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
              Perfil Verificado
            </h2>
            <p className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              Seu perfil foi verificado com sucesso. Voce possui o selo de verificacao.
            </p>
          </div>
        )}

        {/* Leigo doesn't need verification */}
        {!needsVerification && !isVerified && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <VocacaoIcon vocacao="leigo" size={48} className="mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
              Verificacao nao necessaria
            </h2>
            <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Como leigo, voce nao precisa de verificacao. Se sua vocacao mudou, atualize no seu perfil.
            </p>
          </div>
        )}

        {/* Pending verification */}
        {needsVerification && !isVerified && verificacao?.status === 'pendente' && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <Hourglass className="w-16 h-16 mx-auto mb-4" style={{ color: '#C9A84C' }} />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
              Verificacao em Analise
            </h2>
            <p className="text-sm mb-2" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              Seu documento foi enviado e esta sendo analisado pela equipe.
            </p>
            <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Enviado em {new Date(verificacao.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        {/* Rejected */}
        {needsVerification && !isVerified && verificacao?.status === 'rejeitado' && (
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(217,79,92,0.08)', border: '1px solid rgba(217,79,92,0.2)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="w-5 h-5" style={{ color: '#D94F5C' }} />
                <h3 className="text-base font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#D94F5C' }}>
                  Verificacao Rejeitada
                </h3>
              </div>
              {verificacao.motivo_rejeicao && (
                <p className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                  Motivo: {verificacao.motivo_rejeicao}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: '#7A7368' }}>
                Voce pode enviar um novo documento abaixo.
              </p>
            </div>

            {/* Show submit form again */}
            <SubmitForm
              docInfo={docInfo}
              docUrl={docUrl}
              setDocUrl={setDocUrl}
              notas={notas}
              setNotas={setNotas}
              uploading={uploading}
              submitting={submitting}
              error={error}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {/* New submission */}
        {needsVerification && !isVerified && !verificacao && (
          <SubmitForm
            docInfo={docInfo}
            docUrl={docUrl}
            setDocUrl={setDocUrl}
            notas={notas}
            setNotas={setNotas}
            uploading={uploading}
            submitting={submitting}
            error={error}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}

function SubmitForm({
  docInfo, docUrl, setDocUrl, notas, setNotas, uploading, submitting, error,
  fileInputRef, onFileUpload, onSubmit,
}: {
  docInfo: { label: string; docs: string } | undefined
  docUrl: string | null
  setDocUrl: (v: string | null) => void
  notas: string
  setNotas: (v: string) => void
  uploading: boolean
  submitting: boolean
  error: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      {/* Info */}
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)' }}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
        <p className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
          {docInfo?.docs ?? 'Envie um documento que comprove sua vocacao.'}
        </p>
      </div>

      {/* Upload */}
      {docUrl ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
          <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#C9A84C' }} />
          <span className="flex-1 text-sm truncate" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
            Documento enviado
          </span>
          <button onClick={() => setDocUrl(null)} className="text-xs underline" style={{ color: '#D94F5C' }}>
            Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
          style={{ borderColor: 'rgba(201,168,76,0.15)', color: '#7A7368' }}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }} />
          ) : (
            <>
              <Upload className="w-6 h-6" style={{ color: '#C9A84C' }} />
              <span className="text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Enviar documento (PDF ou imagem)</span>
            </>
          )}
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={onFileUpload} className="hidden" />

      {/* Notes */}
      <div>
        <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
          Observacoes (opcional)
        </label>
        <textarea
          value={notas} onChange={e => setNotas(e.target.value)}
          placeholder="Informacoes adicionais para a verificacao..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
          style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting || !docUrl}
        className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
        style={{
          fontFamily: 'Cinzel, serif',
          background: !docUrl || submitting ? 'rgba(201,168,76,0.1)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
          color: !docUrl || submitting ? '#7A7368' : '#0A0A0A',
          cursor: !docUrl ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} />
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Solicitar Verificacao
          </>
        )}
      </button>
    </div>
  )
}
