'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, BookOpen, User, Church, Sparkles, ChevronRight } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import { SessionExpiredError } from '@/lib/supabase/query'
import { resolveIdentity, searchCanonicalEntities } from '../services/identity.service'
import {
  searchByText,
  searchByReference,
  searchByRange,
  isReferencePattern,
  isRangePattern,
} from '../services/bible.service'
import type {
  IdentityResult,
  BibleVerse,
  CanonicalEntity,
  ContextMenuAction,
} from '../types/verbum.types'

interface AddNodePanelProps {
  visible: boolean
  mode: Exclude<ContextMenuAction, 'postit'>
  onClose: () => void
  onAddNode: (payload: AddNodePayload) => void
}

export interface AddNodePayload {
  type: 'canonical' | 'figura' | 'versiculo' | 'dogma' | 'conceito' | 'encarnado'
  title: string
  titleLatin?: string
  description?: string
  bibleReference?: string
  bibleText?: string
  bibleBook?: string
  testament?: 'AT' | 'NT'
  canonicalEntity?: CanonicalEntity
  identityResult?: IdentityResult
  layerId: number
}

const MODE_CONFIG = {
  figura: { title: 'Personagem Bíblico', icon: User, placeholder: 'Ex: Abraão, Moisés, Pedro...' },
  versiculo: { title: 'Versículo', icon: BookOpen, placeholder: 'Ex: Mt 16:18, Isaías 22:22-25, "sobre esta pedra"...' },
  dogma: { title: 'Dogma / Conceito', icon: Church, placeholder: 'Ex: Imaculada Conceição, Transubstanciação...' },
  conceito: { title: 'Tradição', icon: Sparkles, placeholder: 'Ex: sacrifício, aliança, redenção...' },
}

