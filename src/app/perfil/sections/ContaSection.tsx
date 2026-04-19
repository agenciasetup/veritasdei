'use client'

import { useState } from 'react'
import {
  User,
  MapPin,
  Church,
  AtSign,
  Phone,
  BookOpen,
  Save,
  CheckCircle,
  ChevronDown,
  Info,
} from 'lucide-react'
import { TikTokIcon, YouTubeIcon } from '@/components/icons/SocialIcons'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import {
  VOCACOES,
  SACRAMENTOS,
  RELATIONSHIP_STATUSES,
  type Sacramento,
  type ProfileUpdate,
} from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import { isValidCpf, maskCpf, stripCpf } from '@/lib/utils/cpf'
import { useHaptic } from '@/hooks/useHaptic'
import { FormInput, FormSelect } from './shared'

type Group = 'identidade' | 'endereco' | 'fe'

const GROUPS: { key: Group; label: string; icon: React.ElementType; desc: string }[] = [
  {
    key: 'identidade',
    label: 'Identidade e contato',
    icon: User,
    desc: 'Só você vê. Usamos para verificação e contato direto.',
  },
  {
    key: 'endereco',
    label: 'Endereço',
    icon: MapPin,
    desc: 'Cidade e estado aparecem no seu perfil público. O resto é privado.',
  },
  {
    key: 'fe',
    label: 'Vida de fé',
    icon: Church,
    desc: 'Vocação, paróquia e diocese aparecem no perfil público.',
  },
]

/**
 * "Conta" — todos os dados PRIVADOS (e os poucos semi-públicos), em um
 * lugar só. Nome e handle ficam fora daqui (editáveis só via sheet
 * "Editar perfil", que é o espaço público). Isso evita o usuário
 * preencher nome em dois lugares.
 *
 * Mobile: acordeão (só um grupo aberto por vez).
 * Desktop: chips horizontais + um grupo visível por vez.
 */
