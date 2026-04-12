'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  getFlow,
  createFlow,
  updateFlow,
  loadFlowNodes,
  loadFlowEdges,
  saveFlowNode,
  saveFlowEdge,
  deleteFlowEdge,
  deleteFlowNode,
  updateNodePosition as persistNodePosition,
} from '../services/flow.service'
import type { VerbumFlow } from '../types/verbum.types'

// Fixed UUID for the Trinitas node — must be valid UUID for DB compatibility
export const TRINITAS_NODE_ID = '00000000-0000-4000-a000-000000000001'

// Initial Triquetra node at center
const INITIAL_NODES: Node[] = [
  {
    id: TRINITAS_NODE_ID,
    type: 'trinitas',
    position: { x: 0, y: 0 },
    data: {
      canonical_name: 'trindade',
      display_name: 'Santíssima Trindade',
      layer_id: 0,
      is_canonical: true,
    },
    draggable: false,
    selectable: true,
  },
]

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline'

export interface UseVerbumFlowReturn {
  // Auth
  user: ReturnType<typeof useAuth>['user']
  authLoading: boolean

  // Flow state
  currentFlow: VerbumFlow | null
  setCurrentFlow: React.Dispatch<React.SetStateAction<VerbumFlow | null>>
  flowName: string
  flowIdParam: string | null
  isReadOnly: boolean
  saveStatus: SaveStatus
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>
  canvasLoading: boolean
  canvasError: string | null
  setCanvasError: React.Dispatch<React.SetStateAction<string | null>>

  // React Flow state
  nodes: Node[]
  edges: Edge[]
  setNodes: ReturnType<typeof useNodesState>[1]
  setEdges: ReturnType<typeof useEdgesState>[1]
  handleNodesChange: (changes: NodeChange[]) => void
  handleEdgesChange: (changes: EdgeChange[]) => void

  // Refs for stale-closure-safe access
  nodesRef: React.MutableRefObject<Node[]>
  edgesRef: React.MutableRefObject<Edge[]>
  currentFlowRef: React.MutableRefObject<VerbumFlow | null>
  isLoadingRef: React.MutableRefObject<boolean>

  // Actions
  triggerSave: () => void
  retryInit: () => void

  // Service re-exports for convenience
  saveFlowNode: typeof saveFlowNode
  saveFlowEdge: typeof saveFlowEdge
  deleteFlowEdge: typeof deleteFlowEdge
  deleteFlowNode: typeof deleteFlowNode
  updateFlow: typeof updateFlow
}