export default function AddNodePanel({ visible, mode, onClose, onAddNode }: AddNodePanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [identityResult, setIdentityResult] = useState<IdentityResult | null>(null)
  const [showTrinityModal, setShowTrinityModal] = useState(false)
  const [trinityEntity, setTrinityEntity] = useState<CanonicalEntity | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const config = MODE_CONFIG[mode]

  useEffect(() => {
    if (visible) {
      setQuery('')
      setResults([])
      setIdentityResult(null)
      setShowTrinityModal(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // Abort any in-flight searches when panel closes
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
      setIsSearching(false)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [visible, mode])

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([])
        return
      }

      // Cancel previous in-flight search
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsSearching(true)

      // Global safety timeout — always clear isSearching after 12s
      const globalTimeout = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort()
          setIsSearching(false)
          setResults([{
            kind: 'manual' as const,
            title: q,
            subtitle: `Busca expirou. Criar "${q}" como novo nó`,
            data: null,
          }])
        }
      }, 12000)

      try {
        if (controller.signal.aborted) return
        const allResults: SearchResult[] = []

        // 1. Identity resolution (with 8s timeout + abort-aware)
        let identity: IdentityResult = { type: 'new', action: 'create_new', suggestions: {} }
        try {
          identity = await Promise.race([
            resolveIdentity(q),
            new Promise<IdentityResult>((_, reject) => {
              const t = setTimeout(() => reject(new Error('identity_timeout')), 8000)
              controller.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')) })
            }),
          ])
        } catch (err) {
          if (err instanceof SessionExpiredError) throw err
          // Identity resolution failed — continue with other searches
        }
        if (controller.signal.aborted) return
        setIdentityResult(identity)

        // If canonical, show special result
        if (identity.type === 'canonical' && identity.entity) {
          allResults.push({
            kind: 'canonical',
            title: identity.entity.display_name,
            subtitle: identity.entity.short_description || '',
            data: identity.entity,
          })
        }

        // 2. Canonical entity search — SAFE
        if (!controller.signal.aborted) {
          try {
            const canonicals = await searchCanonicalEntities(q)
            for (const c of canonicals) {
              if (!allResults.some((r) => r.kind === 'canonical' && (r.data as CanonicalEntity).id === c.id)) {
                allResults.push({
                  kind: 'canonical',
                  title: c.display_name,
                  subtitle: c.short_description || '',
                  data: c,
                })
              }
            }
          } catch (err) {
            if (err instanceof SessionExpiredError) throw err
            // Continue without canonical results
          }
        }

        // 3. Bible search — SAFE
        if (!controller.signal.aborted && (mode === 'versiculo' || mode === 'figura')) {
          try {
            if (isRangePattern(q)) {
              const verses = await searchByRange(q)
              if (verses.length > 0) {
                const firstVerse = verses[0]
                const lastVerse = verses[verses.length - 1]
                const combinedText = verses.map(v => `[${v.verse}] ${v.text_pt}`).join(' ')
                const rangeRef = `${firstVerse.book} ${firstVerse.chapter},${firstVerse.verse}-${lastVerse.verse}`

                allResults.push({
                  kind: 'verse_range',
                  title: rangeRef,
                  subtitle: combinedText.substring(0, 160) + (combinedText.length > 160 ? '...' : ''),
                  data: verses,
                })

                for (const v of verses) {
                  allResults.push({
                    kind: 'verse',
                    title: v.reference,
                    subtitle: v.text_pt.substring(0, 100) + (v.text_pt.length > 100 ? '...' : ''),
                    data: v,
                  })
                }
              }
            } else if (isReferencePattern(q)) {
              const verse = await searchByReference(q)
              if (verse) {
                allResults.push({
                  kind: 'verse',
                  title: verse.reference,
                  subtitle: verse.text_pt.substring(0, 100) + (verse.text_pt.length > 100 ? '...' : ''),
                  data: verse,
                })
              }
            } else {
              const verses = await searchByText(q, 6)
              for (const v of verses) {
                allResults.push({
                  kind: 'verse',
                  title: v.reference,
                  subtitle: v.text_pt.substring(0, 100) + (v.text_pt.length > 100 ? '...' : ''),
                  data: v,
                })
              }
            }
          } catch (err) {
            if (err instanceof SessionExpiredError) throw err
            // Continue without bible results
          }
        }

        // 4. Knowledge base results (from identity resolution)
        if (identity.suggestions?.knowledge) {
          for (const k of identity.suggestions.knowledge) {
            allResults.push({
              kind: 'knowledge',
              title: k.topic,
              subtitle: k.core_teaching?.substring(0, 100) + '...',
              data: k,
            })
          }
        }

        // If no results found, offer to create manually
        if (allResults.length === 0) {
          allResults.push({
            kind: 'manual',
            title: q,
            subtitle: `Criar "${q}" como novo nó`,
            data: null,
          })
        }

        if (!controller.signal.aborted) {
          setResults(allResults)
        }
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          setResults([{
            kind: 'manual',
            title: 'Sessão expirada',
            subtitle: 'Sua sessão expirou. Clique para recarregar a página.',
            data: { sessionExpired: true },
          }])
          return
        }
        // Catch-all for unexpected errors
        console.error('[AddNodePanel] doSearch error:', err)
        if (!controller.signal.aborted) {
          setResults([{
            kind: 'manual',
            title: q,
            subtitle: `Erro na busca. Criar "${q}" manualmente`,
            data: null,
          }])
        }
      } finally {
        clearTimeout(globalTimeout)
        // ALWAYS clear isSearching — prevents "Buscando..." stuck forever
        setIsSearching(false)
      }
    },
    [mode]
  )

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => doSearch(value), 500)
    },
    [doSearch]
  )

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.kind === 'canonical') {
        const entity = result.data as CanonicalEntity
        if (entity.is_trinitarian) {
          setTrinityEntity(entity)
          setShowTrinityModal(true)
          return
        }
        onAddNode({
          type: 'canonical',
          title: entity.display_name,
          titleLatin: entity.display_name_latin || undefined,
          description: entity.short_description || undefined,
          canonicalEntity: entity,
          layerId: entity.layer_default,
        })
        onClose()
        return
      }

      if (result.kind === 'verse_range') {
        // Add all verses in range as a single combined node
        const verses = result.data as BibleVerse[]
        const firstVerse = verses[0]
        const lastVerse = verses[verses.length - 1]
        const combinedText = verses.map(v => `[${v.verse}] ${v.text_pt}`).join(' ')
        const rangeRef = `${firstVerse.book} ${firstVerse.chapter},${firstVerse.verse}-${lastVerse.verse}`

        onAddNode({
          type: 'versiculo',
          title: rangeRef,
          bibleReference: rangeRef,
          bibleText: combinedText,
          bibleBook: firstVerse.book,
          testament: firstVerse.testament,
          layerId: firstVerse.testament === 'AT' ? 2 : 3,
        })
        onClose()
        return
      }

      if (result.kind === 'verse') {
        const verse = result.data as BibleVerse
        onAddNode({
          type: 'versiculo',
          title: verse.reference,
          bibleReference: verse.reference,
          bibleText: verse.text_pt,
          bibleBook: verse.book,
          testament: verse.testament,
          layerId: verse.testament === 'AT' ? 2 : 3,
        })
        onClose()
        return
      }

      if (result.kind === 'knowledge') {
        onAddNode({
          type: mode === 'dogma' ? 'dogma' : 'conceito',
          title: result.title,
          description: result.subtitle,
          layerId: 4,
        })
        onClose()
        return
      }

      // Session expired — reload
      if (result.data && typeof result.data === 'object' && 'sessionExpired' in (result.data as Record<string, unknown>)) {
        window.location.reload()
        return
      }

      // Manual creation
      const typeMap: Record<string, AddNodePayload['type']> = {
        figura: 'figura',
        versiculo: 'versiculo',
        dogma: 'dogma',
        conceito: 'conceito',
      }
      onAddNode({
        type: typeMap[mode] || 'conceito',
        title: result.title,
        layerId: 5,
      })
      onClose()
    },
    [mode, onAddNode, onClose]
  )

  const handleTrinityChoice = useCallback(
    (choice: 'encarnado' | 'highlight') => {
      if (choice === 'encarnado' && trinityEntity) {
        onAddNode({
          type: 'encarnado',
          title: 'Jesus Encarnado',
          titleLatin: 'Verbum Caro Factum',
          description: 'O Verbo se fez carne e habitou entre nós (Jo 1:14)',
          canonicalEntity: trinityEntity,
          layerId: 3,
        })
      }
      setShowTrinityModal(false)
      onClose()
    },
    [trinityEntity, onAddNode, onClose]
  )

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[301] rounded-2xl overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(500px, calc(100vw - 2rem))',
              maxHeight: '80vh',
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
            >
              <div className="flex items-center gap-2">
                <config.icon
                  className="w-4 h-4"
                  style={{ color: VERBUM_COLORS.ui_gold }}
                />
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    color: VERBUM_COLORS.text_primary,
                  }}
                >
                  {config.title}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg transition-colors"
                style={{ color: VERBUM_COLORS.text_muted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = VERBUM_COLORS.text_primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = VERBUM_COLORS.text_muted)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: VERBUM_COLORS.text_muted }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInput(e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${VERBUM_COLORS.ui_border}`,
                    color: VERBUM_COLORS.text_primary,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = VERBUM_COLORS.ui_gold)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = VERBUM_COLORS.ui_border)}
                />
              </div>
              {/* Search tips */}
              {mode === 'versiculo' && query.length === 0 && (
                <div
                  className="mt-2 text-[10px] leading-relaxed"
                  style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                >
                  Busca por referência (Mt 16:18), intervalo (Is 22:22-25), ou texto livre
                </div>
              )}
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 160px)' }}>
              {isSearching && (
                <div
                  className="px-5 py-4 text-sm text-center"
                  style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                >
                  Buscando...
                </div>
              )}

              {!isSearching && results.length === 0 && query.length > 0 && (
                <div
                  className="px-5 py-4 text-sm text-center"
                  style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                >
                  Nenhum resultado encontrado
                </div>
              )}

              {!isSearching && results.length === 0 && query.length === 0 && (
                <div
                  className="px-5 py-6 text-center"
                  style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}
                >
                  Digite para buscar na Bíblia, Catecismo e entidades canônicas
                </div>
              )}

              {results.map((result, idx) => (
                <button
                  key={`${result.kind}-${idx}`}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-5 py-3 flex items-start gap-3 transition-colors"
                  style={{ borderBottom: `1px solid rgba(58,42,16,0.3)` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ResultIcon kind={result.kind} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="text-sm font-medium truncate"
                        style={{
                          color: result.kind === 'canonical'
                            ? VERBUM_COLORS.ui_gold
                            : result.kind === 'verse_range'
                              ? VERBUM_COLORS.edge_profetica
                              : VERBUM_COLORS.text_primary,
                          fontFamily: result.kind === 'canonical' ? 'Cinzel, serif' : 'Poppins, sans-serif',
                        }}
                      >
                        {result.title}
                      </div>
                      {result.kind === 'verse_range' && (
                        <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: VERBUM_COLORS.text_muted }} />
                      )}
                    </div>
                    <div
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{
                        color: VERBUM_COLORS.text_secondary,
                        fontFamily: result.kind === 'verse' || result.kind === 'verse_range'
                          ? 'Cormorant Garamond, serif'
                          : 'Poppins, sans-serif',
                        fontStyle: result.kind === 'verse' || result.kind === 'verse_range' ? 'italic' : 'normal',
                      }}
                    >
                      {result.subtitle}
                    </div>
                    <ResultBadge kind={result.kind} data={result.data} />
                  </div>
                </button>
              ))}
            </div>

            {/* Trinity Modal */}
            <AnimatePresence>
              {showTrinityModal && trinityEntity && (
                <TrinityModal entity={trinityEntity} onChoice={handleTrinityChoice} />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Sub-components ───

interface SearchResult {
  kind: 'canonical' | 'verse' | 'verse_range' | 'knowledge' | 'manual'
  title: string
  subtitle: string
  data: unknown
}

function ResultIcon({ kind }: { kind: string }) {
  const style = { width: 16, height: 16, marginTop: 2 }
  switch (kind) {
    case 'canonical':
      return <Sparkles style={{ ...style, color: VERBUM_COLORS.ui_gold }} />
    case 'verse':
      return <BookOpen style={{ ...style, color: VERBUM_COLORS.edge_doutrina }} />
    case 'verse_range':
      return <BookOpen style={{ ...style, color: VERBUM_COLORS.edge_profetica }} />
    case 'knowledge':
      return <Church style={{ ...style, color: VERBUM_COLORS.node_dogma_border }} />
    default:
      return <User style={{ ...style, color: VERBUM_COLORS.text_muted }} />
  }
}

function ResultBadge({ kind, data }: { kind: string; data: unknown }) {
  if (kind === 'canonical') {
    const entity = data as CanonicalEntity
    return (
      <span
        className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded"
        style={{
          background: 'rgba(201,168,76,0.15)',
          color: VERBUM_COLORS.ui_gold,
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {entity.entity_type === 'pessoa_divina' ? 'Pessoa Divina' :
         entity.entity_type === 'maria' ? 'Maria Santíssima' :
         entity.entity_type === 'pessoa_biblica' ? 'Pessoa Bíblica' : entity.entity_type}
      </span>
    )
  }
  if (kind === 'verse') {
    const verse = data as BibleVerse
    return (
      <span
        className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded"
        style={{
          background: verse.testament === 'AT' ? 'rgba(212,170,74,0.12)' : 'rgba(154,176,200,0.12)',
          color: verse.testament === 'AT' ? VERBUM_COLORS.edge_tipologia : VERBUM_COLORS.edge_doutrina,
        }}
      >
        {verse.testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
      </span>
    )
  }
  if (kind === 'verse_range') {
    const verses = data as BibleVerse[]
    if (verses.length > 0) {
      return (
        <span
          className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(212,136,74,0.12)',
            color: VERBUM_COLORS.edge_profetica,
          }}
        >
          {verses.length} versículos · {verses[0].testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
        </span>
      )
    }
  }
  return null
}

function TrinityModal({
  entity,
  onChoice,
}: {
  entity: CanonicalEntity
  onChoice: (choice: 'encarnado' | 'highlight') => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
      style={{ background: 'rgba(10, 8, 6, 0.95)' }}
    >
      <div className="px-6 py-5 max-w-sm text-center">
        <div
          className="text-lg font-bold mb-1"
          style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold }}
        >
          {entity.display_name}
        </div>
        <div
          className="text-xs mb-4"
          style={{ color: VERBUM_COLORS.text_secondary, fontFamily: 'Poppins, sans-serif' }}
        >
          {entity.trinitarian_position === 'filho'
            ? 'É a Segunda Pessoa da Trindade, já presente na Triquetra.'
            : entity.trinitarian_position === 'pai'
              ? 'É a Primeira Pessoa da Trindade, já presente na Triquetra.'
              : 'É a Terceira Pessoa da Trindade, já presente na Triquetra.'}
        </div>

        <div
          className="text-sm mb-5"
          style={{ color: VERBUM_COLORS.text_primary, fontFamily: 'Poppins, sans-serif' }}
        >
          O que você quer inserir?
        </div>

        <div className="flex flex-col gap-2">
          {entity.trinitarian_position === 'filho' && (
            <button
              onClick={() => onChoice('encarnado')}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors text-left"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: `1px solid ${VERBUM_COLORS.ui_gold}`,
                color: VERBUM_COLORS.ui_gold,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <div className="font-semibold">Jesus Encarnado</div>
              <div className="text-xs opacity-70 mt-0.5">
                O Verbo que se fez carne (Jo 1:14)
              </div>
            </button>
          )}
          <button
            onClick={() => onChoice('highlight')}
            className="w-full py-3 px-4 rounded-xl text-sm transition-colors text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              color: VERBUM_COLORS.text_secondary,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <div className="font-medium">Apenas destacar</div>
            <div className="text-xs opacity-70 mt-0.5">
              Manter foco na Triquetra
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
