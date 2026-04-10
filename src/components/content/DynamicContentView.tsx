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
import ImmersiveReader from './ImmersiveReader'

// ─── Loading spinner ───
function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
    </div>
  )
}

// ─── Empty state ───
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>
        Conteúdo não disponível
      </p>
      <p className="text-sm" style={{ color: '#7A736870', fontFamily: 'Poppins, sans-serif' }}>
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

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* Back button */}
      {(selectedTopic || selectedSubtopic) && (
        <header className="relative z-10 w-full pt-8 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="theme-chip inline-flex items-center gap-2 !px-5 !py-2.5"
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
      <section className="page-header relative z-10">
        <h1>
          {currentSubtopic
            ? currentSubtopic.title
            : selectedTopic
              ? selectedTopic.title
              : group.title}
        </h1>
        {!currentSubtopic && (
          <p className="subtitle">
            {selectedTopic
              ? selectedTopic.description || `${subtopics.length} itens — toque para explorar`
              : group.description || group.subtitle || ''}
          </p>
        )}
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 flex-1 pb-16">
        {/* Level 1: Topic grid */}
        {!selectedTopic && !currentSubtopic && (
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {topics.map((topic, i) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {topic.sort_order > 0 && (
                  <span
                    className="text-xs tracking-[0.15em] uppercase block mb-3"
                    style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {topic.subtitle || `#${topic.sort_order}`}
                  </span>
                )}
                <h3
                  className="text-lg font-semibold leading-snug mb-2"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {topic.title}
                </h3>
                {topic.description && (
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
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
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {subtopics.map((sub, i) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubtopic(sub)}
                className="feature-card text-left fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {sub.subtitle && (
                  <span
                    className="text-xs tracking-[0.15em] uppercase block mb-3"
                    style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {sub.subtitle}
                  </span>
                )}
                <h3
                  className="text-lg font-semibold leading-snug mb-2"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {sub.title}
                </h3>
                {sub.description && (
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
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
          />
        )}
      </main>
    </div>
  )
}
