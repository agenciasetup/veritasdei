import Link from 'next/link'
import { ArrowLeft, Sparkles, Lock, Check } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rowToSkin } from '@/features/rosario/skins/loadActiveSkin'
import { SkinMiniPreview } from '@/features/rosario/components/SkinMiniPreview'
import { LojaFilters } from '@/features/rosario/components/LojaFilters'
import { RedeemCodeButton } from '@/features/rosario/components/RedeemCodeButton'
import type { RosarySkinCatalogItem } from '@/features/rosario/data/skinTypes'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Loja de Terços — Veritas Dei',
  description:
    'Skins de terço: temas visuais, mistérios de santos, dogmas e devoções. Reze do jeito que mais te toca.',
}

type CatalogResult = {
  items: RosarySkinCatalogItem[]
  totalOwned: number
  authenticated: boolean
}

async function loadCatalog(): Promise<CatalogResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: skins } = await supabase
    .from('rosary_skins')
    .select('*')
    .eq('status', 'published')
    .eq('visivel', true)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: true })

  if (!user) {
    const items = (skins ?? []).map((s) => ({
      ...rowToSkin(s as Record<string, unknown>),
      owned: false,
      equipped: false,
      unlocked_at: null,
      fonte: null,
    })) as RosarySkinCatalogItem[]
    return { items, totalOwned: 0, authenticated: false }
  }

  const [{ data: owned }, { data: profile }] = await Promise.all([
    supabase
      .from('user_rosary_skins')
      .select('skin_id, unlocked_at, fonte')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('active_rosary_skin_id')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const ownedMap = new Map(
    (owned ?? []).map((r) => [
      r.skin_id as string,
      { unlocked_at: r.unlocked_at as string, fonte: r.fonte as string },
    ]),
  )
  const activeId = (profile?.active_rosary_skin_id as string | null) ?? null

  const items: RosarySkinCatalogItem[] = (skins ?? []).map((s) => {
    const skin = rowToSkin(s as Record<string, unknown>)
    const ownership = ownedMap.get(skin.id)
    return {
      ...skin,
      owned: !!ownership,
      equipped: skin.id === activeId,
      unlocked_at: ownership?.unlocked_at ?? null,
      fonte: (ownership?.fonte as RosarySkinCatalogItem['fonte']) ?? null,
    }
  })

  return {
    items,
    totalOwned: items.filter((i) => i.owned).length,
    authenticated: true,
  }
}

export default async function RosaryLojaPage() {
  const { items, totalOwned, authenticated } = await loadCatalog()

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="bg-glow" aria-hidden />

      <Link
        href="/rosario"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 text-sm transition md:left-8 md:top-6"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-16 md:px-8 md:py-20 lg:py-24">
        {/* Hero */}
        <header className="mb-10 text-center md:mb-14">
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.4em] md:text-[11px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            <Sparkles className="mb-0.5 mr-1 inline h-3 w-3" style={{ color: 'var(--accent)' }} />
            Códex devocional
          </p>
          <h1
            className="text-4xl leading-[1.05] md:text-5xl lg:text-6xl"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
            }}
          >
            Loja de Terços
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed md:text-base lg:text-lg"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-elegant)' }}
          >
            Cada skin muda o tema visual e — quando temática — os 5 mistérios que
            você medita. Algumas vêm gratuitas, outras destravam pelo estudo, e
            algumas pelo terço físico.
          </p>
          {authenticated && (
            <p
              className="mx-auto mt-4 text-xs"
              style={{ color: 'var(--text-3)' }}
            >
              Sua coleção: <span style={{ color: 'var(--accent)' }}>{totalOwned}</span>/{items.length}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <RedeemCodeButton authenticated={authenticated} />
          </div>
        </header>

        {/* Filtros + grid (client component) */}
        <LojaFilters items={items} authenticated={authenticated}>
          {(filtered) => (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filtered.map((skin) => (
                <li key={skin.id}>
                  <SkinCard skin={skin} />
                </li>
              ))}
            </ul>
          )}
        </LojaFilters>
      </div>
    </main>
  )
}

function SkinCard({ skin }: { skin: RosarySkinCatalogItem }) {
  const status = unlockStatusOf(skin)
  const clickable = status === 'owned' || status === 'unlocked' || status === 'locked'

  const Inner = (
    <article
      className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border p-5 transition"
      style={{
        borderColor: skin.equipped
          ? 'var(--accent)'
          : status === 'coming_soon'
            ? 'var(--border-1)'
            : skin.theme.borderStrong,
        background: 'var(--surface-2)',
        opacity: status === 'coming_soon' ? 0.55 : 1,
      }}
    >
      {/* Glow assinatura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            status === 'coming_soon'
              ? 'transparent'
              : `radial-gradient(ellipse 60% 50% at 50% 0%, ${skin.theme.accent}18 0%, transparent 55%)`,
        }}
      />

      {/* Header com raridade + equipped */}
      <div className="relative flex items-center justify-between">
        <span
          className="text-[9px] uppercase tracking-[0.28em]"
          style={{
            color: rarityColor(skin.raridade),
            fontFamily: 'var(--font-display)',
          }}
        >
          {skin.raridade}
        </span>
        {skin.equipped && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} /> Equipado
          </span>
        )}
        {!skin.equipped && skin.owned && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
              border: '1px solid var(--border-1)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Na coleção
          </span>
        )}
        {status === 'coming_soon' && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
            }}
          >
            <Lock className="h-2.5 w-2.5" /> Em breve
          </span>
        )}
        {status === 'locked' && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
            }}
          >
            <Lock className="h-2.5 w-2.5" /> Bloqueado
          </span>
        )}
      </div>

      {/* Preview mini-rosary */}
      <div className="relative flex justify-center py-2">
        <SkinMiniPreview theme={skin.theme} size={160} />
      </div>

      {/* Nome + subtítulo */}
      <div className="relative">
        <h2
          className="text-xl leading-tight md:text-[1.4rem]"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.005em',
          }}
        >
          {skin.nome}
        </h2>
        {skin.subtitulo && (
          <p
            className="mt-1 text-xs italic md:text-sm"
            style={{ color: 'var(--text-3)' }}
          >
            {skin.subtitulo}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="relative mt-auto flex items-center justify-between gap-3 pt-2">
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {skin.categoria}
        </span>
        {status === 'owned' && (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{
              color: skin.theme.accent,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            Detalhes →
          </span>
        )}
        {status === 'unlocked' && (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            Disponível →
          </span>
        )}
        {status === 'locked' && skin.unlock_label && (
          <span className="text-right text-[10px] italic leading-tight" style={{ color: 'var(--text-3)' }}>
            {skin.unlock_label}
          </span>
        )}
      </div>
    </article>
  )

  if (!clickable) return <div className="h-full">{Inner}</div>

  return (
    <Link
      href={`/rosario/loja/${skin.slug}`}
      className="block h-full transition active:scale-[0.985]"
      style={{ textDecoration: 'none' }}
    >
      {Inner}
    </Link>
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
      return 'var(--text-3)'
  }
}
