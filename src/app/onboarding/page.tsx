'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import { VOCACOES, SACRAMENTOS, type Vocacao, type Sacramento } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useHaptic } from '@/hooks/useHaptic'
import {
  Camera, User, ArrowRight, ArrowLeft, Check, MapPin, Church, Users, HeartHandshake,
} from 'lucide-react'

type PerfilTipo = 'fiel' | 'igreja' | null

const STEPS = [
  { label: 'Tipo', desc: 'Fiel ou Igreja' },
  { label: 'Perfil', desc: 'Foto e nome' },
  { label: 'Vocação', desc: 'Sua vocação' },
  { label: 'Fé', desc: 'Sacramentos' },
  { label: 'Local', desc: 'Onde você está' },
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
  const [maxStepReached, setMaxStepReached] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const haptic = useHaptic()

  // Form state
  const [perfilTipo, setPerfilTipo] = useState<PerfilTipo>(null)
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
    const raw = e.target.files?.[0]
    if (!raw || !user || !supabase) return

    if (!raw.type.startsWith('image/')) return
    // Limite de 2MB aplicado ao ORIGINAL. A compressao abaixo reduz
    // ainda mais pra economizar storage.
    if (raw.size > 2 * 1024 * 1024) return

    setUploadingAvatar(true)
    try {
      const { file } = await compressImage(raw)
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/avatar.${ext}`

      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        // Cache-bust: upsert reusa a key, sem isso retry na mesma página mostra foto antiga.
        setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`)
      }
    } finally {
      setUploadingAvatar(false)
    }
  }

  const toggleSacramento = (s: Sacramento) => {
    setSacramentos(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleFinish = async () => {
    if (!user || !supabase) return
    setSaving(true)

    if (perfilTipo === 'igreja') {
      // Igreja: só marca onboarding como concluído (mantém vocacao 'leigo')
      // e redireciona para o cadastro da igreja. Não grava sacramentos/paróquia
      // pessoal — estes não fazem sentido para o representante da igreja.
      await supabase
        .from('profiles')
        .update({
          name: name || null,
          profile_image_url: avatarUrl,
          cidade: cidade || null,
          estado: estado || null,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      await refreshProfile()
      setSaving(false)
      router.push('/paroquias/cadastrar')
      return
    }

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
    haptic.pulse('complete')
    setShowWelcome(true)
    setTimeout(() => router.push('/'), 2000)
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

  // Steps visíveis: para fiel usa todos; para igreja pula vocação e fé.
  const visibleSteps = perfilTipo === 'igreja'
    ? [STEPS[0], STEPS[1], STEPS[4]]
    : STEPS
  const currentStepIdx = (() => {
    if (perfilTipo !== 'igreja') return step
    // step armazenado: 0=tipo, 1=perfil, 4=local
    if (step === 0) return 0
    if (step === 1) return 1
    if (step === 4) return 2
    return step
  })()
  const totalVisible = visibleSteps.length
  const canGoNext = (() => {
    if (perfilTipo === 'igreja') return step !== 4
    return step < STEPS.length - 1
  })()
  const canGoBack = step > 0

  const goNext = () => {
    setDirection(1)
    haptic.pulse('selection')
    let next: number
    if (perfilTipo === 'igreja') {
      if (step === 0) next = 1
      else if (step === 1) next = 4
      else next = step
    } else {
      next = Math.min(step + 1, STEPS.length - 1)
    }
    setStep(next)
    setMaxStepReached((m) => Math.max(m, next))
  }
  const goBack = () => {
    setDirection(-1)
    haptic.pulse('tap')
    if (perfilTipo === 'igreja') {
      if (step === 4) setStep(1)
      else if (step === 1) setStep(0)
      return
    }
    setStep(s => Math.max(s - 1, 0))
  }
  function gotoStep(idx: number) {
    if (idx > maxStepReached) return
    if (idx === step) return
    setDirection(idx > step ? 1 : -1)
    haptic.pulse('selection')
    setStep(idx)
  }
  function handleSwipe(_e: unknown, info: PanInfo) {
    const dx = info.offset.x
    const dy = info.offset.y
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return
    if (dx < 0 && canGoNext && !nextDisabled) goNext()
    else if (dx > 0 && canGoBack) goBack()
  }
  const nextDisabled = (() => {
    if (step === 0 && perfilTipo === null) return true
    if (step === 1 && !name.trim()) return true
    return false
  })()

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border-1)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 relative">
      <div className="bg-glow" />

      {/* Skip button — respeita safe area no iPhone notch em PWA */}
      <button
        onClick={handleSkipAll}
        className="absolute right-6 text-xs transition-colors active:opacity-70 z-10 touch-target"
        style={{
          color: 'var(--text-3)',
          fontFamily: 'var(--font-body)',
          top: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
        }}
      >
        Pular tudo
      </button>

      {/* Progress bar — dots tappable para steps já completados */}
      <div className="w-full max-w-lg relative z-10 mb-8">
        <div className="flex items-center justify-between mb-3">
          {visibleSteps.map((s, i) => {
            // Recupera o step real da lista visível para gotoStep
            const realStep =
              perfilTipo === 'igreja'
                ? i === 0 ? 0 : i === 1 ? 1 : 4
                : i
            const reached = realStep <= maxStepReached
            return (
              <button
                key={i}
                type="button"
                onClick={() => gotoStep(realStep)}
                disabled={!reached}
                className="flex flex-col items-center flex-1 touch-target disabled:cursor-not-allowed active:scale-95"
                aria-label={`Ir para o passo ${i + 1}: ${s.label}`}
                aria-current={i === currentStepIdx ? 'step' : undefined}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background:
                      i <= currentStepIdx
                        ? 'var(--accent-soft)'
                        : 'var(--surface-inset)',
                    border:
                      i <= currentStepIdx
                        ? '2px solid var(--accent)'
                        : '2px solid var(--border-1)',
                    color: i <= currentStepIdx ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >
                  {i < currentStepIdx ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className="text-[10px] mt-1.5 hidden sm:block"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: i <= currentStepIdx ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
        {/* Progress line */}
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--accent-soft)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(currentStepIdx / Math.max(totalVisible - 1, 1)) * 100}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
      </div>

      {/* Card — swipeable horizontalmente */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: direction * 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -direction * 32 }}
        transition={{ duration: 0.2 }}
        onPanEnd={handleSwipe}
        className="w-full max-w-lg rounded-2xl p-6 md:p-8 relative z-10"
        style={{
          background: 'var(--surface-2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-1)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          minHeight: '380px',
          touchAction: 'pan-y',
        }}
      >
        {/* ═══ STEP 0: Fiel ou Igreja ═══ */}
        {step === 0 && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              Quem é você?
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              Escolha o tipo de perfil para continuar
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setPerfilTipo('fiel')}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: perfilTipo === 'fiel' ? 'var(--accent-soft)' : 'var(--surface-inset)',
                  border: perfilTipo === 'fiel' ? '2px solid var(--accent)' : '2px solid var(--border-1)',
                  color: perfilTipo === 'fiel' ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-1)' }}
                >
                  <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Sou um fiel
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Cadastre sua vocação, sacramentos e paróquia — acompanhe estudos, formação e comunidade.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPerfilTipo('igreja')}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: perfilTipo === 'igreja' ? 'var(--accent-soft)' : 'var(--surface-inset)',
                  border: perfilTipo === 'igreja' ? '2px solid var(--accent)' : '2px solid var(--border-1)',
                  color: perfilTipo === 'igreja' ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-1)' }}
                >
                  <Church className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Represento uma Igreja
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Cadastre uma igreja (CNPJ, tipo, horários, fotos). Após a verificação, publique
                    avisos no feed da sua igreja.
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-1)' }}>
              <HeartHandshake className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
                O mesmo usuário pode administrar várias igrejas no futuro.
              </p>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: Photo + Name ═══ */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              {perfilTipo === 'igreja' ? 'Seu Nome' : 'Seu Perfil'}
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              {perfilTipo === 'igreja'
                ? 'Nome do responsável pela igreja no Veritas Dei'
                : 'Como a comunidade vai te conhecer'}
            </p>

            {/* Avatar */}
            <div className="relative mb-6">
              <div
                className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: avatarUrl ? 'transparent' : 'var(--accent-soft)',
                  border: '2px solid var(--accent-soft)',
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" style={{ color: 'var(--accent)', opacity: 0.5 }} />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent-contrast) 30%, transparent)', borderTopColor: 'var(--accent-contrast)' }} />
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
              <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como você quer ser chamado"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--accent-soft)' }}
              />
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Vocação ═══ */}
        {step === 2 && perfilTipo !== 'igreja' && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              Sua Vocação
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              Como você serve na Igreja
            </p>

            <div className="grid grid-cols-2 gap-3">
              {VOCACOES.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVocacao(v.value)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: vocacao === v.value ? 'var(--accent-soft)' : 'var(--surface-inset)',
                    border: vocacao === v.value ? '2px solid var(--accent)' : '2px solid var(--border-1)',
                    color: vocacao === v.value ? 'var(--accent)' : 'var(--text-3)',
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
        {step === 3 && perfilTipo !== 'igreja' && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              Sua Fé
            </h2>
            <p className="text-sm mb-6 text-center" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              Sacramentos recebidos e paróquia
            </p>

            {/* Sacramentos */}
            <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
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
                    fontFamily: 'var(--font-body)',
                    background: sacramentos.includes(s.value) ? 'var(--accent-soft)' : 'var(--surface-inset)',
                    border: sacramentos.includes(s.value)
                      ? '1px solid var(--accent-soft)'
                      : '1px solid var(--border-1)',
                    color: sacramentos.includes(s.value) ? 'var(--accent)' : 'var(--text-3)',
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
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
                  Paróquia
                </label>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="text" value={paroquia} onChange={e => setParoquia(e.target.value)}
                    placeholder="Ex: Paróquia São José"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-1)', color: 'var(--text-1)', fontFamily: 'var(--font-body)', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
                  Diocese
                </label>
                <input
                  type="text" value={diocese} onChange={e => setDiocese(e.target.value)}
                  placeholder="Ex: Arquidiocese de São Paulo"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-1)', color: 'var(--text-1)', fontFamily: 'var(--font-body)', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Localização ═══ */}
        {step === 4 && (
          <div>
            <h2
              className="text-xl font-bold tracking-wider uppercase mb-1 text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              {perfilTipo === 'igreja' ? 'Cidade da Igreja' : 'Sua Localização'}
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              {perfilTipo === 'igreja'
                ? 'Usamos para pré-preencher o cadastro da igreja no próximo passo'
                : 'Para encontrar igrejas perto de você'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                    placeholder="Sua cidade"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-1)', color: 'var(--text-1)', fontFamily: 'var(--font-body)', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2 tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
                  Estado
                </label>
                <select
                  value={estado} onChange={e => setEstado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
                  style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-1)', color: estado ? 'var(--text-1)' : 'var(--text-3)', fontFamily: 'var(--font-body)', outline: 'none' }}
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
      </motion.div>

      {/* Navigation buttons */}
      <div className="w-full max-w-lg flex items-center justify-between mt-6 relative z-10">
        {canGoBack ? (
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all hover:opacity-80"
            style={{
              fontFamily: 'var(--font-body)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
              color: 'var(--accent)',
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
            onClick={goNext}
            disabled={nextDisabled}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
            style={{
              fontFamily: 'var(--font-display)',
              background: nextDisabled
                ? 'var(--accent-soft)'
                : 'var(--accent)',
              color: nextDisabled ? 'var(--text-3)' : 'var(--accent-contrast)',
              cursor: nextDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            Próximo
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
            style={{
              fontFamily: 'var(--font-display)',
              background: saving ? 'var(--accent-soft)' : 'var(--accent)',
              color: saving ? 'var(--text-3)' : 'var(--accent-contrast)',
            }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent-contrast) 30%, transparent)', borderTopColor: 'var(--accent-contrast)' }} />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Concluir
              </>
            )}
          </button>
        )}
      </div>

      {/* Skip step — available only for non-blocking steps (not tipo/perfil) */}
      {canGoNext && step !== 0 && step !== 1 && (
        <button
          onClick={goNext}
          className="relative z-10 mt-3 text-xs transition-colors hover:opacity-80"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Pular esta etapa
        </button>
      )}

      {/* Welcome screen — shown briefly after finish */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background:
                'radial-gradient(ellipse at center, var(--accent-soft), var(--surface-1))',
              backdropFilter: 'blur(20px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="text-6xl mb-6"
              aria-hidden
            >
              ✦
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-elegant)',
                color: 'var(--text-1)',
              }}
            >
              Bem-vindo, {(name || 'Irmão').split(' ')[0]}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Que sua jornada seja fiel ao Magistério.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
