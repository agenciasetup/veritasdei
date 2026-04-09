'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  Church, MapPin, Clock, Phone, Mail, Globe, Camera,
  AtSign, ArrowLeft, Plus, Trash2, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { HorarioMissa } from '@/types/paroquia'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
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
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canCreate = profile?.role === 'admin' || profile?.vocacao === 'padre' || profile?.vocacao === 'diacono'

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const [nome, setNome] = useState('')
  const [diocese, setDiocese] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [padreResponsavel, setPadreResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [instagramHandle, setInstagramHandle] = useState('')
  const [facebookHandle, setFacebookHandle] = useState('')
  const [site, setSite] = useState('')
  const [informacoesExtras, setInformacoesExtras] = useState('')
  const [horarios, setHorarios] = useState<HorarioMissa[]>([{ dia: 'Domingo', horario: '08:00' }])
  const [error, setError] = useState<string | null>(null)

  const addHorario = () => setHorarios(prev => [...prev, { dia: 'Domingo', horario: '08:00' }])
  const removeHorario = (i: number) => setHorarios(prev => prev.filter((_, idx) => idx !== i))
  const updateHorario = (i: number, field: keyof HorarioMissa, value: string) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h))
  }

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !supabase) return
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('paroquias').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('paroquias').getPublicUrl(path)
      setFotoUrl(data.publicUrl)
    }
    setUploadingFoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user) return

    if (!nome.trim() || !cidade.trim() || !estado.trim()) {
      setError('Nome, cidade e estado são obrigatórios.')
      return
    }

    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('paroquias').insert({
      nome: nome.trim(),
      diocese: diocese.trim() || null,
      endereco: endereco.trim() || null,
      cidade: cidade.trim(),
      estado,
      cep: cep.trim() || null,
      padre_responsavel: padreResponsavel.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      foto_url: fotoUrl,
      instagram: instagramHandle.trim() || null,
      facebook: facebookHandle.trim() || null,
      site: site.trim() || null,
      informacoes_extras: informacoesExtras.trim() || null,
      horarios_missa: horarios,
      criado_por: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
  }

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <Church className="w-12 h-12 mb-4" style={{ color: '#7A7368', opacity: 0.5 }} />
        <p className="text-lg text-center" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>
          Apenas administradores, padres e diáconos podem cadastrar paróquias.
        </p>
        <Link href="/paroquias" className="mt-4 text-sm underline" style={{ color: '#C9A84C' }}>
          Voltar para paróquias
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <CheckCircle className="w-16 h-16 mb-4" style={{ color: '#C9A84C' }} />
        <h2
          className="text-2xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          Paróquia Cadastrada!
        </h2>
        <p className="text-sm mb-6 text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          {profile?.role === 'admin'
            ? 'A paróquia foi aprovada automaticamente.'
            : 'Sua solicitação será analisada por um administrador.'}
        </p>
        <Link
          href="/paroquias"
          className="px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
          style={{
            fontFamily: 'Cinzel, serif',
            background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
            color: '#0A0A0A',
          }}
        >
          Ver Paróquias
        </Link>
      </div>
    )
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
          Cadastrar Paróquia
        </h1>
        <p className="text-sm mb-8" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Preencha as informações da paróquia. Ela será enviada para aprovação.
        </p>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(107,29,42,0.15)', border: '1px solid rgba(107,29,42,0.3)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={Camera} label="Foto da Paróquia" />
            {fotoUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden">
                <img src={fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFotoUrl(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)', color: '#D94F5C' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
                style={{ borderColor: 'rgba(201,168,76,0.15)', color: '#7A7368' }}
              >
                {uploadingFoto ? (
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }} />
                ) : (
                  <>
                    <Camera className="w-6 h-6" style={{ color: '#C9A84C' }} />
                    <span className="text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Clique para enviar foto</span>
                  </>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
          </div>

          {/* Basic Info */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={Church} label="Informações Básicas" />
            <Field label="Nome da Paróquia *" value={nome} onChange={setNome} placeholder="Ex: Paróquia São José" required />
            <Field label="Diocese" value={diocese} onChange={setDiocese} placeholder="Ex: Arquidiocese de São Paulo" />
            <Field label="Padre Responsável" value={padreResponsavel} onChange={setPadreResponsavel} placeholder="Nome do padre" />
          </div>

          {/* Address */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={MapPin} label="Endereço" />
            <Field label="Endereço" value={endereco} onChange={setEndereco} placeholder="Rua, número, bairro" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade *" value={cidade} onChange={setCidade} placeholder="Cidade" required />
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
                  Estado *
                </label>
                <select
                  value={estado} onChange={e => setEstado(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: estado ? '#F2EDE4' : '#7A7368', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                >
                  <option value="">UF</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
            <Field label="CEP" value={cep} onChange={setCep} placeholder="00000-000" />
          </div>

          {/* Horários de Missa */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={Clock} label="Horários de Missa" />
            {horarios.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <select
                  value={h.dia} onChange={e => updateHorario(i, 'dia', e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm appearance-none"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input
                  type="time" value={h.horario} onChange={e => updateHorario(i, 'horario', e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                />
                {horarios.length > 1 && (
                  <button type="button" onClick={() => removeHorario(i)} style={{ color: '#D94F5C' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button" onClick={addHorario}
              className="flex items-center gap-2 text-xs"
              style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar horário
            </button>
          </div>

          {/* Contact / Social */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <SectionTitle icon={Phone} label="Contato e Redes Sociais" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefone" value={telefone} onChange={setTelefone} placeholder="(00) 0000-0000" icon={Phone} />
              <Field label="E-mail" value={email} onChange={setEmail} placeholder="paroquia@email.com" icon={Mail} />
              <Field label="Instagram" value={instagramHandle} onChange={setInstagramHandle} placeholder="@paroquia" icon={AtSign} />
              <Field label="Site" value={site} onChange={setSite} placeholder="https://..." icon={Globe} />
            </div>
            <Field label="Facebook" value={facebookHandle} onChange={setFacebookHandle} placeholder="facebook.com/paroquia" />
          </div>

          {/* Extra info */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
              Informações Extras
            </label>
            <textarea
              value={informacoesExtras} onChange={e => setInformacoesExtras(e.target.value)}
              placeholder="Horários de confissão, grupos, pastorais..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            style={{
              fontFamily: 'Cinzel, serif',
              background: saving ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: saving ? '#7A7368' : '#0A0A0A',
            }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} />
            ) : (
              <>
                <Church className="w-4 h-4" />
                Cadastrar Paróquia
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
      <h3 className="text-xs tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
        {label}
      </h3>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, required, icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; icon?: React.ElementType
}) {
  return (
    <div>
      <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />}
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl text-sm`}
          style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
        />
      </div>
    </div>
  )
}
