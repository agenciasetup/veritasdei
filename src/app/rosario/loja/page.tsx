import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rowToSkin } from '@/features/rosario/skins/loadActiveSkin'
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
            <p className="mx-auto mt-4 text-xs" style={{ color: 'var(--text-3)' }}>
              Sua coleção: <span style={{ color: 'var(--accent)' }}>{totalOwned}</span>/{items.length}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <RedeemCodeButton authenticated={authenticated} />
          </div>
        </header>

        <LojaFilters items={items} authenticated={authenticated} />
      </div>
    </main>
  )
}
