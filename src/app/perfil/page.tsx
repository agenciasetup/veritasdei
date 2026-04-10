'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  VOCACOES, SACRAMENTOS,
  type Vocacao, type Sacramento, type ProfileUpdate,
} from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  User, Camera, Save, Church, MapPin, Heart, BookOpen,
  CheckCircle, Phone, Calendar, Shield, AtSign, GraduationCap,
  Share2, CreditCard, FileText,
} from 'lucide-react'
import { isValidCpf, maskCpf, stripCpf } from '@/lib/utils/cpf'
import Link from 'next/link'

type MainTab = 'editar' | 'carteirinha'
type Section = 'pessoal' | 'endereco' | 'fe' | 'social'

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'pessoal', label: 'Dados Pessoais', icon: User },
  { key: 'endereco', label: 'Endereço', icon: MapPin },
  { key: 'fe', label: 'Vida de Fé', icon: Church },
  { key: 'social', label: 'Social', icon: Heart },
]

export default function PerfilPage() {
  return (
    <AuthGuard>
      <PerfilContent />
    </AuthGuard>
  )
}

function PerfilContent() {
  const { profile, refreshProfile, user } = useAuth()
  const supabase = createClient()!
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mainTab, setMainTab] = useState<MainTab>('editar')
  const [section, setSection] = useState<Section>('pessoal')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form state
  const [form, setForm] = useState<ProfileUpdate>({})

  const [cpfDisplay, setCpfDisplay] = useState('')
  const [cpfError, setCpfError] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        cpf: profile.cpf ?? '',
        vocacao: profile.vocacao,
        genero: profile.genero,
        data_nascimento: profile.data_nascimento,
        instagram: profile.instagram ?? '',
        whatsapp: profile.whatsapp ?? '',
        endereco: profile.endereco ?? '',
        cidade: profile.cidade ?? '',
        estado: profile.estado ?? '',
        pais: profile.pais ?? 'Brasil',
        cep: profile.cep ?? '',
        paroquia: profile.paroquia ?? '',
        diocese: profile.diocese ?? '',
        tempo_catolico: profile.tempo_catolico ?? '',
        sacramentos: profile.sacramentos ?? [],
        pastoral: profile.pastoral ?? '',
        veio_de_outra_religiao: profile.veio_de_outra_religiao ?? false,
        religiao_anterior: profile.religiao_anterior ?? '',
        comunidade: profile.comunidade ?? '',
      })
      setCpfDisplay(profile.cpf ? maskCpf(profile.cpf) : '')
    }
  }, [profile])

  const updateField = (key: keyof ProfileUpdate, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const toggleSacramento = (s: Sacramento) => {
    const current = (form.sacramentos ?? []) as Sacramento[]
    if (current.includes(s)) {
      updateField('sacramentos', current.filter(x => x !== s))
    } else {
      updateField('sacramentos', [...current, s])
    }
  }

  const handleSave = async () => {
    if (!user) return

    // Validate CPF if provided
    const cpfRaw = stripCpf(cpfDisplay)
    if (cpfRaw.length > 0 && !isValidCpf(cpfRaw)) {
      setCpfError('CPF inválido. Verifique os dígitos.')
      return
    }
    setCpfError('')

    setSaving(true)

    const updateData = {
      ...form,
      cpf: cpfRaw.length === 11 ? cpfRaw : null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (!error) {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }

    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    setUploadingAvatar(true)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase
        .from('profiles')
        .update({ profile_image_url: data.publicUrl })
        .eq('id', user.id)
      await refreshProfile()
    }

    setUploadingAvatar(false)
  }

  const avatarUrl = profile?.profile_image_url

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: avatarUrl ? 'transparent' : 'rgba(201,168,76,0.08)',
                border: '2px solid rgba(201,168,76,0.2)',
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" style={{ color: '#C9A84C' }} />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'rgba(201,168,76,0.2)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#C9A84C',
              }}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
                />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <h1
              className="text-2xl font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Meu Perfil
            </h1>
            <p className="text-sm mt-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              {profile?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: '#C9A84C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <VocacaoIcon vocacao={profile?.vocacao ?? 'leigo'} size={14} />
                {' '}{VOCACOES.find(v => v.value === profile?.vocacao)?.label ?? 'Leigo'}
              </span>
              <span
                className="text-xs px-2.5 py-1 rounded-full uppercase"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  color: '#7A7368',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Plano {profile?.plan ?? 'free'}
              </span>
              {profile?.verified ? (
                <span
                  className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{
                    background: 'rgba(76,175,80,0.1)',
                    border: '1px solid rgba(76,175,80,0.2)',
                    color: '#66BB6A',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Shield className="w-3 h-3" /> Verificado
                </span>
              ) : profile?.vocacao && profile.vocacao !== 'leigo' ? (
                <Link
                  href="/perfil/verificacao"
                  className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Shield className="w-3 h-3" /> Verificar perfil
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Catechist Authorization - for verified priests */}
        {profile?.verified && ['padre', 'bispo', 'cardeal', 'papa'].includes(profile?.vocacao ?? '') && (
          <Link
            href="/perfil/catequistas"
            className="flex items-center gap-3 rounded-xl p-4 mb-6 transition-all hover:opacity-90"
            style={{
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.12)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,168,76,0.1)' }}
            >
              <GraduationCap className="w-5 h-5" style={{ color: '#C9A84C' }} />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium block" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                Autorizar Catequistas
              </span>
              <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Registre e-mails de catequistas para verificação automática
              </span>
            </div>
          </Link>
        )}

        {/* Main Tab Bar */}
        <div className="flex gap-3 mb-6">
          {([
            { key: 'editar' as MainTab, label: 'Editar Perfil', icon: User },
            { key: 'carteirinha' as MainTab, label: 'Carteirinha', icon: CreditCard },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
              style={{
                fontFamily: 'Cinzel, serif',
                background: mainTab === key
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.08) 100%)'
                  : 'rgba(16,16,16,0.6)',
                border: mainTab === key
                  ? '1px solid rgba(201,168,76,0.35)'
                  : '1px solid rgba(201,168,76,0.08)',
                color: mainTab === key ? '#C9A84C' : '#7A7368',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* EDITAR PERFIL TAB                      */}
        {/* ═══════════════════════════════════════ */}
        {mainTab === 'editar' && (
          <>
            {/* Section Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    background: section === key ? 'rgba(201,168,76,0.12)' : 'rgba(16,16,16,0.6)',
                    border: section === key
                      ? '1px solid rgba(201,168,76,0.25)'
                      : '1px solid rgba(201,168,76,0.08)',
                    color: section === key ? '#C9A84C' : '#7A7368',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content Card */}
            <div
              className="rounded-2xl p-6 md:p-8"
              style={{
                background: 'rgba(16,16,16,0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(201,168,76,0.15)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
              }}
            >
              {/* ═══ DADOS PESSOAIS ═══ */}
              {section === 'pessoal' && (
                <div className="space-y-5">
                  <SectionTitle icon={User} title="Dados Pessoais" />

                  {/* User ID badge */}
                  {profile?.user_number && (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        color: '#C9A84C',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      ID: #{String(profile.user_number).padStart(6, '0')}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Nome completo"
                      value={(form.name as string) ?? ''}
                      onChange={(v) => updateField('name', v)}
                    />
                    <div>
                      <label
                        className="block text-xs mb-2 tracking-wider uppercase"
                        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                      >
                        CPF <span style={{ color: '#C9A84C', fontSize: '10px' }}>(obrigatório para contagem)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7A7368' }}>
                          <FileText className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={cpfDisplay}
                          onChange={(e) => {
                            const masked = maskCpf(e.target.value)
                            setCpfDisplay(masked)
                            setCpfError('')
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                          style={{
                            background: 'rgba(10,10,10,0.6)',
                            border: cpfError
                              ? '1px solid rgba(220,38,38,0.5)'
                              : '1px solid rgba(201,168,76,0.12)',
                            color: '#F2EDE4',
                            fontFamily: 'Poppins, sans-serif',
                            outline: 'none',
                            paddingLeft: '2.5rem',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = cpfError ? 'rgba(220,38,38,0.7)' : 'rgba(201,168,76,0.4)'
                            e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = cpfError ? 'rgba(220,38,38,0.5)' : 'rgba(201,168,76,0.12)'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                      {cpfError && (
                        <p className="text-xs mt-1.5" style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>
                          {cpfError}
                        </p>
                      )}
                    </div>
                    <FormSelect
                      label="Gênero"
                      value={form.genero ?? ''}
                      onChange={(v) => updateField('genero', v || null)}
                      options={[
                        { value: '', label: 'Selecione' },
                        { value: 'masculino', label: 'Masculino' },
                        { value: 'feminino', label: 'Feminino' },
                      ]}
                    />
                    <FormInput
                      label="Data de nascimento"
                      type="date"
                      value={form.data_nascimento ?? ''}
                      onChange={(v) => updateField('data_nascimento', v || null)}
                    />
                  </div>

                  {/* Vocação */}
                  <div>
                    <label
                      className="block text-xs mb-3 tracking-wider uppercase"
                      style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                    >
                      Vocação
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {VOCACOES.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => updateField('vocacao', v.value)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all"
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            background: form.vocacao === v.value ? 'rgba(201,168,76,0.12)' : 'rgba(10,10,10,0.5)',
                            border: form.vocacao === v.value
                              ? '1px solid rgba(201,168,76,0.3)'
                              : '1px solid rgba(201,168,76,0.08)',
                            color: form.vocacao === v.value ? '#C9A84C' : '#7A7368',
                          }}
                        >
                          <VocacaoIcon vocacao={v.value} size={16} />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ENDEREÇO ═══ */}
              {section === 'endereco' && (
                <div className="space-y-5">
                  <SectionTitle icon={MapPin} title="Endereço" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Endereço"
                      value={(form.endereco as string) ?? ''}
                      onChange={(v) => updateField('endereco', v)}
                      className="md:col-span-2"
                    />
                    <FormInput
                      label="Cidade"
                      value={(form.cidade as string) ?? ''}
                      onChange={(v) => updateField('cidade', v)}
                    />
                    <FormInput
                      label="Estado"
                      value={(form.estado as string) ?? ''}
                      onChange={(v) => updateField('estado', v)}
                    />
                    <FormInput
                      label="País"
                      value={(form.pais as string) ?? 'Brasil'}
                      onChange={(v) => updateField('pais', v)}
                    />
                    <FormInput
                      label="CEP"
                      value={(form.cep as string) ?? ''}
                      onChange={(v) => updateField('cep', v)}
                    />
                  </div>
                </div>
              )}

              {/* ═══ VIDA DE FÉ ═══ */}
              {section === 'fe' && (
                <div className="space-y-5">
                  <SectionTitle icon={Church} title="Vida de Fé" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Paróquia"
                      value={(form.paroquia as string) ?? ''}
                      onChange={(v) => updateField('paroquia', v)}
                      placeholder="Ex: Paróquia São José"
                    />
                    <FormInput
                      label="Diocese"
                      value={(form.diocese as string) ?? ''}
                      onChange={(v) => updateField('diocese', v)}
                      placeholder="Ex: Diocese de São Paulo"
                    />
                    <FormInput
                      label="Há quanto tempo é Católico?"
                      value={(form.tempo_catolico as string) ?? ''}
                      onChange={(v) => updateField('tempo_catolico', v)}
                      placeholder="Ex: Desde nascimento, 5 anos..."
                    />
                    <FormInput
                      label="Pastoral"
                      value={(form.pastoral as string) ?? ''}
                      onChange={(v) => updateField('pastoral', v)}
                      placeholder="Ex: Pastoral da Juventude"
                    />
                    <FormInput
                      label="Comunidade / Movimento"
                      value={(form.comunidade as string) ?? ''}
                      onChange={(v) => updateField('comunidade', v)}
                      placeholder="Ex: Canção Nova, Opus Dei..."
                    />
                  </div>

                  {/* Veio de outra religião */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(201,168,76,0.08)' }}
                  >
                    <button
                      type="button"
                      onClick={() => updateField('veio_de_outra_religiao', !form.veio_de_outra_religiao)}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: form.veio_de_outra_religiao ? '#C9A84C' : 'transparent',
                        border: form.veio_de_outra_religiao ? 'none' : '2px solid rgba(201,168,76,0.3)',
                      }}
                    >
                      {form.veio_de_outra_religiao && (
                        <CheckCircle className="w-3.5 h-3.5" style={{ color: '#0A0A0A' }} />
                      )}
                    </button>
                    <span className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                      Veio de outra religião?
                    </span>
                  </div>

                  {form.veio_de_outra_religiao && (
                    <FormInput
                      label="Qual religião?"
                      value={(form.religiao_anterior as string) ?? ''}
                      onChange={(v) => updateField('religiao_anterior', v)}
                      placeholder="Ex: Protestantismo, Espiritismo..."
                    />
                  )}

                  {/* Sacramentos */}
                  <div>
                    <label
                      className="block text-xs mb-3 tracking-wider uppercase flex items-center gap-2"
                      style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
                    >
                      <BookOpen className="w-4 h-4" />
                      Sacramentos Recebidos
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SACRAMENTOS.map((s) => {
                        const checked = ((form.sacramentos ?? []) as Sacramento[]).includes(s.value)
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleSacramento(s.value)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left"
                            style={{
                              fontFamily: 'Poppins, sans-serif',
                              background: checked ? 'rgba(201,168,76,0.1)' : 'rgba(10,10,10,0.4)',
                              border: checked
                                ? '1px solid rgba(201,168,76,0.25)'
                                : '1px solid rgba(201,168,76,0.06)',
                              color: checked ? '#C9A84C' : '#7A7368',
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                              style={{
                                background: checked ? '#C9A84C' : 'transparent',
                                border: checked ? 'none' : '2px solid rgba(201,168,76,0.25)',
                              }}
                            >
                              {checked && <CheckCircle className="w-3 h-3" style={{ color: '#0A0A0A' }} />}
                            </div>
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SOCIAL ═══ */}
              {section === 'social' && (
                <div className="space-y-5">
                  <SectionTitle icon={Heart} title="Redes Sociais" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Instagram"
                      value={(form.instagram as string) ?? ''}
                      onChange={(v) => updateField('instagram', v)}
                      placeholder="@seuperfil"
                      icon={<AtSign className="w-4 h-4" />}
                    />
                    <FormInput
                      label="WhatsApp"
                      value={(form.whatsapp as string) ?? ''}
                      onChange={(v) => updateField('whatsapp', v)}
                      placeholder="(11) 99999-9999"
                      icon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    background: saved
                      ? 'rgba(76,175,80,0.15)'
                      : saving
                        ? 'rgba(201,168,76,0.15)'
                        : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                    color: saved ? '#66BB6A' : saving ? '#7A7368' : '#0A0A0A',
                    border: saved ? '1px solid rgba(76,175,80,0.3)' : 'none',
                  }}
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Salvo!
                    </>
                  ) : saving ? (
                    <div
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
                    />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Salvar Perfil
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* CARTEIRINHA TAB                        */}
        {/* ═══════════════════════════════════════ */}
        {mainTab === 'carteirinha' && (
          <CarteirinhaCard profile={profile} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// Componentes internos
// ═══════════════════════════════════════════════════════

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
      </div>
      <h2
        className="text-lg font-bold tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {title}
      </h2>
    </div>
  )
}

function FormInput({
  label, value, onChange, placeholder, type = 'text', icon, className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7A7368' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
          style={{
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
            paddingLeft: icon ? '2.5rem' : undefined,
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
    </div>
  )
}

function FormSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label
        className="block text-xs mb-2 tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
        style={{
          background: 'rgba(10,10,10,0.6)',
          border: '1px solid rgba(201,168,76,0.12)',
          color: '#F2EDE4',
          fontFamily: 'Poppins, sans-serif',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0A0A0A' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function CarteirinhaCard({ profile }: { profile: ReturnType<typeof useAuth>['profile'] }) {
  const vocacaoLabel = VOCACOES.find(v => v.value === profile?.vocacao)?.label ?? 'Leigo(a)'
  const sacramentosRecebidos = (profile?.sacramentos ?? []) as string[]
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : ''

  const handleShare = async () => {
    const text = `Carteirinha Catolica - ${profile?.name ?? 'Membro'} | Veritas Dei`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Carteirinha Catolica', text })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #F2EDE4 0%, #E8E0D0 100%)',
          border: '2px solid #C9A84C',
          boxShadow: '0 4px 24px rgba(201,168,76,0.18), 0 1px 0 rgba(201,168,76,0.3) inset',
        }}
      >
        {/* Ornamental outer border effect */}
        <div
          style={{
            border: '3px solid transparent',
            borderImage: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 40%, #C9A84C 60%, #A88B3A 100%) 1',
            margin: '4px',
            borderRadius: '12px',
          }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-center gap-3 py-4 px-6"
            style={{
              background: 'linear-gradient(135deg, #6B1D2A 0%, #8B2D3A 50%, #6B1D2A 100%)',
              borderBottom: '2px solid #C9A84C',
            }}
          >
            <span style={{ fontSize: '1.4rem', color: '#C9A84C' }}>&#10013;</span>
            <div className="text-center">
              <h3
                className="text-lg font-bold tracking-[0.2em] uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                Veritas Dei
              </h3>
              <p
                className="text-[10px] tracking-[0.15em] uppercase"
                style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(201,168,76,0.7)' }}
              >
                Carteirinha Catolica
              </p>
            </div>
            <span style={{ fontSize: '1.4rem', color: '#C9A84C' }}>&#10013;</span>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  background: profile?.profile_image_url ? 'transparent' : 'rgba(107,29,42,0.08)',
                  border: '2px solid #C9A84C',
                }}
              >
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7" style={{ color: '#6B1D2A' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-lg font-bold truncate"
                  style={{ fontFamily: 'Cinzel, serif', color: '#2A1F14' }}
                >
                  {profile?.name ?? 'Membro'}
                </h4>
                <p
                  className="text-sm"
                  style={{ fontFamily: 'Poppins, sans-serif', color: '#6B1D2A' }}
                >
                  {vocacaoLabel}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />

            {/* Details */}
            <div className="space-y-3">
              {profile?.paroquia && (
                <div className="flex items-start gap-2.5">
                  <Church className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#6B1D2A' }} />
                  <div>
                    <p
                      className="text-[10px] tracking-wider uppercase"
                      style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
                    >
                      Paroquia
                    </p>
                    <p
                      className="text-sm"
                      style={{ fontFamily: 'Poppins, sans-serif', color: '#2A1F14' }}
                    >
                      {profile.paroquia}
                    </p>
                  </div>
                </div>
              )}

              {profile?.diocese && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#6B1D2A' }} />
                  <div>
                    <p
                      className="text-[10px] tracking-wider uppercase"
                      style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
                    >
                      Diocese
                    </p>
                    <p
                      className="text-sm"
                      style={{ fontFamily: 'Poppins, sans-serif', color: '#2A1F14' }}
                    >
                      {profile.diocese}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sacramentos */}
            {sacramentosRecebidos.length > 0 && (
              <div>
                <p
                  className="text-[10px] tracking-wider uppercase mb-2"
                  style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
                >
                  Sacramentos Recebidos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sacramentosRecebidos.map((s) => {
                    const label = SACRAMENTOS.find(sac => sac.value === s)?.label ?? s
                    return (
                      <span
                        key={s}
                        className="text-[11px] px-2.5 py-1 rounded-full"
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          background: 'rgba(107,29,42,0.08)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          color: '#6B1D2A',
                        }}
                      >
                        {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div>
                {profile?.user_number && (
                  <p
                    className="text-[10px] tracking-wider uppercase font-bold"
                    style={{ fontFamily: 'Cinzel, serif', color: '#6B1D2A' }}
                  >
                    ID #{String(profile.user_number).padStart(6, '0')}
                  </p>
                )}
                <p
                  className="text-[10px] tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
                >
                  {memberSince ? `Membro desde ${memberSince}` : 'Membro'}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(107,29,42,0.06)', border: '1px solid rgba(201,168,76,0.25)' }}
              >
                <span style={{ fontSize: '0.7rem', color: '#C9A84C' }}>&#10013;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:opacity-90"
        style={{
          fontFamily: 'Cinzel, serif',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)',
          border: '1px solid rgba(201,168,76,0.3)',
          color: '#C9A84C',
        }}
      >
        <Share2 className="w-4 h-4" />
        Compartilhar Carteirinha
      </button>
    </div>
  )
}
