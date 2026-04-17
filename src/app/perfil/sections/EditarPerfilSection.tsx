'use client'

import { useState, useRef } from 'react'
import {
  User,
  MapPin,
  Church,
  Heart,
  Camera,
  Save,
  CheckCircle,
  AtSign,
  Phone,
  FileText,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import {
  VOCACOES,
  SACRAMENTOS,
  type Sacramento,
  type ProfileUpdate,
} from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import { isValidCpf, maskCpf, stripCpf } from '@/lib/utils/cpf'
import { useHaptic } from '@/hooks/useHaptic'
import { SectionTitle, FormInput, FormSelect } from './shared'

type Section = 'pessoal' | 'endereco' | 'fe' | 'social'

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: 'pessoal',  label: 'Dados Pessoais', icon: User },
  { key: 'endereco', label: 'Endereço',       icon: MapPin },
  { key: 'fe',       label: 'Vida de Fé',     icon: Church },
  { key: 'social',   label: 'Social',         icon: Heart },
]

/**
 * Formulário "Editar Perfil" — antes inline em `perfil/page.tsx`.
 *
 * Mobile (< md): seções viram acordeão com checkmark de completude.
 * Desktop:       chips horizontais (uma seção visível por vez).
 *
 * O state vive aqui dentro (form local + sync com profile via initial).
 */
