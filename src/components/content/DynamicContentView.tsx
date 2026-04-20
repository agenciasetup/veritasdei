'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  useContentGroup,
  useTopicFullContent,
  type ContentTopic,
  type ContentSubtopic,
  type ContentItem,
} from '@/lib/content/useContentGroup'
import { useContentProgress } from '@/lib/content/useContentProgress'
import { useAuth } from '@/contexts/AuthContext'
import ImmersiveReader from './ImmersiveReader'
import Divider from '@/components/ui/Divider'

// ─── Loading spinner ───
function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: 'var(--border-1)',
          borderTopColor: 'var(--accent)',
        }}
      />
    </div>
  )
}

// ─── Empty state ───
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-5">
      <p
        className="text-lg mb-2 tracking-[0.06em] uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}
      >
        Conteúdo não disponível
      </p>
      <p
        className="text-sm"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        O administrador precisa importar o conteúdo no painel admin.
      </p>
    </div>
  )
}

// ─── Main DynamicContentView component ───
export default function DynamicContentView({ groupSlug }: { groupSlug: string }) {
  const { group, topics, loading: groupLoading } = useContentGroup(groupSlug)
  const [selectedTopic, setSelectedTopic] = useState<ContentTopic | null>(null)
  const [selectedSubtopic, setSelectedSubtopic] = useState<(ContentSubtopic & { items: ContentItem[] }) | null>(null)
  const { user } = useAuth()
  const { isStudied, markStudied } = useContentProgress(user?.id, groupSlug)

  const { subtopics, loading: topicLoading } = useTopicFullContent(selectedTopic?.id ?? null)

  // Auto-navigate if topic has only 1 subtopic
  const singleSubtopic = subtopics.length === 1 && selectedTopic && !selectedSubtopic ? subtopics[0] : null

  function handleBack() {
    if (selectedSubtopic) {
      setSelectedSubtopic(null)
      // If the topic had only 1 subtopic, also go back from topic
      if (subtopics.length <= 1) {
        setSelectedTopic(null)
      }
    } else {
      setSelectedTopic(null)
    }
  }

  const currentSubtopic = selectedSubtopic || singleSubtopic

  if (groupLoading) return <Loader />
  if (!group) return <EmptyState />

  const headerTitle = currentSubtopic
    ? currentSubtopic.title
    : selectedTopic
      ? selectedTopic.title
      : group.title
  const headerSubtitle = !currentSubtopic
    ? (selectedTopic
      ? selectedTopic.description || `${subtopics.length} itens — toque para explorar`
      : group.description || group.subtitle || '')
    : null

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Back button */}
      {(selectedTopic || selectedSubtopic) && (
        <header className="relative z-10 w-full pt-6 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-[0.08em] uppercase active:scale-[0.97] transition-transform"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {selectedSubtopic && subtopics.length > 1
                  ? selectedTopic?.title
                  : group.title}
              </span>
            </button>
          </div>
        </header>
      )}

      {/* Page header */}
      <section className="relative z-10 text-center px-5 pt-8 pb-4">
        <h1
          className="text-2xl md:text-3xl tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {headerTitle}
        </h1>
        {headerSubtitle && (
          <p
            className="mt-2 text-sm max-w-xl mx-auto"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {headerSubtitle}
          </p>
        )}
        <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
      </section>

      {/* Content */}
      <main className="relative z-10 flex-1 pb-16">
        {/* Level 1: Topic grid */}
        {!selectedTopic && !currentSubtopic && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {topics.map((topic, i) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="text-left p-5 rounded-2xl fade-in active:scale-[0.99] transition-transform"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {topic.sort_order > 0 && (
                  <span
                    className="text-xs tracking-[0.15em] uppercase block mb-3"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                  >
                    {topic.subtitle || `#${topic.sort_order}`}
                  </span>
                )}
                <h3
                  className="text-base font-semibold leading-snug mb-2 tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
                >
                  {topic.title}
                </h3>
                {topic.description && (
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    {topic.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Level 2: Subtopic grid (only if topic has multiple subtopics) */}
        {selectedTopic && !currentSubtopic && !topicLoading && subtopics.length > 1 && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {subtopics.map((sub, i) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubtopic(sub)}
                className="text-left p-5 rounded-2xl fade-in active:scale-[0.99] transition-transform"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {sub.subtitle && (
                  <span
                    className="text-xs tracking-[0.15em] uppercase block mb-3"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                  >
                    {sub.subtitle}
                  </span>
                )}
                <h3
                  className="text-base font-semibold leading-snug mb-2 tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
                >
                  {sub.title}
                </h3>
                {sub.description && (
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    {sub.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading subtopics */}
        {selectedTopic && topicLoading && <Loader />}

        {/* Level 3: Immersive Reader (replaces carousel) */}
        {currentSubtopic && currentSubtopic.items.length > 0 && (
          <ImmersiveReader
            title={currentSubtopic.title}
            subtitle={currentSubtopic.subtitle || undefined}
            description={currentSubtopic.description || undefined}
            items={currentSubtopic.items}
            onMarkStudied={user ? () => markStudied(currentSubtopic.id) : undefined}
            isStudied={isStudied(currentSubtopic.id)}
          />
        )}
      </main>
    </div>
  )
}
