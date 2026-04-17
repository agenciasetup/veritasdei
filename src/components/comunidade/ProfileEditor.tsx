/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, ImageIcon, Link as LinkIcon, Plus, X } from 'lucide-react'

interface ProfileData {
  id: string
  name: string | null
  public_handle: string | null
  user_number: number | null
  bio_short: string | null
  cover_image_url: string | null
  profile_image_url: string | null
  external_links: Array<{ label: string; url: string }>
  community_role: string
  verified: boolean
  verified_at: string | null
  cidade: string | null
  estado: string | null
  diocese: string | null
  paroquia: string | null
  vocacao: string | null
}

interface PresignItem {
  upload_url: string
  object_key: string
  mime_type: string
  bytes: number
  variants?: { thumb?: string; feed?: string; detail?: string }
}

async function uploadSingleImage(file: File): Promise<string> {
  const res = await fetch('/api/comunidade/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [{ filename: file.name, mime_type: file.type, bytes: file.size }],
    }),
  })
  if (!res.ok) throw new Error('Falha ao preparar upload')
  const data = (await res.json()) as { items: PresignItem[] }
  const item = data.items[0]
  if (!item) throw new Error('Resposta vazia do servidor')

  const putRes = await fetch(item.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) throw new Error('Falha no upload')

  // Retorna URL pública (usa variante feed se disponível).
  return item.variants?.feed ?? item.variants?.detail ?? item.upload_url.split('?')[0]
}

