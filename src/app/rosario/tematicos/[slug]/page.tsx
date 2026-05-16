import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import {
  findThematicRosaryBySlug,
  evaluateThematicUnlock,
} from '@/features/rosario/data/thematicRosaries'
import { ThematicSessionClient } from '@/features/rosario/components/ThematicSessionClient'

export const dynamic = 'force-dynamic'

export default async function ThematicRosaryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const rosary = findThematicRosaryBySlug(slug)
  if (!rosary) {
    notFound()
  }

  // TODO: quando wired-up, buscar progresso de estudo do user logado.
  const completedTopics: string[] = []
  const status = evaluateThematicUnlock(rosary, completedTopics)

  // Bloqueado → mostra tela explicando como destravar
  if (!status.available) {
    return (
      <main
        className="relative min-h-screen w-full overflow-hidden"
        style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
      >
        <div className="bg-glow" aria-hidden />

        <Link
          href="/rosario/tematicos"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 text-sm transition md:left-8 md:top-6"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border"
            style={{
              borderColor: 'var(--accent-soft)',
              background: 'var(--surface-2)',
            }}
          >
            <Lock className="h-6 w-6" style={{ color: 'var(--accent)' }} />
          </div>
          <p
            className="mb-3 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            Terço bloqueado
          </p>
          <h1
            className="mb-3 text-3xl md:text-4xl"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
            }}
          >
            {rosary.name}
          </h1>
          <p
            className="mb-6 max-w-md text-sm md:text-base"
            style={{ color: 'var(--text-2)' }}
          >
            {rosary.description}
          </p>
          <div
            className="mb-8 rounded-2xl border px-5 py-4 text-sm"
            style={{
              borderColor: 'var(--accent-soft)',
              background: 'rgba(20, 18, 14, 0.55)',
              color: 'var(--text-2)',
            }}
          >
            <span
              className="block text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Como destravar
            </span>
            <span className="mt-1.5 block">
              {status.reason ?? 'Em breve.'}
            </span>
          </div>
          <Link
            href="/rosario/tematicos"
            className="rounded-xl border px-6 py-3 text-sm transition active:scale-[0.97]"
            style={{
              borderColor: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Ver todos
          </Link>
        </div>
      </main>
    )
  }

  return <ThematicSessionClient rosary={rosary} />
}
