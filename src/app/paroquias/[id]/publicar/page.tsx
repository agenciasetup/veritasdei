'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import type { Paroquia } from '@/types/paroquia'
import {
  ArrowLeft,
  MessageSquarePlus,
  Image as ImageIcon,
  Shield,
  X,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PublicarPage({ params }: PageProps) {
  const { id } = use(params)
  return (
    <AuthGuard>
      <PublicarContent id={id} />
    </AuthGuard>
  )
}

function PublicarContent({ id }: { id: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [paroquia, setParoquia] = useState<Paroquia | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [imagemUrl, setImagemUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setParoquia((data as Paroquia) ?? null)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, supabase])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return
    e.target.value = ''
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.')
      return
    }
    setUploadingImage(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `posts/${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('paroquias').upload(path, file)
    if (upErr) {
      setError(upErr.message)
      setUploadingImage(false)
      return
    }
    const { data } = supabase.storage.from('paroquias').getPublicUrl(path)
    setImagemUrl(data.publicUrl)
    setUploadingImage(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user || !paroquia) return
    if (!titulo.trim() || !conteudo.trim()) {
      setError('Título e conteúdo são obrigatórios.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('paroquia_posts').insert({
      paroquia_id: paroquia.id,
      author_user_id: user.id,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      imagem_url: imagemUrl,
    })
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    router.push(`/paroquias/${paroquia.id}`)
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
      <div className="min-h-screen flex flex-col items-center justify-center">
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
          Apenas o responsável pela igreja pode publicar avisos.
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

  if (!paroquia.verificado) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <Link
            href={`/paroquias/${paroquia.id}`}
            className="inline-flex items-center gap-2 text-sm mb-6"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(16,16,16,0.7)',
              border: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#C9A84C' }} />
            <h1
              className="text-lg mb-2 tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Verificação Necessária
            </h1>
            <p
              className="text-sm mb-4"
              style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', lineHeight: 1.6 }}
            >
              O feed de avisos fica disponível após a aprovação do documento de verificação
              pelo time Veritas Dei.
            </p>
            <Link
              href={`/paroquias/${paroquia.id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider uppercase"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: '#0A0A0A',
              }}
            >
              {paroquia.verificacao_solicitada_em ? 'Editar solicitação' : 'Solicitar verificação'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />
      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href={`/paroquias/${paroquia.id}`}
          className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para {paroquia.nome}
        </Link>

        <h1
          className="text-2xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Publicar Aviso
        </h1>
        <p className="text-sm mb-6" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Seu aviso aparecerá no feed público de {paroquia.nome}.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Título *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Novena de Natal"
                required
                maxLength={160}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Conteúdo *
              </label>
              <textarea
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                required
                rows={8}
                placeholder="Escreva o aviso que os fiéis verão..."
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                  lineHeight: 1.6,
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs mb-2 tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
              >
                Imagem (opcional)
              </label>
              {imagemUrl ? (
                <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 280 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagemUrl} alt="" loading="lazy" decoding="async" className="w-full h-auto object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagemUrl(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.75)', color: '#D94F5C', border: 'none' }}
                    aria-label="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer"
                  style={{ borderColor: 'rgba(201,168,76,0.15)', color: '#7A7368' }}
                >
                  {uploadingImage ? (
                    <div
                      className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" style={{ color: '#C9A84C' }} />
                      <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Clique para anexar uma imagem
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

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
                <MessageSquarePlus className="w-4 h-4" /> Publicar no Feed
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
