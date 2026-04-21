'use client'

import { X, Crown } from 'lucide-react'
import { useStudyGroupMembers, type StudyGroup } from '@/lib/study/useStudyGroups'

interface Props {
  group: StudyGroup
  onClose: () => void
}

export default function StudyGroupMembersDrawer({ group, onClose }: Props) {
  const { members, loading } = useStudyGroupMembers(group.id)

  return (
    <div
      className="fixed inset-0 z-[60] flex"
      role="dialog"
      aria-modal="true"
      aria-label={`Membros de ${group.name}`}
    >
      <button
        type="button"
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <aside
        className="w-full max-w-sm flex flex-col h-full overflow-hidden"
        style={{
          background: 'var(--surface-2)',
          borderLeft: '1px solid rgba(201,168,76,0.18)',
        }}
      >
        <header
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-1)' }}
        >
          <div className="min-w-0">
            <p
              className="text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Membros
            </p>
            <p
              className="text-sm mt-0.5 truncate"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              {group.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95"
            style={{
              color: 'var(--text-2)',
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <p
              className="text-center text-sm py-6"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Carregando...
            </p>
          ) : members.length === 0 ? (
            <p
              className="text-center text-sm py-6"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Nenhum membro ainda.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-3 p-2 rounded-lg"
              >
                <div
                  className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  {m.profile?.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.profile.profile_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                    >
                      {(m.profile?.name || m.profile?.public_handle || '?')
                        .trim()
                        .split(/\s+/)
                        .map((p) => p.charAt(0))
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
                    >
                      {m.profile?.name || m.profile?.public_handle || 'Usuário'}
                    </p>
                    {m.role === 'owner' ? (
                      <Crown
                        className="w-3 h-3 flex-shrink-0"
                        style={{ color: 'var(--accent)' }}
                      />
                    ) : null}
                  </div>
                  {m.profile?.public_handle ? (
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                    >
                      @{m.profile.public_handle}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