export default function ProfileEditor() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bioShort, setBioShort] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      const res = await fetch('/api/comunidade/perfil', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar perfil')
      const data = (await res.json()) as { profile: ProfileData }
      setProfile(data.profile)
      setName(data.profile.name ?? '')
      setHandle(data.profile.public_handle ?? '')
      setBioShort(data.profile.bio_short ?? '')
      setAvatarUrl(data.profile.profile_image_url)
      setCoverUrl(data.profile.cover_image_url)
      setLinks(data.profile.external_links ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarChange(file: File) {
    setUploadingAvatar(true)
    setError(null)
    try {
      const url = await uploadSingleImage(file)
      setAvatarUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleCoverChange(file: File) {
    setUploadingCover(true)
    setError(null)
    try {
      const url = await uploadSingleImage(file)
      setCoverUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload: Record<string, unknown> = {
      name: name.trim() || null,
      public_handle: handle.trim() || null,
      bio_short: bioShort.trim() || null,
      cover_image_url: coverUrl,
      profile_image_url: avatarUrl,
      external_links: links.filter(l => l.label.trim() && l.url.trim()),
    }

    try {
      const res = await fetch('/api/comunidade/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(translateError(data?.error))
      }
      setSuccess('Perfil atualizado.')
      // Redireciona para o próprio perfil se tiver handle.
      setTimeout(() => {
        if (handle.trim()) router.push(`/comunidade/@${handle.trim()}`)
      }, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function addLink() {
    if (links.length >= 5) return
    setLinks([...links, { label: '', url: '' }])
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index))
  }

  function updateLink(index: number, patch: Partial<{ label: string; url: string }>) {
    setLinks(links.map((l, i) => i === index ? { ...l, ...patch } : l))
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
          {error ?? 'Perfil não encontrado.'}
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href="/comunidade"
          className="inline-flex items-center gap-2 mb-6 text-sm"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao feed
        </Link>

        <h1
          className="text-2xl md:text-3xl mb-6"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Editar perfil
        </h1>

        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(16,16,16,0.78)',
            border: '1px solid rgba(201,168,76,0.16)',
          }}
        >
          <label
            className="block relative cursor-pointer"
            style={{
              height: 160,
              background: coverUrl
                ? `url(${coverUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.04) 100%)',
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) void handleCoverChange(f)
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: coverUrl ? 'rgba(0,0,0,0.3)' : 'transparent',
                opacity: uploadingCover ? 1 : 0.8,
              }}
            >
              {uploadingCover ? (
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#F2EDE4' }} />
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Mudar capa
                </div>
              )}
            </div>
          </label>

          <div className="p-5 -mt-10 relative">
            <label className="inline-block relative cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) void handleAvatarChange(f)
                }}
              />
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: avatarUrl ? 'transparent' : 'rgba(201,168,76,0.15)',
                  border: '3px solid rgba(16,16,16,0.95)',
                }}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7" style={{ color: '#C9A84C' }} />
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 rounded-full p-1"
                style={{
                  background: 'rgba(201,168,76,0.9)',
                  color: '#0A0A0A',
                }}
              >
                <ImageIcon className="w-3 h-3" />
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Nome">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 60))}
              placeholder="Seu nome"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={fieldStyle}
            />
          </Field>

          <Field label="Handle" hint="3-20 caracteres, letras minúsculas, números e _.">
            <div className="flex items-center">
              <span
                className="px-3 py-2.5 rounded-l-xl text-sm"
                style={{
                  ...fieldStyle,
                  borderRight: 'none',
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  color: '#8A8378',
                }}
              >
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                placeholder="seuhandle"
                className="flex-1 px-3 py-2.5 rounded-r-xl text-sm"
                style={{
                  ...fieldStyle,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              />
            </div>
          </Field>

          <Field label="Bio curta" hint={`${bioShort.length}/160 caracteres`}>
            <textarea
              value={bioShort}
              onChange={e => setBioShort(e.target.value.slice(0, 160))}
              placeholder="Sobre você em uma frase..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-y"
              style={fieldStyle}
            />
          </Field>

          <Field label="Links" hint="Até 5 links (site, redes sociais, paróquia)">
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" style={{ color: '#8A8378' }} />
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(i, { label: e.target.value.slice(0, 40) })}
                    placeholder="Título"
                    className="w-32 px-2.5 py-2 rounded-lg text-xs"
                    style={fieldStyle}
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(i, { url: e.target.value.slice(0, 200) })}
                    placeholder="https://..."
                    className="flex-1 px-2.5 py-2 rounded-lg text-xs"
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="p-2 rounded-lg"
                    style={{ color: '#8A8378' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {links.length < 5 && (
                <button
                  type="button"
                  onClick={addLink}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgba(16,16,16,0.6)',
                    border: '1px dashed rgba(201,168,76,0.3)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar link
                </button>
              )}
            </div>
          </Field>

          {profile.community_role && profile.community_role !== 'leigo' && (
            <div
              className="rounded-xl p-3 text-xs"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Papel na comunidade: <strong>{profile.community_role}</strong>
              {profile.verified && ' · Verificado ✓'}
            </div>
          )}
        </div>

        {error && (
          <div
            className="mt-4 rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(107,29,42,0.12)',
              border: '1px solid rgba(217,79,92,0.35)',
              color: '#D94F5C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mt-4 rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(102,187,106,0.12)',
              border: '1px solid rgba(102,187,106,0.35)',
              color: '#66BB6A',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {success}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingAvatar || uploadingCover}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm uppercase tracking-[0.12em] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
              fontFamily: 'Cinzel, serif',
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>
    </main>
  )
}

const fieldStyle = {
  background: 'rgba(10,10,10,0.65)',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
} as const

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-xs uppercase tracking-[0.12em] mb-2"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          className="mt-1 text-xs"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function translateError(code?: string): string {
  const map: Record<string, string> = {
    invalid_name: 'Nome inválido',
    name_too_short: 'Nome muito curto',
    invalid_handle: 'Handle inválido (3-20 caracteres, a-z 0-9 _)',
    handle_taken: 'Este handle já está em uso',
    bio_too_long: 'Bio muito longa (máximo 160)',
    invalid_cover_url: 'URL da capa inválida',
    invalid_avatar_url: 'URL do avatar inválida',
    cover_must_be_https: 'Capa precisa ser HTTPS',
    avatar_must_be_https: 'Avatar precisa ser HTTPS',
    invalid_external_links: 'Links inválidos',
    rate_limited: 'Muitas alterações. Tente em um minuto.',
  }
  return map[code ?? ''] ?? 'Erro ao salvar'
}