export default function EditarPerfilSection() {
  const { profile, refreshProfile, user } = useAuth()
  const supabase = createClient()!
  const fileInputRef = useRef<HTMLInputElement>(null)
  const haptic = useHaptic()

  const [section, setSection] = useState<Section>('pessoal')
  const [openMobile, setOpenMobile] = useState<Set<Section>>(new Set(['pessoal']))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [form, setForm] = useState<ProfileUpdate>(() => initFormFromProfile(profile))
  const [cpfDisplay, setCpfDisplay] = useState<string>(
    profile?.cpf ? maskCpf(profile.cpf) : '',
  )
  const [cpfError, setCpfError] = useState('')

  // Re-hidrata do profile se ele chegar depois.
  const [profileSnapshot, setProfileSnapshot] = useState(profile)
  if (profile && profileSnapshot !== profile) {
    setProfileSnapshot(profile)
    setForm(initFormFromProfile(profile))
    setCpfDisplay(profile.cpf ? maskCpf(profile.cpf) : '')
  }

  const updateField = (key: keyof ProfileUpdate, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSacramento = (s: Sacramento) => {
    const current = (form.sacramentos ?? []) as Sacramento[]
    if (current.includes(s)) {
      updateField(
        'sacramentos',
        current.filter((x) => x !== s),
      )
    } else {
      updateField('sacramentos', [...current, s])
    }
  }

  const handleSave = async () => {
    if (!user) return

    const cpfRaw = stripCpf(cpfDisplay)
    if (cpfRaw.length > 0 && !isValidCpf(cpfRaw)) {
      setCpfError('CPF inválido. Verifique os dígitos.')
      haptic.pulse('warning')
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
      haptic.pulse('complete')
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

  function toggleMobileAccordion(s: Section) {
    setOpenMobile((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  // Heurística simples de completude por seção.
  const completion: Record<Section, boolean> = {
    pessoal:
      !!(form.name && (form.cpf || cpfDisplay) && form.vocacao && form.data_nascimento),
    endereco: !!(form.cidade && form.estado),
    fe: !!(form.paroquia && (form.sacramentos as string[] | undefined)?.length),
    social: !!(form.instagram || form.whatsapp || form.public_handle),
  }

  const avatarUrl = profile?.profile_image_url

  // Render section body (reutilizado em mobile + desktop)
  function renderSectionBody(s: Section) {
    if (s === 'pessoal') {
      return (
        <div className="space-y-5">
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
                CPF{' '}
                <span style={{ color: '#C9A84C', fontSize: '10px' }}>
                  (obrigatório para contagem)
                </span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpfDisplay}
                onChange={(e) => {
                  setCpfDisplay(maskCpf(e.target.value))
                  setCpfError('')
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 touch-target-lg"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: cpfError
                    ? '1px solid rgba(220,38,38,0.5)'
                    : '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
              {cpfError && (
                <p
                  className="text-xs mt-1.5"
                  style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
                >
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
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs touch-target-lg active:scale-95"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    background:
                      form.vocacao === v.value
                        ? 'rgba(201,168,76,0.12)'
                        : 'rgba(10,10,10,0.5)',
                    border:
                      form.vocacao === v.value
                        ? '1px solid rgba(201,168,76,0.3)'
                        : '1px solid rgba(201,168,76,0.08)',
                    color: form.vocacao === v.value ? '#C9A84C' : '#8A8378',
                  }}
                >
                  <VocacaoIcon vocacao={v.value} size={16} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
    if (s === 'endereco') {
      return (
        <div className="space-y-5">
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
      )
    }
    if (s === 'fe') {
      return (
        <div className="space-y-5">
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
              placeholder="Ex: Desde nascimento, 5 anos…"
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
              placeholder="Ex: Canção Nova, Opus Dei…"
            />
          </div>

          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(10,10,10,0.5)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            <button
              type="button"
              onClick={() =>
                updateField('veio_de_outra_religiao', !form.veio_de_outra_religiao)
              }
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: form.veio_de_outra_religiao ? '#C9A84C' : 'transparent',
                border: form.veio_de_outra_religiao
                  ? 'none'
                  : '2px solid rgba(201,168,76,0.3)',
              }}
            >
              {form.veio_de_outra_religiao && (
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#0A0A0A' }} />
              )}
            </button>
            <span
              className="text-sm"
              style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
            >
              Veio de outra religião?
            </span>
          </div>

          {form.veio_de_outra_religiao && (
            <FormInput
              label="Qual religião?"
              value={(form.religiao_anterior as string) ?? ''}
              onChange={(v) => updateField('religiao_anterior', v)}
              placeholder="Ex: Protestantismo, Espiritismo…"
            />
          )}

          <div>
            <label
              className="block text-xs mb-3 tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
            >
              <BookOpen className="w-4 h-4" />
              Sacramentos Recebidos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SACRAMENTOS.map((sac) => {
                const checked = ((form.sacramentos ?? []) as Sacramento[]).includes(
                  sac.value,
                )
                return (
                  <button
                    key={sac.value}
                    type="button"
                    onClick={() => toggleSacramento(sac.value)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left touch-target-lg active:scale-[0.98]"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      background: checked ? 'rgba(201,168,76,0.1)' : 'rgba(10,10,10,0.4)',
                      border: checked
                        ? '1px solid rgba(201,168,76,0.25)'
                        : '1px solid rgba(201,168,76,0.06)',
                      color: checked ? '#C9A84C' : '#8A8378',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: checked ? '#C9A84C' : 'transparent',
                        border: checked ? 'none' : '2px solid rgba(201,168,76,0.25)',
                      }}
                    >
                      {checked && (
                        <CheckCircle className="w-3 h-3" style={{ color: '#0A0A0A' }} />
                      )}
                    </div>
                    {sac.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    }
    // social
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Handle Público (Comunidade)"
            value={(form.public_handle as string) ?? ''}
            onChange={(v) => updateField('public_handle', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="ex: joao_paulo"
            icon={<AtSign className="w-4 h-4" />}
          />
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
    )
  }

  const SaveButton = (
    <div className="mt-8 flex justify-end">
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all touch-target-lg active:scale-[0.98]"
        style={{
          fontFamily: 'Cinzel, serif',
          background: saved
            ? 'rgba(76,175,80,0.15)'
            : saving
              ? 'rgba(201,168,76,0.15)'
              : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
          color: saved ? '#66BB6A' : saving ? '#8A8378' : '#0A0A0A',
          border: saved ? '1px solid rgba(76,175,80,0.3)' : 'none',
        }}
      >
        {saved ? (
          <>
            <CheckCircle className="w-4 h-4" /> Salvo!
          </>
        ) : saving ? (
          <span
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
  )

  return (
    <div>
      {/* Avatar header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: avatarUrl ? 'transparent' : 'rgba(201,168,76,0.08)',
              border: '2px solid rgba(201,168,76,0.2)',
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8" style={{ color: '#C9A84C' }} />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Trocar avatar"
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 touch-target"
            style={{
              background: 'rgba(201,168,76,0.2)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: '#C9A84C',
            }}
          >
            {uploadingAvatar ? (
              <span
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
        <div className="min-w-0 flex-1">
          <p
            className="text-base font-medium truncate"
            style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
          >
            {profile?.name ?? 'Sem nome'}
          </p>
          <p
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            {profile?.email}
          </p>
        </div>
      </div>

      {/* Mobile: accordion sections */}
      <div className="md:hidden space-y-3">
        {SECTIONS.map((s) => {
          const isOpen = openMobile.has(s.key)
          const Icon = s.icon
          const done = completion[s.key]
          return (
            <div
              key={s.key}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(20,18,14,0.6)',
                border: `1px solid ${
                  isOpen ? 'rgba(201,168,76,0.18)' : 'rgba(201,168,76,0.08)'
                }`,
              }}
            >
              <button
                type="button"
                onClick={() => toggleMobileAccordion(s.key)}
                className="w-full flex items-center justify-between gap-3 p-4 touch-target-lg active:opacity-80"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {done && (
                    <CheckCircle
                      className="w-4 h-4"
                      style={{ color: '#66BB6A' }}
                      aria-label="Completo"
                    />
                  )}
                  <ChevronDown
                    className="w-4 h-4 transition-transform"
                    style={{
                      color: '#8A8378',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  />
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-5">
                  <div className="mb-4">
                    <SectionTitle icon={s.icon} title={s.label} />
                  </div>
                  {renderSectionBody(s.key)}
                </div>
              )}
            </div>
          )
        })}
        {SaveButton}
      </div>

      {/* Desktop: chips + single section */}
      <div className="hidden md:block">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap"
              style={{
                fontFamily: 'Poppins, sans-serif',
                background: section === key ? 'rgba(201,168,76,0.12)' : 'rgba(16,16,16,0.6)',
                border:
                  section === key
                    ? '1px solid rgba(201,168,76,0.25)'
                    : '1px solid rgba(201,168,76,0.08)',
                color: section === key ? '#C9A84C' : '#8A8378',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
              {completion[key] && (
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#66BB6A' }} />
              )}
            </button>
          ))}
        </div>

        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: 'rgba(16,16,16,0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(201,168,76,0.15)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div className="mb-4">
            <SectionTitle
              icon={SECTIONS.find((s) => s.key === section)!.icon}
              title={SECTIONS.find((s) => s.key === section)!.label}
            />
          </div>
          {renderSectionBody(section)}
          {SaveButton}
        </div>
      </div>
    </div>
  )
}

function initFormFromProfile(
  profile: ReturnType<typeof useAuth>['profile'],
): ProfileUpdate {
  if (!profile) return {}
  return {
    name: profile.name ?? '',
    cpf: profile.cpf ?? '',
    vocacao: profile.vocacao,
    genero: profile.genero,
    data_nascimento: profile.data_nascimento,
    public_handle: profile.public_handle ?? '',
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
  }
}
