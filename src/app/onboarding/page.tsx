'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { VOCACOES, SACRAMENTOS, type Vocacao, type Sacramento } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  Camera, User, ArrowRight, ArrowLeft, Check, MapPin, Church,
} from 'lucide-react'

const STEPS = [
  { label: 'Perfil', desc: 'Foto e nome' },
  { label: 'Vocacao', desc: 'Sua vocacao' },
  { label: 'Fe', desc: 'Sacramentos' },
  { label: 'Local', desc: 'Onde voce esta' },
]

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export default function OnboardingPage() {
  const { user, profile, refreshProfile, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [vocacao, setVocacao] = useState<Vocacao>('leigo')
  const [sacramentos, setSacramentos] = useState<Sacramento[]>([])
  const [paroquia, setParoquia] = useState('')
  const [diocese, setDiocese] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // Redirect if not logged in or onboarding already done
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    if (!isLoading && profile?.onboarding_completed) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, profile, router])

  // Populate from existing profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? user?.user_metadata?.name ?? '')
      setAvatarUrl(profile.profile_image_url)
      setVocacao(profile.vocacao ?? 'leigo')
      setSacramentos(profile.sacramentos ?? [])
      setParoquia(profile.paroquia ?? '')
      setDiocese(profile.diocese ?? '')
      setCidade(profile.cidade ?? '')
      setEstado(profile.estado ?? '')
    }
  }, [profile, user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !supabase) return

    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    }
    setUploadingAvatar(false)
  }

  const toggleSacramento = (s: Sacramento) => {
    setSacramentos(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleFinish = async () => {
    if (!user || !supabase) return
    setSaving(true)

    await supabase
      .from('profiles')
      .update({
        name: name || null,
        profile_image_url: avatarUrl,
        vocacao,
        sacramentos,
        paroquia: paroquia || null,
        diocese: diocese || null,
        cidade: cidade || null,
        estado: estado || null,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    await refreshProfile()
    setSaving(false)
    router.push('/')
  }

  const handleSkipAll = async () => {
    if (!user || !supabase) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
    await refreshProfile()
    router.push('/')
  }

  const canGoNext = step < STEPS.length - 1
  const canGoBack = step > 0

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 relative">
      <div className="bg-glow" />

      {/* Skip button */}
      <button
        onClick={handleSkipAll}
        className="absolute top-6 right-6 text-xs transition-colors hover:opacity-80 z-10"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        Pular tudo
      </button>

      {/* Progress bar */}
      <div className="w-full max-w-lg relative z-10 mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background: i <= step ? 'rgba(201,168,76,0.15)' : 'rgba(10,10,10,0.6)',
                  border: i <= step ? '2px solid #C9A84C' : '2px solid rgba(201,168,76,0.1)',
                  color: i <= step ? '#C9A84C' : '#7A7368',
                }}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className="text-[10px] mt-1.5 hidden sm:block"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  color: i <= step ? '#C9A84C' : '#7A7368',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        {/* Progress line */}
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(201,168,76,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((step) / (STEPS.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, #C9A84C, #A88B3A)',
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-lg rounded-2xl p-6 md:p-8 relative z-10"
        style={{
          background: 'rgba(16,16,16,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.15)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          minHeight: '380px',
        }}
      >
        {/* ═══ STEP 1: Photo + Name ═══ */}
        {step === 0 && (
          <div className="flex flex-col items-center">
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Seu Perfil
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Como a comunidade vai te conhecer
            </p>

            {/* Avatar */}
            <div className="relative mb-6">
              <div
                className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: avatarUrl ? 'transparent' : 'rgba(201,168,76,0.08)',
                  border: '2px solid rgba(201,168,76,0.2)',
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" style={{ color: '#C9A84C', opacity: 0.5 }} />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                  color: '#0A0A0A',
                }}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} />
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

            {/* Name */}
            <div className="w-full">
              <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como voce quer ser chamado"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(201,168,76,0.12)' }}
              />
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Vocação ═══ */}
        {step === 1 && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Sua Vocacao
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Como voce serve na Igreja
            </p>

            <div className="grid grid-cols-2 gap-3">
              {VOCACOES.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVocacao(v.value)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all duration-200"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    background: vocacao === v.value ? 'rgba(201,168,76,0.12)' : 'rgba(10,10,10,0.5)',
                    border: vocacao === v.value ? '2px solid rgba(201,168,76,0.4)' : '2px solid rgba(201,168,76,0.08)',
                    color: vocacao === v.value ? '#C9A84C' : '#7A7368',
                  }}
                >
                  <VocacaoIcon vocacao={v.value} size={22} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Fé ═══ */}
        {step === 2 && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Sua Fe
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Sacramentos recebidos e paroquia
            </p>

            {/* Sacramentos */}
            <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
              Sacramentos recebidos
            </label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {SACRAMENTOS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSacramento(s.value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    background: sacramentos.includes(s.value) ? 'rgba(201,168,76,0.12)' : 'rgba(10,10,10,0.5)',
                    border: sacramentos.includes(s.value)
                      ? '1px solid rgba(201,168,76,0.3)'
                      : '1px solid rgba(201,168,76,0.08)',
                    color: sacramentos.includes(s.value) ? '#C9A84C' : '#7A7368',
                  }}
                >
                  {sacramentos.includes(s.value) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Paróquia + Diocese */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
                  Paroquia
                </label>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
                  <input
                    type="text" value={paroquia} onChange={e => setParoquia(e.target.value)}
                    placeholder="Ex: Paroquia Sao Jose"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
                  Diocese
                </label>
                <input
                  type="text" value={diocese} onChange={e => setDiocese(e.target.value)}
                  placeholder="Ex: Arquidiocese de Sao Paulo"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Localização ═══ */}
        {step === 3 && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Sua Localizacao
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Para encontrar igrejas perto de voce
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
                  <input
                    type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                    placeholder="Sua cidade"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}>
                  Estado
                </label>
                <select
                  value={estado} onChange={e => setEstado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
                  style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.12)', color: estado ? '#F2EDE4' : '#7A7368', fontFamily: 'Poppins, sans-serif', outline: 'none' }}
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BR.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="w-full max-w-lg flex items-center justify-between mt-6 relative z-10">
        {canGoBack ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all hover:opacity-80"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#C9A84C',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        ) : (
          <div />
        )}

        {canGoNext ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
            style={{
              fontFamily: 'Cinzel, serif',
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
            }}
          >
            Proximo
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
            style={{
              fontFamily: 'Cinzel, serif',
              background: saving ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: saving ? '#7A7368' : '#0A0A0A',
            }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Concluir
              </>
            )}
          </button>
        )}
      </div>

      {/* Skip step */}
      {canGoNext && (
        <button
          onClick={() => setStep(s => s + 1)}
          className="relative z-10 mt-3 text-xs transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Pular esta etapa
        </button>
      )}
    </div>
  )
}
