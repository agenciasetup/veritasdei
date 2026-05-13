'use client'

/**
 * GroupDashboard — dashboard de um grupo de estudo.
 *
 * 3 seções:
 *  1. Header com nome + descrição + código + meta info
 *  2. Ranking semanal (top 5 por XP estimado dos últimos 7 dias)
 *  3. Tabela de membros (XP, nível, streak, último estudo, contagens)
 *  4. Feed de atividade (últimos 30 dias, mix de estudo e provas aprovadas)
 *
 * Tudo busca via RPCs SECURITY DEFINER (study_group_member_stats,
 * study_group_weekly_xp, study_group_activity_feed) que validam que
 * auth.uid() é member do grupo antes de retornar dados privados.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Copy,
  Crown,
  Flame,
  Loader2,
  Trophy,
  Users,
  User as UserIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import GlassCard from '@/components/educa/GlassCard'

type GroupInfo = {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string | null
  member_count: number
  created_at: string
}

type MemberStat = {
  user_id: string
  name: string | null
  profile_image_url: string | null
  public_handle: string | null
  role: string
  joined_at: string
  total_xp: number
  current_level: number
  current_streak: number
  longest_streak: number
  last_study_at: string | null
  studied_count: number
  quizzes_passed: number
}

type WeeklyEntry = {
  user_id: string
  name: string | null
  profile_image_url: string | null
  weekly_xp: number
  weekly_subtopics: number
  weekly_quizzes: number
}

type FeedItem = {
  kind: 'studied' | 'quiz_passed'
  user_id: string
  name: string | null
  profile_image_url: string | null
  ref_id: string | null
  ref_title: string | null
  score: number | null
  occurred_at: string
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `há ${days}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function GroupDashboard({ groupId }: { groupId: string }) {
  const supabase = createClient()
  const [info, setInfo] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<MemberStat[]>([])
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const [infoRes, membersRes, weeklyRes, feedRes] = await Promise.all([
        supabase
          .from('study_groups')
          .select('id, name, description, invite_code, created_by, member_count, created_at')
          .eq('id', groupId)
          .maybeSingle(),
        supabase.rpc('study_group_member_stats', { p_group_id: groupId }),
        supabase.rpc('study_group_weekly_xp', { p_group_id: groupId }),
        supabase.rpc('study_group_activity_feed', { p_group_id: groupId, p_limit: 30 }),
      ])

      if (infoRes.error) throw infoRes.error
      if (!infoRes.data) {
        setError('Grupo não encontrado ou você não é membro.')
        setLoading(false)
        return
      }
      setInfo(infoRes.data as GroupInfo)
      setMembers(((membersRes.data as MemberStat[]) ?? []))
      setWeekly(((weeklyRes.data as WeeklyEntry[]) ?? []))
      setFeed(((feedRes.data as FeedItem[]) ?? []))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [supabase, groupId])

  useEffect(() => {
    load()
  }, [load])

  async function copyCode() {
    if (!info) return
    try {
      await navigator.clipboard.writeText(info.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ok */
    }
  }

  const topThree = useMemo(() => weekly.slice(0, 3), [weekly])

  if (loading && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--surface-1)' }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ background: 'var(--surface-1)' }}
      >
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          {error ?? 'Grupo não encontrado.'}
        </p>
        <Link
          href="/estudo/grupos"
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-1)',
            color: 'var(--text-2)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos grupos
        </Link>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          'radial-gradient(ellipse 700px 500px at 50% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), radial-gradient(ellipse 500px 400px at 100% 100%, color-mix(in srgb, var(--wine) 14%, transparent), transparent 70%), var(--surface-1)',
      }}
    >
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-32 md:py-10">
        <Link
          href="/estudo/grupos"
          className="inline-flex items-center gap-1 text-xs mb-6"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos grupos
        </Link>

        {/* Header do grupo */}
        <GlassCard variant="gold" padded className="mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] tracking-[0.25em] uppercase mb-2"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Grupo de estudo
              </p>
              <h1
                className="text-2xl md:text-3xl mb-1 leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-1)',
                }}
              >
                {info.name}
              </h1>
              {info.description && (
                <p
                  className="text-sm mt-1"
                  style={{
                    color: 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {info.description}
                </p>
              )}
              <div
                className="flex flex-wrap items-center gap-3 mt-3 text-xs"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {info.member_count}{' '}
                  {info.member_count === 1 ? 'membro' : 'membros'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> criado em{' '}
                  {new Date(info.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm tabular-nums flex-shrink-0"
              style={{
                background: 'rgba(0,0,0,0.45)',
                border:
                  '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                color: copied ? 'var(--success)' : 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                letterSpacing: '0.15em',
              }}
              aria-label="Copiar código de convite"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {info.invite_code}
            </button>
          </div>
        </GlassCard>

        {/* Ranking semanal (top 3 destaque) */}
        {topThree.some((w) => w.weekly_xp > 0) && (
          <section className="mb-6">
            <h2
              className="text-xs tracking-[0.18em] uppercase mb-3 inline-flex items-center gap-2 px-1"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Trophy className="w-3.5 h-3.5" /> Ranking da semana
            </h2>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {topThree.map((w, i) => (
                <div key={w.user_id} className="contents">
                  <RankingCard rank={i + 1} entry={w} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Membros + Feed lado a lado em desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 md:gap-6">
          {/* Membros */}
          <section>
            <h2
              className="text-xs tracking-[0.18em] uppercase mb-3 inline-flex items-center gap-2 px-1"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Users className="w-3.5 h-3.5" /> Membros
            </h2>
            <GlassCard variant="default" padded>
              {members.length === 0 ? (
                <p
                  className="text-sm text-center py-4"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Carregando...
                </p>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border-1)' }}>
                  {members.map((m) => (
                    <li key={m.user_id} className="py-3 first:pt-0 last:pb-0">
                      <MemberRow member={m} />
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </section>

          {/* Feed */}
          <section>
            <h2
              className="text-xs tracking-[0.18em] uppercase mb-3 inline-flex items-center gap-2 px-1"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Flame className="w-3.5 h-3.5" /> Atividade recente
            </h2>
            <GlassCard variant="inset" padded>
              {feed.length === 0 ? (
                <p
                  className="text-xs text-center py-4"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Sem atividade recente dos membros.
                </p>
              ) : (
                <ul className="space-y-3">
                  {feed.slice(0, 12).map((f, i) => (
                    <li key={`${f.kind}-${f.ref_id}-${i}`}>
                      <FeedRow item={f} />
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </section>
        </div>
      </main>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────────────────

function Avatar({
  url,
  size = 32,
}: {
  url: string | null
  size?: number
}) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <UserIcon
          className="opacity-50"
          style={{ width: size * 0.5, height: size * 0.5, color: 'var(--text-3)' }}
        />
      )}
    </div>
  )
}

function RankingCard({ rank, entry }: { rank: number; entry: WeeklyEntry }) {
  const tier =
    rank === 1
      ? { color: '#C9A84C', label: 'Ouro' }
      : rank === 2
        ? { color: '#B8B8B8', label: 'Prata' }
        : { color: '#A5743F', label: 'Bronze' }
  return (
    <div
      className="rounded-2xl p-3 md:p-4 text-center"
      style={{
        background:
          rank === 1
            ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 18%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.55) 100%)'
            : 'linear-gradient(180deg, rgba(20,18,16,0.7) 0%, rgba(15,14,12,0.55) 100%)',
        border: `1px solid color-mix(in srgb, ${tier.color} 32%, transparent)`,
        backdropFilter: 'blur(14px)',
        boxShadow:
          rank === 1
            ? `0 8px 22px -8px color-mix(in srgb, ${tier.color} 40%, transparent)`
            : 'none',
      }}
    >
      <div className="flex justify-center mb-2">
        <Avatar url={entry.profile_image_url} size={rank === 1 ? 48 : 40} />
      </div>
      <div
        className="text-[10px] tracking-[0.2em] uppercase mb-1"
        style={{ color: tier.color, fontFamily: 'var(--font-display)' }}
      >
        #{rank} • {tier.label}
      </div>
      <p
        className="text-sm truncate font-medium"
        style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
      >
        {entry.name ?? 'Anônimo'}
      </p>
      <p
        className="text-base md:text-lg mt-1"
        style={{ color: tier.color, fontFamily: 'var(--font-display)', fontWeight: 700 }}
      >
        {entry.weekly_xp} XP
      </p>
      <p
        className="text-[10px]"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {entry.weekly_subtopics} lições · {entry.weekly_quizzes} provas
      </p>
    </div>
  )
}

function MemberRow({ member }: { member: MemberStat }) {
  const isOwner = member.role === 'owner'
  return (
    <div className="flex items-center gap-3">
      <Avatar url={member.profile_image_url} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          >
            {member.name ?? 'Anônimo'}
          </p>
          {isOwner && (
            <span
              title="Dono do grupo"
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px]"
              style={{
                background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              <Crown className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
        <p
          className="text-[11px] truncate"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Último estudo: {relativeTime(member.last_study_at)}
        </p>
      </div>
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0 text-right">
        <Stat
          icon={Flame}
          value={member.current_streak.toString()}
          color={
            member.current_streak > 0 ? 'var(--accent)' : 'var(--text-3)'
          }
        />
        <Stat
          icon={BookOpen}
          value={member.studied_count.toString()}
          color="var(--text-2)"
        />
        <Stat
          icon={Trophy}
          value={member.quizzes_passed.toString()}
          color="var(--text-2)"
        />
        <div
          className="px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1"
          style={{
            background:
              'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
            color: 'var(--accent-contrast)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }}
          title={`${member.total_xp} XP totais`}
        >
          <span className="opacity-80 text-[9px] tracking-wider">NV</span>
          {member.current_level}
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  value,
  color,
}: {
  icon: React.ElementType
  value: string
  color: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      style={{ color, fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}
    >
      <Icon className="w-3 h-3" />
      {value}
    </span>
  )
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar url={item.profile_image_url} size={28} />
      <div className="min-w-0 flex-1">
        <p
          className="text-xs leading-snug"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          <strong style={{ color: 'var(--text-1)' }}>
            {item.name ?? 'Alguém'}
          </strong>{' '}
          {item.kind === 'studied' ? (
            <>estudou <strong style={{ color: 'var(--accent)' }}>{item.ref_title ?? 'uma lição'}</strong></>
          ) : (
            <>
              gabaritou{' '}
              <strong style={{ color: 'var(--accent)' }}>
                {item.ref_title ?? 'uma prova'}
              </strong>
              {item.score != null && (
                <span style={{ color: 'var(--text-3)' }}> · {item.score}%</span>
              )}
            </>
          )}
        </p>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {relativeTime(item.occurred_at)}
        </p>
      </div>
    </div>
  )
}
