'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Loader2,
  Save,
  Lock,
  Link as LinkIcon,
  Plus,
  AtSign,
  Sparkles,
  Minus,
  Heart,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { createClient } from '@/lib/supabase/client'
import SelecaoSantoDevocao from '@/components/devocao/SelecaoSantoDevocao'
import type { SantoResumo } from '@/types/santo'

/**
 * Sheet "Editar perfil" — dados PÚBLICOS (exibidos na comunidade).
 * Campos Premium (handle, bio, links, privacy) aparecem travados para
 * usuários free, com um upsell no topo. Avatar e capa são editados
 * direto pelo `ProfileHeaderCard` (tap na imagem).
 *
 * Salva em dois caminhos:
 *  - `name` → update direto em `profiles` (aberto a todos, usa supabase
 *    client).
 *  - `public_handle/bio_short/external_links/show_likes_public` → PUT
 *    `/api/comunidade/perfil` (valida unicidade, HTTPS, tamanho).
 */
export default function EditProfileSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { profile, user, refreshProfile } = useAuth()
  const { isPremium } = useSubscription()
  const supabase = createClient()

  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Portal só monta no client — evita mismatch de SSR.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])
  const [showLikesPublic, setShowLikesPublic] = useState(false)
  const [santoDevocaoId, setSantoDevocaoId] = useState<string | null>(null)
  const [santoDevocaoResumo, setSantoDevocaoResumo] = useState<SantoResumo | null>(null)
  const [showSantoPicker, setShowSantoPicker] = useState(false)

  // Hidrata o form a partir do profile atual sempre que abrir.
  useEffect(() => {
    if (!open || !profile) return
    setName(profile.name ?? '')
    setHandle(profile.public_handle ?? '')
    setBio(profile.bio_short ?? '')
    setLinks(profile.external_links ?? [])
    setShowLikesPublic(Boolean(profile.show_likes_public))
    setSantoDevocaoId(profile.santo_devocao_id ?? null)
    setError(null)
    setLoaded(true)
  }, [open, profile])

  // Busca dados do santo atual pra exibir o preview (nome, imagem, invocação).
  useEffect(() => {
    if (!santoDevocaoId || !supabase) {
      setSantoDevocaoResumo(null)
      return
    }
    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from('santos')
        .select('id, slug, nome, invocacao, patronatos, imagem_url, popularidade_rank, festa_texto, tipo_culto')
        .eq('id', santoDevocaoId)
        .maybeSingle()
      if (!cancelled && data) setSantoDevocaoResumo(data as SantoResumo)
    })()
    return () => { cancelled = true }
  }, [santoDevocaoId, supabase])

  // Fecha com Escape + trava scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  async function handleSave() {
    if (!user || !supabase) return
    setSaving(true)
    setError(null)
    try {
      // Nome é aberto a todos — vai direto no update básico.
      const trimmedName = name.trim().slice(0, 60)
      if (trimmedName.length > 0 && trimmedName.length < 2) {
        throw new Error('Nome muito curto (mínimo 2 caracteres).')
      }
      const { error: nameErr } = await supabase
        .from('profiles')
        .update({ name: trimmedName || null })
        .eq('id', user.id)
      if (nameErr) throw nameErr

      // Santo de devoção é aberto a todos (faz parte do perfil, não premium).
      if (santoDevocaoId !== (profile?.santo_devocao_id ?? null)) {
        const res = await fetch('/api/comunidade/perfil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ santo_devocao_id: santoDevocaoId }),
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(translateError(data?.error))
        }
        // Auto-favoritar oração do novo santo (reversível depois)
        if (santoDevocaoId) {
          const { data: santo } = await supabase
            .from('santos')
            .select('oracao_principal_item_id')
            .eq('id', santoDevocaoId)
            .maybeSingle()
          if (santo?.oracao_principal_item_id) {
            await supabase
              .from('prayer_favorites')
              .upsert(
                { user_id: user.id, item_id: santo.oracao_principal_item_id },
                { onConflict: 'user_id,item_id', ignoreDuplicates: true },
              )
          }
        }
      }

      // Campos Premium — só envia se for premium E houver mudança.
      if (isPremium) {
        const payload: Record<string, unknown> = {
          public_handle: handle.trim() || null,
          bio_short: bio.trim() || null,
          external_links: links.filter(l => l.label.trim() && l.url.trim()),
          show_likes_public: showLikesPublic,
        }
        const res = await fetch('/api/comunidade/perfil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(translateError(data?.error))
        }
      }

      await refreshProfile()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function addLink() {
    if (links.length >= 5) return
    setLinks([...links, { label: '', url: '' }])
  }

  function removeLink(i: number) {
    setLinks(links.filter((_, idx) => idx !== i))
  }

  function updateLink(i: number, patch: Partial<{ label: string; url: string }>) {
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  // Renderizado num portal pra escapar do `willChange:transform` do
  // PageTransition (que vira containing block e arrasta o `position:fixed`
  // pro fundo da página em vez de prender na viewport).
  if (!mounted) return null

  const overlay = (
    <AnimatePresence>
      {open && loaded && (
        <>
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="Editar perfil"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto"
            style={{
              background: 'rgba(16,16,16,0.96)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(201,168,76,0.18)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <div className="max-w-2xl mx-auto px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
              {/* Handle de arraste */}
              <div className="flex justify-center mb-4">
                <span
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'rgba(242,237,228,0.15)' }}
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl"
                  style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
                >
                  Editar perfil
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="p-2 rounded-full touch-target-lg active:opacity-70"
                  style={{ color: '#8A8378' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isPremium && (
                <Link
                  href="/planos"
                  className="flex items-center gap-3 rounded-xl p-3 mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))',
                    border: '1px solid rgba(201,168,76,0.3)',
                    textDecoration: 'none',
                  }}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <span
                    className="flex-1 text-xs"
                    style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Handle, bio, links e privacidade são do plano Estudos.
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-full"
                    style={{
                      background: 'rgba(201,168,76,0.2)',
                      color: '#C9A84C',
                      fontFamily: 'Cinzel, serif',
                    }}
                  >
                    Ver planos
                  </span>
                </Link>
              )}

              <div className="space-y-4">
                <FieldBlock label="Nome">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value.slice(0, 60))}
                    placeholder="Seu nome"
                    className="w-full px-3 py-3 rounded-xl text-sm"
                    style={fieldStyle}
                  />
                </FieldBlock>

                <FieldBlock
                  label="Santo de devoção"
                  hint="A capa do seu perfil será a imagem do santo escolhido."
                >
                  {showSantoPicker ? (
                    <div
                      className="rounded-xl p-3 space-y-3"
                      style={{
                        background: 'rgba(10,10,10,0.4)',
                        border: '1px solid rgba(201,168,76,0.2)',
                      }}
                    >
                      <SelecaoSantoDevocao
                        value={santoDevocaoId}
                        onChange={(id, resumo) => {
                          setSantoDevocaoId(id)
                          setSantoDevocaoResumo(resumo)
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSantoPicker(false)}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{
                            background: 'rgba(242,237,228,0.08)',
                            color: '#E7DED1',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSantoPicker(true)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left transition-all active:scale-[0.99]"
                      style={{
                        ...fieldStyle,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{
                          background: 'rgba(201,168,76,0.12)',
                          border: '1px solid rgba(201,168,76,0.22)',
                        }}
                      >
                        {santoDevocaoResumo?.imagem_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={santoDevocaoResumo.imagem_url}
                            alt={santoDevocaoResumo.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Heart className="w-4 h-4" style={{ color: '#C9A84C' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {santoDevocaoResumo ? (
                          <>
                            <div className="truncate" style={{ color: '#F2EDE4', fontWeight: 500 }}>
                              {santoDevocaoResumo.nome}
                            </div>
                            {santoDevocaoResumo.invocacao && (
                              <div className="text-xs truncate" style={{ color: '#8A8378' }}>
                                «{santoDevocaoResumo.invocacao}»
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ color: '#8A8378' }}>Escolher santo de devoção…</div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} />
                    </button>
                  )}
                </FieldBlock>

                <FieldBlock
                  label="Handle público"
                  hint={isPremium ? '3–20 caracteres, letras minúsculas, números e _.' : undefined}
                  premium={!isPremium}
                >
                  <div className="flex items-center">
                    <span
                      className="px-3 py-3 rounded-l-xl text-sm inline-flex items-center"
                      style={{
                        ...fieldStyle,
                        borderRight: 'none',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        color: '#8A8378',
                      }}
                    >
                      <AtSign className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={handle}
                      disabled={!isPremium}
                      onChange={e =>
                        setHandle(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, '')
                            .slice(0, 20),
                        )
                      }
                      placeholder="seuhandle"
                      className="flex-1 px-3 py-3 rounded-r-xl text-sm disabled:opacity-50"
                      style={{
                        ...fieldStyle,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
                    />
                  </div>
                </FieldBlock>

                <FieldBlock
                  label="Bio curta"
                  hint={isPremium ? `${bio.length}/160 caracteres` : undefined}
                  premium={!isPremium}
                >
                  <textarea
                    value={bio}
                    disabled={!isPremium}
                    onChange={e => setBio(e.target.value.slice(0, 160))}
                    placeholder="Sobre você em uma frase…"
                    rows={2}
                    className="w-full px-3 py-3 rounded-xl text-sm resize-y disabled:opacity-50"
                    style={fieldStyle}
                  />
                </FieldBlock>

                <FieldBlock
                  label="Links"
                  hint={isPremium ? 'Até 5 links (site, redes sociais, paróquia).' : undefined}
                  premium={!isPremium}
                >
                  <div className="space-y-2">
                    {links.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} />
                        <input
                          type="text"
                          value={link.label}
                          disabled={!isPremium}
                          onChange={e => updateLink(i, { label: e.target.value.slice(0, 40) })}
                          placeholder="Título"
                          className="w-28 px-2.5 py-2 rounded-lg text-xs disabled:opacity-50"
                          style={fieldStyle}
                        />
                        <input
                          type="url"
                          value={link.url}
                          disabled={!isPremium}
                          onChange={e => updateLink(i, { url: e.target.value.slice(0, 200) })}
                          placeholder="https://..."
                          className="flex-1 min-w-0 px-2.5 py-2 rounded-lg text-xs disabled:opacity-50"
                          style={fieldStyle}
                        />
                        <button
                          type="button"
                          disabled={!isPremium}
                          onClick={() => removeLink(i)}
                          className="p-2 rounded-lg touch-target active:opacity-70 disabled:opacity-30"
                          style={{ color: '#8A8378' }}
                          aria-label="Remover link"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {isPremium && links.length < 5 && (
                      <button
                        type="button"
                        onClick={addLink}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs touch-target-lg active:opacity-70"
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
                </FieldBlock>

                <FieldBlock
                  label="Privacidade"
                  premium={!isPremium}
                >
                  <label
                    className="flex items-center gap-3 rounded-xl p-3 cursor-pointer"
                    style={{
                      background: 'rgba(10,10,10,0.65)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      opacity: isPremium ? 1 : 0.5,
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={!isPremium}
                      checked={showLikesPublic}
                      onChange={e => setShowLikesPublic(e.target.checked)}
                      className="w-4 h-4"
                      style={{ accentColor: '#C9A84C' }}
                    />
                    <div className="flex-1">
                      <p
                        className="text-sm"
                        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                      >
                        Mostrar aba &ldquo;Curtidos&rdquo; publicamente
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {showLikesPublic
                          ? 'Qualquer pessoa verá os Veritas que você curtiu.'
                          : 'Apenas você vê seus curtidos.'}
                      </p>
                    </div>
                  </label>
                </FieldBlock>
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

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-5 py-3 rounded-xl text-sm uppercase tracking-[0.12em] touch-target-lg"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(201,168,76,0.2)',
                    color: '#8A8378',
                    fontFamily: 'Cinzel, serif',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm uppercase tracking-[0.12em] disabled:opacity-50 touch-target-lg"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}

function FieldBlock({
  label,
  hint,
  premium,
  children,
}: {
  label: string
  hint?: string
  premium?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label
          className="text-xs uppercase tracking-[0.12em]"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          {label}
        </label>
        {premium && (
          <span
            className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              background: 'rgba(201,168,76,0.12)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Lock className="w-2.5 h-2.5" />
            Estudos
          </span>
        )}
      </div>
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

const fieldStyle = {
  background: 'rgba(10,10,10,0.65)',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
} as const

function translateError(code?: string): string {
  const map: Record<string, string> = {
    invalid_name: 'Nome inválido',
    name_too_short: 'Nome muito curto',
    invalid_handle: 'Handle inválido (3–20 caracteres, a-z 0-9 _)',
    handle_taken: 'Este handle já está em uso',
    bio_too_long: 'Bio muito longa (máximo 160)',
    invalid_external_links: 'Links inválidos',
    cover_must_be_https: 'Capa precisa ser HTTPS',
    avatar_must_be_https: 'Avatar precisa ser HTTPS',
    rate_limited: 'Muitas alterações. Tente em um minuto.',
  }
  return map[code ?? ''] ?? 'Erro ao salvar'
}
