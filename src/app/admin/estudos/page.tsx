import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminEstudosIndex() {
  const userId = await requireSystemAdmin()
  if (!userId) redirect('/')

  const supabase = await createServerSupabaseClient()
  const { data: groups } = await supabase
    .from('content_groups')
    .select('id, slug, title, subtitle')
    .eq('visible', true)
    .order('sort_order')

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          Estudos · Administração
        </h1>
        <p
          className="text-sm mt-2"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          Gere, revise e publique o conteúdo aprofundado de cada pilar.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(groups || []).map((g) => (
          <Link
            key={g.id}
            href={`/admin/estudos/${g.slug}`}
            className="feature-card"
          >
            <h3
              className="text-lg mb-1"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              {g.title}
            </h3>
            {g.subtitle ? (
              <p
                className="text-sm"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                {g.subtitle}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  )
}
