'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  Church, MapPin, Clock, Phone, Mail, Globe,
  AtSign, ArrowLeft, Shield, Upload, FileText, Info,
} from 'lucide-react'
import Link from 'next/link'
import type { FotoParoquia, HorarioMissa, TipoIgreja } from '@/types/paroquia'
import { TIPOS_IGREJA } from '@/types/paroquia'
import { maskCnpj, stripCnpj, isValidCnpj } from '@/lib/utils/cnpj'
import GooglePlacesAutocomplete, { type AddressData } from '@/components/GooglePlacesAutocomplete'
import HorariosSection from '@/components/paroquias/HorariosSection'
import FotosGallery from '@/components/paroquias/FotosGallery'

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export default function CadastrarParoquiaPage() {
  return (
    <AuthGuard>
      <CadastrarContent />
    </AuthGuard>
  )
}

function CadastrarContent() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)

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
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // Horários
  const [horariosMissa, setHorariosMissa] = useState<HorarioMissa[]>([
    { dia: 'Domingo', horario: '08:00' },
  ])
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

  const [error, setError] = useState<string | null>(null)

  const handlePlaceSelect = (data: AddressData) => {
    setRua(data.rua)
    setNumero(data.numero)
    setBairro(data.bairro)
    setCidade(data.cidade)
    setEstado(data.estado)
    setPais(data.pais || 'Brasil')
    setCep(data.cep)
    setLatitude(data.latitude)
    setLongitude(data.longitude)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user) return

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

    try {
      const enderecoFormatado = [rua, numero, bairro].filter(Boolean).join(', ')

      const { data: inserted, error: insertError } = await supabase
        .from('paroquias')
        .insert({
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
          latitude,
          longitude,
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
          status: 'aprovada',
          criado_por: user.id,
          owner_user_id: user.id,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        console.error('[cadastrar] Insert error:', insertError)
        setError(insertError?.message ?? 'Erro ao cadastrar.')
        setSaving(false)
        return
      }

      // Se enviou documento, subir e solicitar verificação
      if (verificacaoFile) {
        const ext = verificacaoFile.name.split('.').pop() ?? 'pdf'
        const path = `${user.id}/${inserted.id}/doc-${Date.now()}.${ext}`
        const up = await supabase.storage
          .from('paroquia-documentos')
          .upload(path, verificacaoFile, { upsert: true })
        if (up.error) {
          console.error('[cadastrar] Upload do documento falhou:', up.error)
          setError(
            `Igreja cadastrada, mas não foi possível enviar o documento de verificação: ${up.error.message}`,
          )
          setSaving(false)
          router.push(`/paroquias/${inserted.id}`)
          return
        }
        const { error: verifUpdateErr } = await supabase
          .from('paroquias')
          .update({
            verificacao_documento_path: path,
            verificacao_solicitada_em: new Date().toISOString(),
            verificacao_notas: verificacaoNotas.trim() || null,
          })
          .eq('id', inserted.id)
        if (verifUpdateErr) {
          console.error('[cadastrar] Falha ao registrar solicitação:', verifUpdateErr)
          setError(
            `Igreja cadastrada e documento enviado, mas a solicitação de verificação não foi registrada: ${verifUpdateErr.message}`,
          )
          setSaving(false)
          router.push(`/paroquias/${inserted.id}`)
          return
        }
      }

      router.push(`/paroquias/${inserted.id}`)
    } catch (err) {
      console.error('[cadastrar] Unexpected error:', err)
      setError('Erro inesperado ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          href="/paroquias"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1
          className="text-2xl md:text-3xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Cadastrar Igreja
        </h1>
        <p className="text-sm mb-8" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Preencha os dados da igreja. Ela ficará pública imediatamente, mas apenas
          igrejas <strong>verificadas</strong> pelo time Veritas Dei poderão publicar
          avisos no feed.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Galeria */}
          <FotosGallery value={fotos} onChange={setFotos} onError={setError} />

          {/* Identidade */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={Church} label="Identidade" />
            <Field
              label="Nome da Igreja *"
              value={nome}
              onChange={setNome}
              placeholder="Ex: Paróquia São José"
              required
            />

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
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="CNPJ"
                value={cnpjMasked}
                onChange={v => setCnpjMasked(maskCnpj(v))}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <Field
              label="Diocese"
              value={diocese}
              onChange={setDiocese}
              placeholder="Ex: Arquidiocese de São Paulo"
            />
            <Field
              label="Padre Responsável"
              value={padreResponsavel}
              onChange={setPadreResponsavel}
              placeholder="Nome do padre"
            />
          </div>

          {/* Endereço */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={MapPin} label="Endereço" />

            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Buscar Endereço
              </label>
              <GooglePlacesAutocomplete onSelect={handlePlaceSelect} />
              <p
                className="text-xs mt-1.5"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Selecione uma sugestão para preencher os campos automaticamente
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
              <Field label="Rua" value={rua} onChange={setRua} placeholder="Nome da rua" />
              <Field label="Número" value={numero} onChange={setNumero} placeholder="Nº" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bairro" value={bairro} onChange={setBairro} placeholder="Bairro" />
              <Field
                label="Complemento"
                value={complemento}
                onChange={setComplemento}
                placeholder="Apto, sala, bloco..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade *" value={cidade} onChange={setCidade} placeholder="Cidade" required />
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
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="País" value={pais} onChange={setPais} placeholder="País" />
              <Field label="CEP" value={cep} onChange={setCep} placeholder="00000-000" />
            </div>
          </div>

          {/* Horários de Missa */}
          <HorariosSection
            label="Horários de Missa"
            icon={Clock}
            value={horariosMissa}
            onChange={setHorariosMissa}
          />

          {/* Horários de Confissão */}
          <HorariosSection
            label="Horários de Confissão"
            icon={Clock}
            value={horariosConfissao}
            onChange={setHorariosConfissao}
            emptyMessage="Adicione os horários em que a igreja atende confissões."
          />

          {/* Contatos */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={Phone} label="Contatos e Redes Sociais" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Telefone"
                value={telefone}
                onChange={setTelefone}
                placeholder="(00) 0000-0000"
                icon={Phone}
              />
              <Field
                label="E-mail"
                value={email}
                onChange={setEmail}
                placeholder="paroquia@email.com"
                icon={Mail}
              />
              <Field
                label="Instagram"
                value={instagramHandle}
                onChange={setInstagramHandle}
                placeholder="@paroquia"
                icon={AtSign}
              />
              <Field
                label="Site"
                value={site}
                onChange={setSite}
                placeholder="https://..."
                icon={Globe}
              />
            </div>
            <Field
              label="Facebook"
              value={facebookHandle}
              onChange={setFacebookHandle}
              placeholder="facebook.com/paroquia"
            />
          </div>

          {/* Informações extras */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
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
              placeholder="Grupos, pastorais, horários especiais..."
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
          </div>

          {/* Solicitar verificação */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: 'rgba(16,16,16,0.7)',
              border: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <SectionTitle icon={Shield} label="Solicitar Verificação (opcional)" />
            <p
              className="text-xs"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Envie um documento que comprove a titularidade da igreja (ex.: cartão CNPJ,
              decreto de criação da paróquia, carta da diocese). Nosso time analisa e concede
              o <strong>selo de verificado</strong>, que libera a publicação de avisos no feed.
            </p>

            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Documento (PDF ou imagem)
              </label>
              <label
                className="w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  borderColor: 'rgba(201,168,76,0.15)',
                  color: verificacaoFile ? '#C9A84C' : '#7A7368',
                  background: 'transparent',
                }}
              >
                {verificacaoFile ? (
                  <>
                    <FileText className="w-4 h-4" />
                    <span
                      className="text-xs truncate"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {verificacaoFile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Clique para anexar
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
                Observações (opcional)
              </label>
              <textarea
                value={verificacaoNotas}
                onChange={e => setVerificacaoNotas(e.target.value)}
                rows={3}
                placeholder="Contexto adicional que ajude nosso time a validar..."
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
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
                <Church className="w-4 h-4" />
                Cadastrar Igreja
              </>
            )}
          </button>
        </form>
      </div>
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
  label, value, onChange, placeholder, required, icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
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
          placeholder={placeholder}
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
