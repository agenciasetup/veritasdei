import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock, Check, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rowToSkin } from '@/features/rosario/skins/loadActiveSkin'
import { SkinMiniPreview } from '@/features/rosario/components/SkinMiniPreview'
import { SkinDetailActions } from '@/features/rosario/components/SkinDetailActions'
import type { RosarySkinCatalogItem } from '@/features/rosario/data/skinTypes'

export const dynamic = 'force-dynamic'

async function loadSkin(slug: string): Promise<RosarySkinCatalogItem | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: row } = await supabase
    .from('rosary_skins')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('visivel', true)
    .maybeSingle()

  if (!row) return null

  const skin = rowToSkin(row as Record<string, unknown>)
  if (!user) {
    return { ...skin, owned: false, equipped: false, unlocked_at: null, fonte: null }
  }

  const [{ data: ownership }, { data: profile }] = await Promise.all([
    supabase
      .from('user_rosary_skins')
      .select('unlocked_at, fonte')
      .eq('user_id', user.id)
      .eq('skin_id', skin.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('active_rosary_skin_id')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  return {
    ...skin,
    owned: !!ownership,
    equipped: profile?.active_rosary_skin_id === skin.id,
    unlocked_at: (ownership?.unlocked_at as string | null) ?? null,
    fonte: (ownership?.fonte as RosarySkinCatalogItem['fonte']) ?? null,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skin = await loadSkin(slug)
  if (!skin) return { title: 'Terço — Veritas Dei' }
  return {
    title: `${skin.nome} — Veritas Dei`,
    description: skin.descricao ?? skin.subtitulo ?? undefined,
  }
}

export default async function SkinDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skin = await loadSkin(slug)
  if (!skin) notFound()

  const status = unlockStatusOf(skin)
  const sampleMystery = skin.mysteries?.[0] ?? null

  return (
    <main
      className="relative min-h-screen w-full"
      style={{ backgroundColor: skin.theme.pageBg, color: skin.theme.textPrimary }}
    >
      {/* Ambient da própria skin */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: skin.theme.pageBgAmbient }}
      />

      <Link
        href="/rosario/loja"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 text-sm transition md:left-8 md:top-6"
        style={{ color: skin.theme.textMuted, opacity: 0.85 }}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à loja
      </Link>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 md:px-8 md:py-20 lg:flex-row lg:items-start lg:gap-16 lg:py-24">
        {/* Preview */}
        <div className="flex flex-shrink-0 flex-col items-center gap-5 lg:w-[44%] lg:max-w-md lg:sticky lg:top-12">
          <SkinMiniPreview theme={skin.theme} size={320} />
          <div className="text-center">
            <span
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{
                color: rarityColor(skin.raridade),
                fontFamily: 'var(--font-display)',
              }}
            >
              {skin.raridade} · {skin.categoria}
            </span>
          </div>

          {/* Status badge */}
          {skin.equipped && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
              style={{
                borderColor: skin.theme.accent,
                background: 'rgba(255,255,255,0.04)',
                color: skin.theme.accent,
                fontFamily: 'var(--font-display)',
              }}
            >
              <Check className="h-3 w-3" strokeWidth={2.6} /> Equipado agora
            </span>
          )}
          {!skin.equipped && skin.owned && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
              style={{
                borderColor: skin.theme.borderStrong,
                color: skin.theme.textSecondary,
                fontFamily: 'var(--font-display)',
              }}
            >
              <Sparkles className="h-3 w-3" /> Na sua coleção
            </span>
          )}
          {!skin.owned && skin.unlock_tipo === 'coming_soon' && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
              style={{
                borderColor: skin.theme.border,
                color: skin.theme.textMuted,
                fontFamily: 'var(--font-display)',
              }}
            >
              <Lock className="h-3 w-3" /> Em breve
            </span>
          )}
          {status === 'locked' && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
              style={{
                borderColor: skin.theme.border,
                color: skin.theme.textMuted,
                fontFamily: 'var(--font-display)',
              }}
            >
              <Lock className="h-3 w-3" /> Bloqueado
            </span>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex-1 lg:max-w-xl">
          {skin.subtitulo && (
            <p
              className="mb-3 text-xs uppercase tracking-[0.3em]"
              style={{
                color: skin.theme.accent,
                fontFamily: 'var(--font-display)',
              }}
            >
              {skin.subtitulo}
            </p>
          )}
          <h1
            className="mb-5 text-4xl leading-[1.05] md:text-5xl lg:text-6xl"
            style={{
              color: skin.theme.textPrimary,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
            }}
          >
            {skin.nome}
          </h1>

          {skin.descricao && (
            <p
              className="mb-6 text-base leading-relaxed md:text-lg"
              style={{
                color: skin.theme.textSecondary,
                fontFamily: 'var(--font-elegant)',
              }}
            >
              {skin.descricao}
            </p>
          )}

          {skin.epigraph && (
            <blockquote
              className="mb-7 border-l-2 pl-4 text-sm italic md:text-base"
              style={{
                borderColor: skin.theme.borderStrong,
                color: skin.theme.textMuted,
                fontFamily: 'var(--font-elegant)',
              }}
            >
              {skin.epigraph}
            </blockquote>
          )}

          {/* Sample mystery preview (se a skin tem mistérios próprios) */}
          {sampleMystery && (
            <div
              className="mb-7 rounded-2xl border p-4 md:p-5"
              style={{
                borderColor: skin.theme.border,
                background: skin.theme.cardBg,
              }}
            >
              <p
                className="mb-1 text-[10px] uppercase tracking-[0.25em]"
                style={{
                  color: skin.theme.textMuted,
                  fontFamily: 'var(--font-display)',
                }}
              >
                1º mistério · Prévia da meditação
              </p>
              <h2
                className="mb-1.5 text-lg md:text-xl"
                style={{
                  color: skin.theme.accent,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {sampleMystery.title}
              </h2>
              <p
                className="mb-2 text-xs italic"
                style={{ color: skin.theme.textMuted }}
              >
                Fruto: {sampleMystery.fruit} · {sampleMystery.scripture}
              </p>
              <p
                className="text-sm leading-relaxed md:text-base"
                style={{
                  color: skin.theme.textPrimary,
                  fontFamily: 'var(--font-elegant)',
                }}
              >
                {sampleMystery.reflection}
              </p>
              {skin.mysteries && skin.mysteries.length > 1 && (
                <p
                  className="mt-3 text-[10px] uppercase tracking-[0.22em]"
                  style={{
                    color: skin.theme.textMuted,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  +{skin.mysteries.length - 1} mistérios a contemplar
                </p>
              )}
            </div>
          )}

          {/* Unlock criteria when locked */}
          {status === 'locked' && skin.unlock_label && (
            <div
              className="mb-7 rounded-2xl border px-4 py-3 md:p-5"
              style={{
                borderColor: skin.theme.borderStrong,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <p
                className="mb-1 text-[10px] uppercase tracking-[0.25em]"
                style={{
                  color: skin.theme.accent,
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Lock className="mr-1 inline h-3 w-3" /> Como destravar
              </p>
              <p className="text-sm" style={{ color: skin.theme.textSecondary }}>
                {skin.unlock_label}
              </p>
            </div>
          )}

          {/* Actions */}
          <SkinDetailActions skin={skin} status={status} />
        </div>
      </div>
    </main>
  )
}

function unlockStatusOf(
  skin: RosarySkinCatalogItem,
): 'owned' | 'unlocked' | 'locked' | 'coming_soon' {
  if (skin.owned) return 'owned'
  if (skin.unlock_tipo === 'coming_soon') return 'coming_soon'
  if (skin.unlock_tipo === 'free') return 'unlocked'
  return 'locked'
}

function rarityColor(r: RosarySkinCatalogItem['raridade']): string {
  switch (r) {
    case 'lendaria':
      return '#D9C077'
    case 'suprema':
      return '#E6C078'
    case 'epica':
      return '#C4B0E2'
    case 'rara':
      return '#9FCBE6'
    default:
      return '#938B80'
  }
}