export function useVerbumFlow(): UseVerbumFlowReturn {
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const flowIdParam = searchParams.get('flow')
  const [canvasLoading, setCanvasLoading] = useState(true)
  const [canvasError, setCanvasError] = useState<string | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Flow state
  const [currentFlow, setCurrentFlow] = useState<VerbumFlow | null>(null)
  const [flowName, setFlowName] = useState('Meu Fluxo')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('offline')
  const [isReadOnly, setIsReadOnly] = useState(false)

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const positionDebounceRef = useRef<Record<string, NodeJS.Timeout>>({})
  const isLoadingRef = useRef(false)
  const initDoneRef = useRef(false)

  // Refs to avoid stale closures — updated via useEffect (not during render)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const currentFlowRef = useRef(currentFlow)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])
  useEffect(() => { currentFlowRef.current = currentFlow }, [currentFlow])

  // ─── Reset init when flow ID changes (prevents loading loop) ───
  const prevFlowIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (flowIdParam !== prevFlowIdRef.current) {
      prevFlowIdRef.current = flowIdParam
      initDoneRef.current = false
    }
  }, [flowIdParam])

  // ─── Load or create flow on mount ───
  useEffect(() => {
    if (!user?.id || initDoneRef.current) return
    let cancelled = false

    async function initFlow() {
      isLoadingRef.current = true
      setCanvasLoading(true)
      setCanvasError(null)

      try {
        if (flowIdParam) {
          // Load existing flow
          const flow = await getFlow(flowIdParam)
          if (cancelled) return
          if (!flow) {
            setCanvasError('Fluxo não encontrado.')
            return
          }

          setCurrentFlow(flow)
          setFlowName(flow.name)
          setIsReadOnly(flow.user_id !== user!.id)

          // Load nodes and edges
          const [dbNodes, dbEdges] = await Promise.all([
            loadFlowNodes(flowIdParam),
            loadFlowEdges(flowIdParam),
          ])
          if (cancelled) return

          // Convert DB nodes to React Flow nodes (filter out Trinitas to avoid duplicate)
          const loadedNodes: Node[] = [
            ...INITIAL_NODES,
            ...dbNodes.filter((n: Record<string, unknown>) => n.id !== TRINITAS_NODE_ID).map((n: Record<string, unknown>) => ({
              id: n.id as string,
              type: n.node_type as string,
              position: { x: n.pos_x as number, y: n.pos_y as number },
              data: {
                title: n.title,
                title_latin: n.title_latin,
                description: n.description,
                layer_id: n.layer_id,
                bible_reference: n.bible_reference,
                bible_text: n.bible_text,
                bible_book: n.bible_book,
                testament: (n.bible_book as string)?.match(/^(Gn|Ex|Lv|Nm|Dt|Js|Jz|Rt|1Sm|2Sm|1Rs|2Rs|1Cr|2Cr|Esd|Ne|Tb|Jt|Est|1Mc|2Mc|Jó|Sl|Pr|Ecl|Ct|Sb|Eclo|Is|Jr|Lm|Br|Ez|Dn|Os|Jl|Am|Ab|Jn|Mq|Na|Hc|Sf|Ag|Zc|Ml)/) ? 'AT' : 'NT',
                is_canonical: n.is_canonical,
                canonical_entity_id: n.canonical_entity_id,
                ccc_paragraph: n.ccc_paragraph,
                ccc_text: n.ccc_text,
              },
            })),
          ]

          // Convert DB edges to React Flow edges
          const loadedEdges: Edge[] = dbEdges.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            source: e.source_node_id as string,
            target: e.target_node_id as string,
            type: e.relation_type as string,
            data: {
              relation_type: e.relation_type,
              status: e.status,
              magisterial_weight: e.magisterial_weight,
              theological_name: e.theological_name,
              explanation_short: e.ai_explanation_short,
              explanation_full: e.ai_explanation,
              sources: e.sources || [],
            },
          }))

          setNodes(loadedNodes)
          setEdges(loadedEdges)
          setSaveStatus('saved')
        } else {
          // Create a new flow
          const newFlow = await createFlow(user!.id, 'Meu Fluxo')
          if (cancelled || !newFlow) return

          setCurrentFlow(newFlow)
          setFlowName(newFlow.name)
          setSaveStatus('saved')
          // Update URL without triggering re-render — prevents re-initialization loop
          window.history.replaceState({}, '', `/verbum/canvas?flow=${newFlow.id}`)
        }
      } catch (err) {
        console.error('initFlow error:', err)
        if (!cancelled) {
          setCanvasError('Erro ao carregar o fluxo. Tente novamente.')
        }
      } finally {
        isLoadingRef.current = false
        initDoneRef.current = true
        if (!cancelled) setCanvasLoading(false)
      }
    }

    initFlow()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, flowIdParam])

  // ─── Auto-save debounced (stable — uses refs to avoid dependency cascades) ───
  const triggerSave = useCallback(() => {
    const flow = currentFlowRef.current
    if (!flow || !user?.id || isReadOnly || isLoadingRef.current) return
    setSaveStatus('unsaved')

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const userNodes = nodesRef.current.filter(n => n.id !== TRINITAS_NODE_ID)
        await updateFlow(flow.id, {
          node_count: userNodes.length,
          edge_count: edgesRef.current.length,
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 2000)
  }, [user?.id, isReadOnly])

  // ─── Persist node position + deletion on change ───
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)

      if (!currentFlowRef.current || !user?.id || isReadOnly) return

      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false && change.id !== TRINITAS_NODE_ID) {
          const nodeId = change.id
          const pos = change.position
          if (positionDebounceRef.current[nodeId]) {
            clearTimeout(positionDebounceRef.current[nodeId])
          }
          positionDebounceRef.current[nodeId] = setTimeout(() => {
            persistNodePosition(nodeId, pos.x, pos.y).catch(() => {})
            delete positionDebounceRef.current[nodeId]
          }, 500)
          triggerSave()
        }

        // Persist node deletions — edges cascade-deleted via FK ON DELETE CASCADE
        if (change.type === 'remove' && change.id !== TRINITAS_NODE_ID) {
          deleteFlowNode(change.id).catch(() => setSaveStatus('unsaved'))
          triggerSave()
        }
      }
    },
    [onNodesChange, user?.id, isReadOnly, triggerSave]
  )

  // ─── Persist edge deletions ───
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)

      if (!currentFlowRef.current || !user?.id || isReadOnly) return

      for (const change of changes) {
        if (change.type === 'remove') {
          deleteFlowEdge(change.id).catch(() => setSaveStatus('unsaved'))
        }
      }

      if (changes.some(c => c.type === 'remove')) {
        triggerSave()
      }
    },
    [onEdgesChange, user?.id, isReadOnly, triggerSave]
  )

  // ─── beforeunload warning ───
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  // ─── Cleanup all timers on unmount ───
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      Object.values(positionDebounceRef.current).forEach(clearTimeout)
      positionDebounceRef.current = {}
    }
  }, [])

  const retryInit = useCallback(() => {
    initDoneRef.current = false
    setCanvasError(null)
    setCanvasLoading(true)
  }, [])

  return {
    user,
    authLoading,
    currentFlow,
    setCurrentFlow,
    flowName,
    flowIdParam,
    isReadOnly,
    saveStatus,
    setSaveStatus,
    canvasLoading,
    canvasError,
    setCanvasError,
    nodes,
    edges,
    setNodes,
    setEdges,
    handleNodesChange,
    handleEdgesChange,
    nodesRef,
    edgesRef,
    currentFlowRef,
    isLoadingRef,
    triggerSave,
    retryInit,
    saveFlowNode,
    saveFlowEdge,
    deleteFlowEdge,
    deleteFlowNode,
    updateFlow,
  }
}