export default function ContaSection() {
  const { profile, refreshProfile, user } = useAuth()
  const supabase = createClient()!
  const haptic = useHaptic()
  const isClergy = profile
    ? ['padre', 'diacono', 'bispo', 'religioso'].includes(profile.community_role)
    : false

  const [group, setGroup] = useState<Group>('identidade')
  const [openMobile, setOpenMobile] = useState<Set<Group>>(new Set(['identidade']))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<ProfileUpdate>(() => initForm(profile))
  const [cpfDisplay, setCpfDisplay] = useState<string>(
    profile?.cpf ? maskCpf(profile.cpf) : '',
  )
  const [cpfError, setCpfError] = useState('')

  // Re-hidrata se profile chegar depois do primeiro render.
  const [snapshot, setSnapshot] = useState(profile)
  if (profile && snapshot !== profile) {
    setSnapshot(profile)
    setForm(initForm(profile))
    setCpfDisplay(profile.cpf ? maskCpf(profile.cpf) : '')
  }

  const updateField = (key: keyof ProfileUpdate, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const toggleSacramento = (s: Sacramento) => {
    const current = (form.sacramentos ?? []) as Sacramento[]
    updateField(
      'sacramentos',
      current.includes(s) ? current.filter(x => x !== s) : [...current, s],
    )
  }

  async function handleSave() {
    if (!user) return
    const cpfRaw = stripCpf(cpfDisplay)
    if (cpfRaw.length > 0 && !isValidCpf(cpfRaw)) {
      setCpfError('CPF inválido. Verifique os dígitos.')
      haptic.pulse('warning')
      return
    }
    setCpfError('')
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ ...form, cpf: cpfRaw.length === 11 ? cpfRaw : null })
      .eq('id', user.id)

    if (!error) {
      await refreshProfile()
      haptic.pulse('complete')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  function toggleMobile(g: Group) {
    setOpenMobile(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  function renderGroup(g: Group) {
    if (g === 'identidade') {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Email{' '}
                <span style={{ color: '#7A7368', fontSize: 10 }}>(verificado)</span>
              </label>
              <input
                type="email"
                value={profile?.email ?? ''}
                readOnly
                disabled
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.45)',
                  border: '1px solid rgba(201,168,76,0.08)',
                  color: '#8A8378',
                  fontFamily: 'Poppins, sans-serif',
                  cursor: 'not-allowed',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                CPF{' '}
                <span style={{ color: '#C9A84C', fontSize: 10 }}>
                  (obrigatório para contagem)
                </span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpfDisplay}
                onChange={e => {
                  setCpfDisplay(maskCpf(e.target.value))
                  setCpfError('')
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl text-sm touch-target-lg"
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
            <FormInput
              label="Data de nascimento"
              type="date"
              value={form.data_nascimento ?? ''}
              onChange={v => updateField('data_nascimento', v || null)}
            />
            <FormSelect
              label="Gênero"
              value={form.genero ?? ''}
              onChange={v => updateField('genero', v || null)}
              options={[
                { value: '', label: 'Selecione' },
                { value: 'masculino', label: 'Masculino' },
                { value: 'feminino', label: 'Feminino' },
              ]}
            />
            <FormInput
              label="Instagram"
              value={(form.instagram as string) ?? ''}
              onChange={v => updateField('instagram', v)}
              placeholder="@seuperfil"
              icon={<AtSign className="w-4 h-4" />}
            />
            <FormInput
              label="WhatsApp"
              value={(form.whatsapp as string) ?? ''}
              onChange={v => updateField('whatsapp', v)}
              placeholder="(11) 99999-9999"
              icon={<Phone className="w-4 h-4" />}
            />
            <FormInput
              label="TikTok"
              value={(form.tiktok as string) ?? ''}
              onChange={v => updateField('tiktok', v)}
              placeholder="@seuperfil"
              icon={<TikTokIcon size={16} />}
            />
            <FormInput
              label="YouTube"
              value={(form.youtube as string) ?? ''}
              onChange={v => updateField('youtube', v)}
              placeholder="@seucanal"
              icon={<YouTubeIcon size={16} />}
            />
            {!isClergy && (
              <FormSelect
                label="Estado civil (opcional)"
                value={(form.relationship_status as string) ?? ''}
                onChange={v => updateField('relationship_status', (v as '' | 'solteiro' | 'casado' | 'namorando') || null)}
                options={[
                  { value: '', label: 'Prefiro não dizer' },
                  ...RELATIONSHIP_STATUSES.map(s => ({ value: s.value, label: s.label })),
                ]}
              />
            )}
          </div>
        </div>
      )
    }
    if (g === 'endereco') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Endereço"
            value={(form.endereco as string) ?? ''}
            onChange={v => updateField('endereco', v)}
            className="md:col-span-2"
          />
          <FormInput
            label="Cidade (pública)"
            value={(form.cidade as string) ?? ''}
            onChange={v => updateField('cidade', v)}
          />
          <FormInput
            label="Estado (público)"
            value={(form.estado as string) ?? ''}
            onChange={v => updateField('estado', v)}
          />
          <FormInput
            label="País"
            value={(form.pais as string) ?? 'Brasil'}
            onChange={v => updateField('pais', v)}
          />
          <FormInput
            label="CEP"
            value={(form.cep as string) ?? ''}
            onChange={v => updateField('cep', v)}
          />
        </div>
      )
    }
    // fe
    return (
      <div className="space-y-5">
        <div>
          <label
            className="block text-xs mb-3 tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
          >
            Vocação
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {VOCACOES.map(v => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Paróquia (pública)"
            value={(form.paroquia as string) ?? ''}
            onChange={v => updateField('paroquia', v)}
            placeholder="Ex: Paróquia São José"
          />
          <FormInput
            label="Diocese (pública)"
            value={(form.diocese as string) ?? ''}
            onChange={v => updateField('diocese', v)}
            placeholder="Ex: Diocese de São Paulo"
          />
          <FormInput
            label="Há quanto tempo é Católico?"
            value={(form.tempo_catolico as string) ?? ''}
            onChange={v => updateField('tempo_catolico', v)}
            placeholder="Ex: Desde o nascimento, 5 anos…"
          />
          <FormInput
            label="Pastoral"
            value={(form.pastoral as string) ?? ''}
            onChange={v => updateField('pastoral', v)}
            placeholder="Ex: Pastoral da Juventude"
          />
          <FormInput
            label="Comunidade / Movimento"
            value={(form.comunidade as string) ?? ''}
            onChange={v => updateField('comunidade', v)}
            placeholder="Ex: Canção Nova, Opus Dei…"
            className="md:col-span-2"
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
            onClick={() => updateField('veio_de_outra_religiao', !form.veio_de_outra_religiao)}
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
            onChange={v => updateField('religiao_anterior', v)}
            placeholder="Ex: Protestantismo, Espiritismo…"
          />
        )}

        <div>
          <label
            className="text-xs mb-3 tracking-wider uppercase flex items-center gap-2"
            style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
          >
            <BookOpen className="w-4 h-4" />
            Sacramentos Recebidos
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SACRAMENTOS.map(sac => {
              const checked = ((form.sacramentos ?? []) as Sacramento[]).includes(sac.value)
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

  const SaveButton = (
    <div className="mt-6 flex justify-end">
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
            <CheckCircle className="w-4 h-4" /> Salvo
          </>
        ) : saving ? (
          <span
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
          />
        ) : (
          <>
            <Save className="w-4 h-4" /> Salvar
          </>
        )}
      </button>
    </div>
  )

  const groupDesc = GROUPS.find(g => g.key === group)?.desc

  return (
    <div>
      {/* Mobile: accordion */}
      <div className="md:hidden space-y-3">
        {GROUPS.map(g => {
          const isOpen = openMobile.has(g.key)
          const Icon = g.icon
          return (
            <div
              key={g.key}
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
                onClick={() => toggleMobile(g.key)}
                className="w-full flex items-center justify-between gap-3 p-4 touch-target-lg active:opacity-80"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {g.label}
                  </span>
                </div>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{
                    color: '#8A8378',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-5">
                  <p
                    className="text-xs mb-4 flex items-start gap-2"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {g.desc}
                  </p>
                  {renderGroup(g.key)}
                </div>
              )}
            </div>
          )
        })}
        {SaveButton}
      </div>

      {/* Desktop: chips + single group */}
      <div className="hidden md:block">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {GROUPS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setGroup(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap"
              style={{
                fontFamily: 'Poppins, sans-serif',
                background: group === key ? 'rgba(201,168,76,0.12)' : 'rgba(16,16,16,0.6)',
                border:
                  group === key
                    ? '1px solid rgba(201,168,76,0.25)'
                    : '1px solid rgba(201,168,76,0.08)',
                color: group === key ? '#C9A84C' : '#8A8378',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
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
          {groupDesc && (
            <p
              className="text-xs mb-5 flex items-start gap-2"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {groupDesc}
            </p>
          )}
          {renderGroup(group)}
          {SaveButton}
        </div>
      </div>
    </div>
  )
}

function initForm(profile: ReturnType<typeof useAuth>['profile']): ProfileUpdate {
  if (!profile) return {}
  return {
    cpf: profile.cpf ?? '',
    vocacao: profile.vocacao,
    genero: profile.genero,
    data_nascimento: profile.data_nascimento,
    instagram: profile.instagram ?? '',
    whatsapp: profile.whatsapp ?? '',
    tiktok: profile.tiktok ?? '',
    youtube: profile.youtube ?? '',
    relationship_status: profile.relationship_status ?? null,
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
