'use client'

/**
 * GroupDashboard — dashboard editorial flat de um grupo de estudo.
 *
 * Estrutura:
 *  1. Voltar + Header (nome, descrição, código, contagem, dono pode editar pacto)
 *  2. Pacto da semana (meta coletiva de lições, lema, escritura)
 *  3. Trilha do grupo (subtopics curados pelo dono — usa StudyGroupTrailPicker)
 *  4. Ranking da semana (top 3 — sem brilho de bandeira)
 *  5. Membros (linka pro perfil público, com botão Seguir inline)
 *  6. Feed de atividade
 *
 * Visual: paleta sólida (--surface-1 fundo, --surface-2 cards), borda 5% branco,
 * sem gradientes, sem eyebrow ALL CAPS, dourado só em acentos (números, lema).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Compass,
  Copy,
  Crown,
  Flame,
  Link2,
  Loader2,
  MessageCircle,
  Pencil,
  Pin,
  Plus,
  Quote,
  Send,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  User as UserIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  useStudyGroupPact,
  useStudyGroupTrail,
  type StudyGroupPick,
} from '@/lib/study/useStudyGroupTrail'
import {
  useStudyGroupPosts,
  type StudyGroupPost,
} from '@/lib/study/useStudyGroupPosts'
import StudyGroupTrailPicker from '@/components/study/StudyGroupTrailPicker'

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
  user_number: number | null
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
  public_handle: string | null
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

const CARD_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 24,
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

function profileHref(p: { public_handle: string | null; user_number?: number | null }): string | null {
  if (p.public_handle) return `/comunidade/@${p.public_handle}`
  if (p.user_number) return `/comunidade/p/${p.user_number}`
  return null
}

export default function GroupDashboard({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [info, setInfo] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<MemberStat[]>([])
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const trail = useStudyGroupTrail(groupId)
  const pact = useStudyGroupPact(groupId)
  const posts = useStudyGroupPosts(groupId)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pactOpen, setPactOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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
      const memberRows = (membersRes.data as MemberStat[]) ?? []
      setMembers(memberRows)
      setWeekly((weeklyRes.data as WeeklyEntry[]) ?? [])
      setFeed((feedRes.data as FeedItem[]) ?? [])

      // Hidrata user_number dos membros (RPC ainda não retorna)
      const ids = memberRows.map((m) => m.user_id)
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, user_number')
          .in('id', ids)
        const byId = new Map(
          ((profs ?? []) as Array<{ id: string; user_number: number | null }>).map((p) => [p.id, p.user_number]),
        )
        setMembers((prev) => prev.map((m) => ({ ...m, user_number: byId.get(m.user_id) ?? null })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [supabase, groupId])

  useEffect(() => {
    void load()
  }, [load])

  // Carrega quem o viewer já segue (apenas pra membros do grupo)
  useEffect(() => {
    if (!supabase || !user || members.length === 0) return
    const targets = members.map((m) => m.user_id).filter((id) => id !== user.id)
    if (targets.length === 0) return
    let cancelled = false
    void supabase
      .from('vd_follows')
      .select('followed_user_id')
      .eq('follower_user_id', user.id)
      .in('followed_user_id', targets)
      .then(({ data }: { data: Array<{ followed_user_id: string }> | null }) => {
        if (cancelled) return
        const ids = new Set((data ?? []).map((r) => r.followed_user_id))
        setFollowedIds(ids)
      })
    return () => {
      cancelled = true
    }
  }, [supabase, user, members])

  const isOwner = useMemo(() => {
    if (!user) return false
    return members.some((m) => m.user_id === user.id && m.role === 'owner')
  }, [user, members])

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

  async function copyInviteLink() {
    if (!info) return
    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${origin}/estudo/grupos?convite=${info.invite_code}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Grupo de estudo: ${info.name}`,
          text: `Entre no nosso grupo de estudo no Veritas Educa.`,
          url: link,
        })
        return
      }
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      /* ok — share cancelado ou clipboard indisponível */
    }
  }

  async function handleFollowToggle(targetId: string) {
    if (!user) return
    const following = followedIds.has(targetId)
    // optimistic
    setFollowedIds((prev) => {
      const next = new Set(prev)
      if (following) next.delete(targetId)
      else next.add(targetId)
      return next
    })
    try {
      const res = await fetch(`/api/comunidade/follows/${targetId}`, {
        method: following ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error()
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev)
        if (following) next.add(targetId)
        else next.delete(targetId)
        return next
      })
    }
  }

  const pickedIds = useMemo(
    () => new Set(trail.picks.map((p) => p.subtopic_id)),
    [trail.picks],
  )

  const topThree = useMemo(() => weekly.slice(0, 3), [weekly])

  if (loading && !info) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
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
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid rgba(255,255,255,0.06)',
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
    <div className="min-h-screen" style={{ background: 'var(--surface-1)' }}>
      <main
        className="
          max-w-2xl mx-auto px-4 pt-5 pb-28
          md:py-10
          lg:max-w-[1100px] lg:px-8 lg:pt-10 lg:pb-16
        "
      >
        <Link
          href="/estudo/grupos"
          className="inline-flex items-center gap-1.5 text-xs mb-7 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos grupos
        </Link>

        {/* Header */}
        <header className="mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1
                className="text-3xl md:text-5xl leading-tight mb-2"
                style={{
                  fontFamily: 'var(--font-elegant)',
                  color: 'var(--text-1)',
                  fontWeight: 500,
                }}
              >
                {info.name}
              </h1>
              {info.description ? (
                <p
                  className="text-sm md:text-base max-w-xl"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  {info.description}
                </p>
              ) : null}
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {info.member_count}{' '}
                  {info.member_count === 1 ? 'membro' : 'membros'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  desde {new Date(info.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </span>
                {isOwner ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      color: 'var(--accent)',
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.18)',
                    }}
                  >
                    <Crown className="w-3 h-3" /> Você é o dono
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs tabular-nums transition-colors"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: copied ? 'var(--success)' : 'var(--text-2)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.14em',
                }}
                aria-label="Copiar código de convite"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {info.invite_code}
              </button>
              <button
                type="button"
                onClick={copyInviteLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-colors"
                style={{
                  background: 'rgba(201,168,76,0.10)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: linkCopied ? 'var(--success)' : 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
                aria-label="Compartilhar link de convite"
              >
                {linkCopied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                {linkCopied ? 'Link copiado' : 'Convidar'}
              </button>
            </div>
          </div>
        </header>

        {/* Grid principal — 12 col em desktop */}
        <div
          className="
            space-y-4
            lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5
          "
        >
          {/* Pacto da semana (8 col) */}
          <div className="lg:col-span-8">
            <PactoCard
              pact={pact.pact}
              loading={pact.loading}
              isOwner={isOwner}
              onEdit={() => setPactOpen(true)}
            />
          </div>

          {/* Ranking top 3 (4 col) */}
          <div className="lg:col-span-4">
            <RankingTopCard entries={topThree} />
          </div>

          {/* Trilha do grupo (12 col) */}
          <div className="lg:col-span-12">
            <TrailCard
              picks={trail.picks}
              loading={trail.loading}
              isOwner={isOwner}
              onPick={() => setPickerOpen(true)}
              onRemove={trail.remove}
            />
          </div>

          {/* Mural de reflexões (7 col) */}
          <div className="lg:col-span-7">
            <MuralCard
              posts={posts.posts}
              loading={posts.loading}
              isOwner={isOwner}
              onCreate={posts.create}
              onRemove={posts.remove}
              onTogglePin={posts.togglePin}
            />
          </div>

          {/* Feed (5 col) */}
          <div className="lg:col-span-5">
            <SectionTitle icon={Flame} label="Atividade recente" />
            <div className="p-5 md:p-6" style={CARD_STYLE}>
              {feed.length === 0 ? (
                <p
                  className="text-sm text-center py-4"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  Sem atividade recente.
                </p>
              ) : (
                <ul className="space-y-3.5">
                  {feed.slice(0, 14).map((f, i) => (
                    <li key={`${f.kind}-${f.ref_id}-${i}`}>
                      <FeedRow item={f} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Membros (12 col) */}
          <div className="lg:col-span-12">
            <SectionTitle icon={Users} label="Membros" hint={`${members.length}`} />
            <div className="p-2 md:p-3" style={CARD_STYLE}>
              {members.length === 0 ? (
                <p
                  className="text-sm text-center py-6"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  Carregando…
                </p>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {members.map((m) => (
                    <li key={m.user_id} className="px-3 py-3.5">
                      <MemberRow
                        member={m}
                        isViewer={user?.id === m.user_id}
                        isFollowing={followedIds.has(m.user_id)}
                        onFollow={() => handleFollowToggle(m.user_id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {isOwner ? (
        <>
          <StudyGroupTrailPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            pickedIds={pickedIds}
            onAdd={trail.add}
            onRemove={trail.remove}
          />
          <PactoEditor
            open={pactOpen}
            onClose={() => setPactOpen(false)}
            initial={pact.pact}
            onSave={async (args) => {
              await pact.upsert(args)
              setPactOpen(false)
            }}
          />
        </>
      ) : null}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Sections
// ──────────────────────────────────────────────────────────────────────

function SectionTitle({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ElementType
  label: string
  hint?: string
}) {
  return (
    <header className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <Icon
          className="w-4 h-4"
          strokeWidth={1.6}
          style={{ color: 'var(--accent)' }}
        />
        <h2
          className="text-base"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          {label}
        </h2>
      </div>
      {hint ? (
        <span
          className="text-[11px] tabular-nums"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {hint}
        </span>
      ) : null}
    </header>
  )
}

function PactoCard({
  pact,
  loading,
  isOwner,
  onEdit,
}: {
  pact: ReturnType<typeof useStudyGroupPact>['pact']
  loading: boolean
  isOwner: boolean
  onEdit: () => void
}) {
  const goal = pact?.goal_subtopics ?? 25
  const done = pact?.weekly_subtopics_done ?? 0
  const pct = Math.min(100, Math.round((done / Math.max(1, goal)) * 100))
  const fulfilled = done >= goal && goal > 0
  return (
    <>
      <SectionTitle icon={Target} label="Pacto da semana" />
      <div className="p-6 md:p-7 relative" style={CARD_STYLE}>
        {fulfilled ? (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] mb-3"
            style={{
              background: 'rgba(106,170,98,0.10)',
              border: '1px solid rgba(106,170,98,0.28)',
              color: 'var(--success)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            <Check className="w-3 h-3" /> Pacto cumprido nesta semana
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            {pact?.motto ? (
              <p
                className="text-xl md:text-2xl leading-tight mb-1"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-elegant)',
                  fontWeight: 500,
                }}
              >
                “{pact.motto}”
              </p>
            ) : (
              <p
                className="text-xl md:text-2xl leading-tight mb-1"
                style={{
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-elegant)',
                  fontWeight: 500,
                }}
              >
                Caminhar juntos esta semana
              </p>
            )}
            {pact?.scripture ? (
              <p
                className="text-xs italic mt-1.5 max-w-xl"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                <Quote
                  className="w-3 h-3 inline-block mr-1 -mt-0.5"
                  style={{ color: 'var(--accent)' }}
                />
                {pact.scripture}
              </p>
            ) : null}
          </div>
          {isOwner ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs flex-shrink-0 transition-colors"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
              }}
              title="Editar lema e meta"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-2 mb-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl md:text-4xl tabular-nums"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-elegant)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {done}
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              / {goal} lições
            </span>
          </div>
          <span
            className="text-xs tabular-nums"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {pct}%
          </span>
        </div>

        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: fulfilled ? 'var(--success)' : 'var(--accent)',
            }}
          />
        </div>

        <div
          className="flex items-center justify-between mt-3 text-[11px]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <span>{pact?.active_members ?? 0} membro{(pact?.active_members ?? 0) === 1 ? '' : 's'} ativos esta semana</span>
          <span>{loading ? '…' : 'Atualiza em tempo real'}</span>
        </div>
      </div>
    </>
  )
}

function RankingTopCard({ entries }: { entries: WeeklyEntry[] }) {
  const hasData = entries.some((e) => e.weekly_xp > 0)
  return (
    <>
      <SectionTitle icon={Trophy} label="Ranking da semana" />
      <div className="p-5 md:p-6" style={CARD_STYLE}>
        {!hasData ? (
          <p
            className="text-sm py-6 text-center"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Ninguém estudou ainda esta semana. Comece a trilha e suba pro topo.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e, i) => (
              <li key={e.user_id}>
                <RankRow rank={i + 1} entry={e} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function RankRow({ rank, entry }: { rank: number; entry: WeeklyEntry }) {
  const tone =
    rank === 1
      ? { fg: 'var(--accent)', dot: 'var(--accent)' }
      : rank === 2
        ? { fg: 'var(--text-1)', dot: '#B8B8B8' }
        : { fg: 'var(--text-2)', dot: '#A5743F' }
  const href = profileHref({ public_handle: entry.public_handle })
  const content = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 flex-shrink-0 w-7">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: tone.dot }}
        />
        <span
          className="text-xs tabular-nums"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {rank}
        </span>
      </div>
      <Avatar url={entry.profile_image_url} size={32} />
      <div className="min-w-0 flex-1">
        <p
          className="text-sm truncate"
          style={{
            color: tone.fg,
            fontFamily: 'var(--font-body)',
            fontWeight: rank === 1 ? 600 : 500,
          }}
        >
          {entry.name ?? 'Anônimo'}
        </p>
        <p
          className="text-[10px] tabular-nums"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {entry.weekly_subtopics} lições · {entry.weekly_quizzes} provas
        </p>
      </div>
      <span
        className="text-sm tabular-nums"
        style={{
          color: 'var(--accent)',
          fontFamily: 'var(--font-elegant)',
          fontWeight: 600,
        }}
      >
        {entry.weekly_xp}
        <span
          className="text-[10px] ml-1"
          style={{ color: 'var(--text-3)' }}
        >
          XP
        </span>
      </span>
    </div>
  )
  if (href) {
    return <Link href={href} className="block hover:opacity-90 transition-opacity">{content}</Link>
  }
  return content
}

function MuralCard({
  posts,
  loading,
  isOwner,
  onCreate,
  onRemove,
  onTogglePin,
}: {
  posts: StudyGroupPost[]
  loading: boolean
  isOwner: boolean
  onCreate: (body: string) => Promise<boolean>
  onRemove: (id: string) => Promise<boolean>
  onTogglePin: (id: string) => Promise<boolean>
}) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  async function submit() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const ok = await onCreate(body)
    setSending(false)
    if (ok) setDraft('')
  }

  return (
    <>
      <SectionTitle icon={MessageCircle} label="Reflexões do grupo" />
      <div className="p-5 md:p-6" style={CARD_STYLE}>
        {/* Composer */}
        <div
          className="rounded-2xl p-3 mb-4"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Compartilhe uma reflexão, intenção ou pergunta com o grupo…"
            className="w-full bg-transparent outline-none text-sm resize-none"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span
              className="text-[10px] tabular-nums"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {draft.length}/2000
            </span>
            <button
              onClick={submit}
              disabled={sending || !draft.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs disabled:opacity-40 transition-opacity"
              style={{
                background: 'rgba(201,168,76,0.10)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Publicar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center">
            <Loader2
              className="w-4 h-4 mx-auto animate-spin"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        ) : posts.length === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Ainda não há reflexões. Seja o primeiro a compartilhar.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id}>
                <MuralPost
                  post={p}
                  isOwner={isOwner}
                  onRemove={onRemove}
                  onTogglePin={onTogglePin}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function MuralPost({
  post,
  isOwner,
  onRemove,
  onTogglePin,
}: {
  post: StudyGroupPost
  isOwner: boolean
  onRemove: (id: string) => Promise<boolean>
  onTogglePin: (id: string) => Promise<boolean>
}) {
  const href = profileHref({ public_handle: post.public_handle })
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        background: post.pinned ? 'rgba(201,168,76,0.05)' : 'rgba(0,0,0,0.2)',
        border: post.pinned
          ? '1px solid rgba(201,168,76,0.18)'
          : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <Avatar url={post.profile_image_url} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {href ? (
              <Link
                href={href}
                className="text-sm font-medium hover:opacity-80 truncate"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
              >
                {post.name ?? 'Anônimo'}
              </Link>
            ) : (
              <span
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
              >
                {post.name ?? 'Anônimo'}
              </span>
            )}
            {post.pinned ? (
              <Pin
                className="w-3 h-3 flex-shrink-0"
                style={{ color: 'var(--accent)' }}
              />
            ) : null}
            <span
              className="text-[10px] flex-shrink-0"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              · {relativeTime(post.created_at)}
            </span>
          </div>
          <p
            className="text-sm mt-1 whitespace-pre-wrap break-words"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            {post.body}
          </p>
        </div>
        {(isOwner || post.can_delete) ? (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {isOwner ? (
              <button
                onClick={() => void onTogglePin(post.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                style={{ color: post.pinned ? 'var(--accent)' : 'var(--text-3)' }}
                title={post.pinned ? 'Desafixar' : 'Fixar no topo'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            ) : null}
            {post.can_delete ? (
              <button
                onClick={() => {
                  if (window.confirm('Apagar esta reflexão?')) {
                    void onRemove(post.id)
                  }
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-3)' }}
                title="Apagar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TrailCard({
  picks,
  loading,
  isOwner,
  onPick,
  onRemove,
}: {
  picks: StudyGroupPick[]
  loading: boolean
  isOwner: boolean
  onPick: () => void
  onRemove: (id: string) => Promise<boolean>
}) {
  return (
    <>
      <div className="flex items-end justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Compass
            className="w-4 h-4"
            strokeWidth={1.6}
            style={{ color: 'var(--accent)' }}
          />
          <h2
            className="text-base"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            Trilha do grupo
          </h2>
        </div>
        {isOwner ? (
          <button
            onClick={onPick}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: 'rgba(201,168,76,0.10)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar lição
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="p-6 text-center" style={CARD_STYLE}>
          <Loader2
            className="w-4 h-4 mx-auto animate-spin"
            style={{ color: 'var(--accent)' }}
          />
        </div>
      ) : picks.length === 0 ? (
        <div className="p-6 text-center" style={CARD_STYLE}>
          <Sparkles
            className="w-5 h-5 mx-auto mb-3 opacity-50"
            style={{ color: 'var(--accent)' }}
          />
          <p
            className="text-sm"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            Ainda não há trilha curada.
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {isOwner
              ? 'Selecione lições pra guiar o estudo dos membros.'
              : 'O dono ainda não escolheu lições pra trilha. Estude livremente nos pilares.'}
          </p>
        </div>
      ) : (
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {picks.map((p, i) => (
            <li key={p.subtopic_id}>
              <TrailPickCard pick={p} index={i + 1} isOwner={isOwner} onRemove={onRemove} />
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

function TrailPickCard({
  pick,
  index,
  isOwner,
  onRemove,
}: {
  pick: StudyGroupPick
  index: number
  isOwner: boolean
  onRemove: (id: string) => Promise<boolean>
}) {
  const href = `/estudo/${pick.pillar_slug}/${pick.topic_slug}/${pick.subtopic_slug}`
  return (
    <div className="relative h-full">
      <Link
        href={href}
        className="block h-full p-5 transition-colors hover:bg-white/[0.01]"
        style={CARD_STYLE}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] tabular-nums"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {String(index).padStart(2, '0')}
          </span>
          {pick.studied_by_me ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--success)',
                background: 'rgba(106,170,98,0.08)',
                border: '1px solid rgba(106,170,98,0.2)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Check className="w-2.5 h-2.5" /> Estudado
            </span>
          ) : null}
        </div>
        <p
          className="text-xs mb-1"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {pick.pillar_title} · {pick.topic_title}
        </p>
        <p
          className="text-base leading-snug mb-2"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          {pick.title}
        </p>
        {pick.note ? (
          <p
            className="text-xs italic mt-2 line-clamp-2"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            “{pick.note}”
          </p>
        ) : null}
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
          Abrir lição
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
      {isOwner ? (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (window.confirm('Remover esta lição da trilha?')) {
              void onRemove(pick.subtopic_id)
            }
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-3)' }}
          title="Remover da trilha"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function MemberRow({
  member,
  isViewer,
  isFollowing,
  onFollow,
}: {
  member: MemberStat
  isViewer: boolean
  isFollowing: boolean
  onFollow: () => void
}) {
  const isOwner = member.role === 'owner'
  const href = profileHref(member)
  return (
    <div className="flex items-center gap-3">
      {href ? (
        <Link href={href} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity">
          <Avatar url={member.profile_image_url} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className="text-sm truncate"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}
              >
                {member.name ?? 'Anônimo'}
              </p>
              {isOwner ? (
                <Crown
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
              ) : null}
            </div>
            <p
              className="text-[11px] truncate"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Último estudo: {relativeTime(member.last_study_at)}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar url={member.profile_image_url} size={40} />
          <div className="min-w-0 flex-1">
            <p
              className="text-sm truncate"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              {member.name ?? 'Anônimo'}
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Último estudo: {relativeTime(member.last_study_at)}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="hidden md:inline-flex items-center gap-1 text-xs"
          title="Sequência de estudo"
          style={{
            color: member.current_streak > 0 ? 'var(--accent)' : 'var(--text-3)',
            fontFamily: 'var(--font-body)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <Flame className="w-3.5 h-3.5" /> {member.current_streak}
        </span>
        <span
          className="hidden md:inline-flex items-center gap-1 text-xs"
          title="Lições estudadas"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <BookOpen className="w-3.5 h-3.5" /> {member.studied_count}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] tabular-nums"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.18)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 600,
          }}
          title={`${member.total_xp} XP totais`}
        >
          nv {member.current_level}
        </span>
        {!isViewer && href ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFollow()
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors"
            style={{
              background: isFollowing ? 'transparent' : 'rgba(201,168,76,0.10)',
              border: isFollowing
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(201,168,76,0.25)',
              color: isFollowing ? 'var(--text-3)' : 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
            title={isFollowing ? 'Você já segue' : 'Seguir'}
          >
            {isFollowing ? (
              <Check className="w-3 h-3" />
            ) : (
              <UserPlus className="w-3 h-3" />
            )}
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function FeedRow({ item }: { item: FeedItem }) {
  const href = profileHref({ public_handle: null })
  return (
    <div className="flex items-start gap-2.5">
      <Avatar url={item.profile_image_url} size={28} />
      <div className="min-w-0 flex-1">
        <p
          className="text-xs leading-snug"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          {href ? (
            <Link href={href} style={{ color: 'var(--text-1)' }} className="font-medium hover:opacity-80">
              {item.name ?? 'Alguém'}
            </Link>
          ) : (
            <strong style={{ color: 'var(--text-1)' }}>
              {item.name ?? 'Alguém'}
            </strong>
          )}{' '}
          {item.kind === 'studied' ? (
            <>
              estudou{' '}
              <strong style={{ color: 'var(--accent)' }}>
                {item.ref_title ?? 'uma lição'}
              </strong>
            </>
          ) : (
            <>
              gabaritou{' '}
              <strong style={{ color: 'var(--accent)' }}>
                {item.ref_title ?? 'uma prova'}
              </strong>
              {item.score != null ? (
                <span style={{ color: 'var(--text-3)' }}> · {item.score}%</span>
              ) : null}
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
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.05)',
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

// ──────────────────────────────────────────────────────────────────────
// Pacto editor (modal)
// ──────────────────────────────────────────────────────────────────────

function PactoEditor({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial: ReturnType<typeof useStudyGroupPact>['pact']
  onSave: (args: { goal_subtopics: number; motto?: string | null; scripture?: string | null }) => Promise<void>
}) {
  const [goal, setGoal] = useState(initial?.goal_subtopics ?? 25)
  const [motto, setMotto] = useState(initial?.motto ?? '')
  const [scripture, setScripture] = useState(initial?.scripture ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoal(initial?.goal_subtopics ?? 25)
      setMotto(initial?.motto ?? '')
      setScripture(initial?.scripture ?? '')
    }
  }, [open, initial])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col p-6 md:p-7"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl mb-1"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          Pacto da semana
        </h2>
        <p
          className="text-xs mb-5"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Defina o lema, a escritura inspiradora e a meta coletiva.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span
              className="text-[11px] block mb-1.5"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Lema
            </span>
            <input
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              maxLength={120}
              placeholder="Ex.: Caminhar juntos a Quaresma"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </label>

          <label className="block">
            <span
              className="text-[11px] block mb-1.5"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Escritura / citação
            </span>
            <textarea
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Ex.: “Onde dois ou três estão reunidos em meu nome…” (Mt 18,20)"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </label>

          <label className="block">
            <span
              className="text-[11px] block mb-1.5"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Meta de lições nesta semana
            </span>
            <input
              type="number"
              min={1}
              max={999}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none tabular-nums"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              setSaving(true)
              await onSave({
                goal_subtopics: Math.max(1, Math.min(999, goal)),
                motto: motto.trim() || null,
                scripture: scripture.trim() || null,
              })
              setSaving(false)
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm disabled:opacity-40"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.30)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Salvar pacto
          </button>
        </div>
      </div>
    </div>
  )
}
