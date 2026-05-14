'use client'

/**
 * DashboardGruposStrip — fileira horizontal de grupos de estudo do usuário.
 *
 * - Sem grupos: card CTA único "Crie ou entre num grupo" → /estudo/grupos
 * - Com grupos: scroll horizontal de chips com nome + member_count, último
 *               card é o CTA "+ Novo grupo".
 *
 * Usa o hook existente `useMyStudyGroups`. Em mobile mantém a mesma
 * apresentação (scroll horizontal funciona bem nos dois).
 */

import Link from 'next/link'
import { ArrowRight, Plus, Users } from 'lucide-react'
import { useMyStudyGroups } from '@/lib/study/useStudyGroups'
import GlassCard from './GlassCard'

export default function DashboardGruposStrip() {
  const { groups, loading } = useMyStudyGroups()

  if (loading) {
    return (
      <GlassCard variant="flat" padded>
        <div
          className="h-20 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
      </GlassCard>
    )
  }

  if (groups.length === 0) {
    return (
      <Link href="/estudo/grupos" className="block">
        <GlassCard variant="flat" padded interactive>
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.5) 100%)',
                border:
                  '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <Users
                className="w-5 h-5 md:w-6 md:h-6"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] tracking-[0.2em] uppercase mb-0.5"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Grupos de estudo
              </p>
              <p
                className="text-sm md:text-base font-medium"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Crie ou entre num grupo de estudo
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Estude com amigos e mantenha a sequência juntos.
              </p>
            </div>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        </GlassCard>
      </Link>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Users
            className="w-4 h-4"
            strokeWidth={1.6}
            style={{ color: 'var(--accent)' }}
          />
          <h3
            className="text-sm"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            Meus grupos
          </h3>
        </div>
        <Link
          href="/estudo/grupos"
          className="text-[11px] inline-flex items-center gap-1"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/estudo/grupos/${g.id}`}
            className="flex-shrink-0 w-[220px]"
          >
            <GlassCard variant="flat" interactive>
              <div className="p-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.5) 100%)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    }}
                  >
                    <Users
                      className="w-4 h-4"
                      style={{ color: 'var(--accent)' }}
                    />
                  </div>
                  {g.my_role === 'owner' && (
                    <span
                      className="text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                      style={{
                        color: 'var(--accent)',
                        background: 'rgba(201,168,76,0.12)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Dono
                    </span>
                  )}
                </div>
                <p
                  className="text-sm font-medium line-clamp-1"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {g.name}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {g.member_count} membro{g.member_count === 1 ? '' : 's'}
                </p>
              </div>
            </GlassCard>
          </Link>
        ))}

        <Link href="/estudo/grupos" className="flex-shrink-0 w-[180px]">
          <GlassCard variant="gold" interactive>
            <div className="p-4 h-full flex flex-col justify-center items-center text-center gap-1">
              <Plus className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <p
                className="text-xs font-medium"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Novo grupo
              </p>
              <p
                className="text-[10px]"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Criar ou entrar
              </p>
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  )
}
