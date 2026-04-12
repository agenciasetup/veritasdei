'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import type { FotoParoquia, HorarioMissa, Paroquia, TipoIgreja } from '@/types/paroquia'
import { TIPOS_IGREJA } from '@/types/paroquia'
import { maskCnpj, stripCnpj, isValidCnpj } from '@/lib/utils/cnpj'
import HorariosSection from '@/components/paroquias/HorariosSection'
import FotosGallery from '@/components/paroquias/FotosGallery'
import SeloVerificado from '@/components/paroquias/SeloVerificado'
import {
  Church,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  AtSign,
  ArrowLeft,
  Shield,
  Upload,
  FileText,
  Info,
  Save,
} from 'lucide-react'

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarPage({ params }: PageProps) {
  const { id } = use(params)
  return (
    <AuthGuard>
      <EditarContent id={id} />
    </AuthGuard>
  )
}

function EditarContent({ id }: { id: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paroquia, setParoquia] = useState<Paroquia | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Identidade
  const [nome, setNome] = useState('')
  const [cnpjMasked, setCnpjMasked] = useState('')
  const [tipoIgreja, setTipoIgreja] = useState<TipoIgreja | ''>('')
  const [diocese, setDiocese] = useState('')
  const [padreResponsavel, setPadreResponsavel] = useState('')

  // Endereço
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [complemento, setComplemento] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [pais, setPais] = useState('Brasil')
  const [cep, setCep] = useState('')

  // Horários
  const [horariosMissa, setHorariosMissa] = useState<HorarioMissa[]>([])
  const [horariosConfissao, setHorariosConfissao] = useState<HorarioMissa[]>([])

  // Fotos
  const [fotos, setFotos] = useState<FotoParoquia[]>([])

  // Contatos
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [facebookHandle, setFacebookHandle] = useState('')
  const [site, setSite] = useState('')
  const [informacoesExtras, setInformacoesExtras] = useState('')

  // Verificação
  const [verificacaoFile, setVerificacaoFile] = useState<File | null>(null)
  const [verificacaoNotas, setVerificacaoNotas] = useState('')

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    async function load() {
      const { data } = await supabase!
        .from('paroquias')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (cancelled) return
      const p = data as Paroquia | null
      setParoquia(p)
      if (p) {
        setNome(p.nome)
        setCnpjMasked(p.cnpj ? maskCnpj(p.cnpj) : '')
        setTipoIgreja((p.tipo_igreja ?? '') as TipoIgreja | '')
        setDiocese(p.diocese ?? '')
        setPadreResponsavel(p.padre_responsavel ?? '')
        setRua(p.rua ?? '')
        setNumero(p.numero ?? '')
        setBairro(p.bairro ?? '')
        setComplemento(p.complemento ?? '')
        setCidade(p.cidade ?? '')
        setEstado(p.estado ?? '')
        setPais(p.pais ?? 'Brasil')
        setCep(p.cep ?? '')
        setHorariosMissa(p.horarios_missa ?? [])
        setHorariosConfissao(p.horarios_confissao ?? [])
        setFotos(p.fotos ?? [])
        setTelefone(p.telefone ?? '')
        setEmail(p.email ?? '')
        setInstagramHandle(p.instagram ?? '')
        setFacebookHandle(p.facebook ?? '')
        setSite(p.site ?? '')
        setInformacoesExtras(p.informacoes_extras ?? '')
        setVerificacaoNotas(p.verificacao_notas ?? '')
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user || !paroquia) return

    if (!nome.trim() || !cidade.trim() || !estado.trim()) {
      setError('Nome, cidade e estado são obrigatórios.')
      return
    }
    if (!tipoIgreja) {
      setError('Selecione o tipo da igreja.')
      return
    }
    const cnpjDigits = stripCnpj(cnpjMasked)
    if (cnpjDigits && !isValidCnpj(cnpjDigits)) {
      setError('CNPJ inválido.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    const enderecoFormatado = [rua, numero, bairro].filter(Boolean).join(', ')

    const { error: updateError } = await supabase
      .from('paroquias')
      .update({
        nome: nome.trim(),
        cnpj: cnpjDigits || null,
        tipo_igreja: tipoIgreja,
        diocese: diocese.trim() || null,
        endereco: enderecoFormatado || null,
        rua: rua.trim() || null,
        numero: numero.trim() || null,
        bairro: bairro.trim() || null,
        complemento: complemento.trim() || null,
        cidade: cidade.trim(),
        estado,
        pais: pais.trim() || null,
        cep: cep.trim() || null,
        padre_responsavel: padreResponsavel.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        foto_url: fotos[0]?.url ?? null,
        fotos,
        instagram: instagramHandle.trim() || null,
        facebook: facebookHandle.trim() || null,
        site: site.trim() || null,
        informacoes_extras: informacoesExtras.trim() || null,
        horarios_missa: horariosMissa,
        horarios_confissao: horariosConfissao,
      })
      .eq('id', paroquia.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Upload do doc de verificação se novo
    if (verificacaoFile) {
      const ext = verificacaoFile.name.split('.').pop() ?? 'pdf'
      const path = `${user.id}/${paroquia.id}/doc-${Date.now()}.${ext}`
      const up = await supabase.storage
        .from('paroquia-documentos')
        .upload(path, verificacaoFile, { upsert: true })
      if (up.error) {
        console.error('[editar] Upload do documento falhou:', up.error)
        setError(`Não foi possível enviar o documento: ${up.error.message}`)
        setSaving(false)
        return
      }
      const { error: verifUpdateErr } = await supabase
        .from('paroquias')
        .update({
          verificacao_documento_path: path,
          verificacao_solicitada_em: new Date().toISOString(),
          verificacao_notas: verificacaoNotas.trim() || null,
        })
        .eq('id', paroquia.id)
      if (verifUpdateErr) {
        console.error('[editar] Falha ao registrar solicitação:', verifUpdateErr)
        setError(
          `Documento enviado, mas a solicitação de verificação não foi registrada: ${verifUpdateErr.message}`,
        )
        setSaving(false)
        return
      }
    } else if (verificacaoNotas && verificacaoNotas !== (paroquia.verificacao_notas ?? '')) {
      const { error: notasErr } = await supabase
        .from('paroquias')
        .update({ verificacao_notas: verificacaoNotas.trim() || null })
        .eq('id', paroquia.id)
      if (notasErr) {
        console.error('[editar] Falha ao atualizar observações:', notasErr)
      }
    }

    setSaving(false)
    setSuccess('Alterações salvas.')
    setTimeout(() => router.push(`/paroquias/${paroquia.id}`), 800)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  if (!paroquia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: '#7A7368' }}>Igreja não encontrada.</p>
      </div>
    )
  }

  const isOwner = user?.id === paroquia.owner_user_id
  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Shield className="w-10 h-10 mb-3" style={{ color: '#C9A84C', opacity: 0.6 }} />
        <p className="text-sm text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Apenas o responsável pela igreja pode editá-la.
        </p>
        <Link
          href={`/paroquias/${paroquia.id}`}
          className="mt-3 text-xs underline"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          href={`/paroquias/${paroquia.id}`}
          className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1
            className="text-2xl md:text-3xl font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Editar Igreja
          </h1>
          {paroquia.verificado && <SeloVerificado size="sm" />}
        </div>
        <p className="text-sm mb-8" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          {paroquia.nome}
        </p>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
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
        {success && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(76,175,80,0.12)',
              border: '1px solid rgba(76,175,80,0.3)',
              color: '#4CAF50',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FotosGallery value={fotos} onChange={setFotos} onError={setError} />

          {/* Identidade */}
          <Card>
            <SectionTitle icon={Church} label="Identidade" />
            <Field label="Nome *" value={nome} onChange={setNome} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs mb-2 tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                >
                  Tipo *
                </label>
                <select
                  value={tipoIgreja}
                  onChange={e => setTipoIgreja(e.target.value as TipoIgreja | '')}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.12)',
                    color: tipoIgreja ? '#F2EDE4' : '#7A7368',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                  }}
                >
                  <option value="">Selecione</option>
                  {TIPOS_IGREJA.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Field
                label="CNPJ"
                value={cnpjMasked}
                onChange={v => setCnpjMasked(maskCnpj(v))}
              />
            </div>
            <Field label="Diocese" value={diocese} onChange={setDiocese} />
            <Field label="Padre Responsável" value={padreResponsavel} onChange={setPadreResponsavel} />
          </Card>

          {/* Endereço */}
          <Card>
            <SectionTitle icon={MapPin} label="Endereço" />
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
              <Field label="Rua" value={rua} onChange={setRua} />
              <Field label="Número" value={numero} onChange={setNumero} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bairro" value={bairro} onChange={setBairro} />
              <Field label="Complemento" value={complemento} onChange={setComplemento} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade *" value={cidade} onChange={setCidade} required />
              <div>
                <label
                  className="block text-xs mb-2 tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                >
                  Estado *
                </label>
                <select
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.12)',
                    color: estado ? '#F2EDE4' : '#7A7368',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                  }}
                >
                  <option value="">UF</option>
                  {ESTADOS_BR.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="País" value={pais} onChange={setPais} />
              <Field label="CEP" value={cep} onChange={setCep} />
            </div>
          </Card>

          <HorariosSection
            label="Horários de Missa"
            icon={Clock}
            value={horariosMissa}
            onChange={setHorariosMissa}
          />
          <HorariosSection
            label="Horários de Confissão"
            icon={Clock}
            value={horariosConfissao}
            onChange={setHorariosConfissao}
            emptyMessage="Adicione os horários em que a igreja atende confissões."
          />

          {/* Contatos */}
          <Card>
            <SectionTitle icon={Phone} label="Contatos e Redes" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefone" value={telefone} onChange={setTelefone} icon={Phone} />
              <Field label="E-mail" value={email} onChange={setEmail} icon={Mail} />
              <Field label="Instagram" value={instagramHandle} onChange={setInstagramHandle} icon={AtSign} />
              <Field label="Site" value={site} onChange={setSite} icon={Globe} />
            </div>
            <Field label="Facebook" value={facebookHandle} onChange={setFacebookHandle} />
          </Card>

          {/* Info extras */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" style={{ color: '#C9A84C' }} />
              <label
                className="text-xs tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                Informações Extras
              </label>
            </div>
            <textarea
              value={informacoesExtras}
              onChange={e => setInformacoesExtras(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{
                background: 'rgba(10,10,10,0.6)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
            />
          </Card>

          {/* Verificação */}
          {!paroquia.verificado && (
            <Card highlight>
              <SectionTitle icon={Shield} label="Verificação" />
              <p className="text-xs mb-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                {paroquia.verificacao_solicitada_em
                  ? 'Sua solicitação está em análise. Você pode reenviar o documento se precisar.'
                  : 'Envie um documento que comprove a titularidade da igreja para liberar o feed.'}
              </p>
              <div className="mb-4">
                <label
                  className="block text-xs mb-2 tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                >
                  Documento
                </label>
                <label
                  className="w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    borderColor: 'rgba(201,168,76,0.15)',
                    color: verificacaoFile ? '#C9A84C' : '#7A7368',
                  }}
                >
                  {verificacaoFile ? (
                    <>
                      <FileText className="w-4 h-4" />
                      <span className="text-xs truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {verificacaoFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {paroquia.verificacao_documento_path ? 'Substituir documento' : 'Clique para anexar'}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null
                      if (f && f.size > 10 * 1024 * 1024) {
                        setError('Documento deve ter no máximo 10MB.')
                        return
                      }
                      setVerificacaoFile(f)
                    }}
                  />
                </label>
              </div>
              <div>
                <label
                  className="block text-xs mb-2 tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                >
                  Observações
                </label>
                <textarea
                  value={verificacaoNotas}
                  onChange={e => setVerificacaoNotas(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.12)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                  }}
                />
              </div>
            </Card>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
            style={{
              fontFamily: 'Cinzel, serif',
              background: saving
                ? 'rgba(201,168,76,0.15)'
                : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: saving ? '#7A7368' : '#0A0A0A',
            }}
          >
            {saving ? (
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }}
              />
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar alterações
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function Card({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{
        background: 'rgba(16,16,16,0.7)',
        border: highlight ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
      <h3
        className="text-xs tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        {label}
      </h3>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  icon?: React.ElementType
}) {
  return (
    <div>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#7A7368' }}
          />
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl text-sm`}
          style={{
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}
