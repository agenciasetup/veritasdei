'use client'

import { useCallback, useEffect, useMemo, useState, useRef, lazy, Suspense } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, HelpCircle, Save, Cloud, CloudOff, Share2, Sparkles, BookOpen, Download } from 'lucide-react'

import { nodeTypes } from '../nodes/nodeTypes'
import { edgeTypes } from '../edges/edgeTypes'
import { VERBUM_COLORS } from '../design-tokens'
import CanvasBackground from './CanvasBackground'
import LayerControls from './LayerControls'
import ContextMenu from './ContextMenu'
import AddNodePanel, { type AddNodePayload } from '../panels/AddNodePanel'
import ConnectionTypeSelector from '../panels/ConnectionTypeSelector'
import EdgeDetailPanel from '../panels/EdgeDetailPanel'
import { getConnectionExplanation } from '../services/openai.service'
import { proposeConnections } from '../services/connection.service'
import { ProposalsBadge } from '../panels/ProposalsPanel'
import { useVerbumFlow, TRINITAS_NODE_ID } from '../hooks/useVerbumFlow'
import { VerbumCanvasProvider } from '../contexts/VerbumCanvasContext'
import SelectionToolbar from './SelectionToolbar'
import CanvasSearch from './CanvasSearch'
import ConnectionFilter from './ConnectionFilter'
const ProposalsPanel = lazy(() => import('../panels/ProposalsPanel'))
const ShareModal = lazy(() => import('../panels/ShareModal'))
const AISearchPanel = lazy(() => import('../panels/AISearchPanel'))
const ExportPanel = lazy(() => import('../panels/ExportPanel'))
import type {
  ConnectionProposal,
  ContextMenuAction,
  RelationType,
  VerbumSource,
  EdgeStatus,
} from '../types/verbum.types'

function VerbumCanvasInner() {
  const {
    user, authLoading,
    currentFlow, setCurrentFlow, flowName, flowIdParam,
    isReadOnly, saveStatus, setSaveStatus,
    canvasLoading, canvasError, setCanvasError,
    nodes, edges, setNodes, setEdges,
    handleNodesChange, handleEdgesChange,
    nodesRef, edgesRef, currentFlowRef, isLoadingRef,
    triggerSave, retryInit,
    saveFlowNode, saveFlowEdge, deleteFlowEdge, deleteFlowNode,
    updateFlow,
  } = useVerbumFlow()

  const router = useRouter()
  const { screenToFlowPosition } = useReactFlow()

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null)

  // AddNodePanel state
  const [addPanel, setAddPanel] = useState<{ visible: boolean; mode: Exclude<ContextMenuAction, 'postit'> }>({
    visible: false,
    mode: 'figura',
  })

  // Store the position where the user right-clicked (in flow coords)
  const insertPositionRef = useRef<{ x: number; y: number }>({ x: 200, y: 200 })

  // Connection type selector state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [connectionSelector, setConnectionSelector] = useState(false)
  const [showHelpTip, setShowHelpTip] = useState(false)

  // Edge detail panel state
  const [edgeDetail, setEdgeDetail] = useState<{
    visible: boolean
    edgeId: string | null
    data: {
      theologicalName: string
      sourceName: string
      targetName: string
      relationType: string
      explanation: string
      explanationShort: string
      sources: VerbumSource[]
      magisterialWeight: number
      status: EdgeStatus
    } | null
  }>({ visible: false, edgeId: null, data: null })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isProposing, setIsProposing] = useState(false)
  const [proposals, setProposals] = useState<ConnectionProposal[]>([])
  const [proposalsVisible, setProposalsVisible] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [searchPanelVisible, setSearchPanelVisible] = useState(false)
  const [exportPanelVisible, setExportPanelVisible] = useState(false)
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null)
  const [connectionFilterEntities, setConnectionFilterEntities] = useState<string[]>([])
  const [connectionFilterRelation, setConnectionFilterRelation] = useState<string | null>(null)

  const addingNodeRef = useRef(false)
  const longPressRef = useRef<NodeJS.Timeout | null>(null)
  const proposalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const proposalAbortRef = useRef<AbortController | null>(null)

  // ─── Cleanup proposal/longpress timers on unmount ───
  useEffect(() => {
    return () => {
      if (proposalTimerRef.current) clearTimeout(proposalTimerRef.current)
      if (longPressRef.current) clearTimeout(longPressRef.current)
      proposalAbortRef.current?.abort()
    }
  }, [])

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target && !isReadOnly) {
        setPendingConnection(connection)
        setConnectionSelector(true)
      }
    },
    [isReadOnly]
  )

  const onConnectionTypeSelect = useCallback(
    async (relationType: RelationType) => {
      if (!pendingConnection?.source || !pendingConnection?.target) return

      setConnectionSelector(false)

      const sourceNode = nodes.find((n) => n.id === pendingConnection.source)
      const targetNode = nodes.find((n) => n.id === pendingConnection.target)
      if (!sourceNode || !targetNode) return

      const sourceName = (sourceNode.data as Record<string, unknown>).title as string ||
        (sourceNode.data as Record<string, unknown>).display_name as string || sourceNode.id
      const targetName = (targetNode.data as Record<string, unknown>).title as string ||
        (targetNode.data as Record<string, unknown>).display_name as string || targetNode.id

      const edgeId = crypto.randomUUID()
      const newEdge: Edge = {
        id: edgeId,
        source: pendingConnection.source,
        target: pendingConnection.target,
        type: 'proposta',
        data: {
          relation_type: relationType,
          status: 'proposta' as EdgeStatus,
          magisterial_weight: 3,
          theological_name: 'Gerando explicação...',
          explanation_short: '',
          explanation_full: '',
          sources: [],
          source_name: sourceName,
          target_name: targetName,
        },
        animated: true,
      }

      setEdges((eds) => [...eds, newEdge])
      setPendingConnection(null)

      // Persist edge
      if (currentFlow && user?.id) {
        saveFlowEdge(currentFlow.id, user.id, {
          id: edgeId,
          source_node_id: pendingConnection.source,
          target_node_id: pendingConnection.target,
          relation_type: relationType,
          status: 'proposta',
        }).catch(() => setSaveStatus('unsaved'))
      }

      setIsGenerating(true)
      try {
        const explanation = await getConnectionExplanation({
          sourceTitle: sourceName,
          sourceType: sourceNode.type || 'unknown',
          sourceRef: (sourceNode.data as Record<string, unknown>).bible_reference as string,
          sourceDesc: (sourceNode.data as Record<string, unknown>).description as string,
          targetTitle: targetName,
          targetType: targetNode.type || 'unknown',
          targetRef: (targetNode.data as Record<string, unknown>).bible_reference as string,
          targetDesc: (targetNode.data as Record<string, unknown>).description as string,
          relationType,
        })

        if (explanation) {
          setEdges((eds) =>
            eds.map((e) =>
              e.id === edgeId
                ? {
                    ...e,
                    type: relationType,
                    data: {
                      ...e.data,
                      theological_name: explanation.theological_name,
                      explanation_short: explanation.explanation_short,
                      explanation_full: explanation.explanation_full,
                      sources: explanation.sources,
                      magisterial_weight: explanation.magisterial_weight,
                    },
                  }
                : e
            )
          )

          // Update persisted edge with explanation
          if (currentFlow && user?.id) {
            saveFlowEdge(currentFlow.id, user.id, {
              id: edgeId,
              source_node_id: pendingConnection.source,
              target_node_id: pendingConnection.target,
              relation_type: relationType,
              theological_name: explanation.theological_name,
              ai_explanation_short: explanation.explanation_short,
              ai_explanation: explanation.explanation_full,
              sources: explanation.sources,
              magisterial_weight: explanation.magisterial_weight,
            }).catch(() => setSaveStatus('unsaved'))
          }
        } else {
          setEdges((eds) =>
            eds.map((e) =>
              e.id === edgeId
                ? {
                    ...e,
                    type: relationType,
                    data: {
                      ...e.data,
                      theological_name: `Conexão: ${sourceName} → ${targetName}`,
                      explanation_short: 'Explicação não disponível',
                    },
                  }
                : e
            )
          )
        }
      } finally {
        setIsGenerating(false)
        triggerSave()
      }
    },
    [pendingConnection, nodes, setEdges, currentFlow, user?.id, triggerSave]
  )

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const data = edge.data as Record<string, unknown> | undefined
      if (!data) return

      setEdgeDetail({
        visible: true,
        edgeId: edge.id,
        data: {
          theologicalName: (data.theological_name as string) || 'Conexão',
          sourceName: (data.source_name as string) || edge.source,
          targetName: (data.target_name as string) || edge.target,
          relationType: (data.relation_type as string) || 'doutrina',
          explanation: (data.explanation_full as string) || '',
          explanationShort: (data.explanation_short as string) || '',
          sources: (data.sources as VerbumSource[]) || [],
          magisterialWeight: (data.magisterial_weight as number) || 3,
          status: (data.status as EdgeStatus) || 'proposta',
        },
      })
    },
    []
  )

  const onApproveEdge = useCallback(() => {
    if (!edgeDetail.edgeId) return
    const approvedEdgeId = edgeDetail.edgeId
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== approvedEdgeId) return e
        const eData = e.data as Record<string, unknown> | undefined

        // Persist approval to DB
        if (currentFlow && user?.id) {
          saveFlowEdge(currentFlow.id, user.id, {
            id: approvedEdgeId,
            source_node_id: e.source,
            target_node_id: e.target,
            relation_type: (eData?.relation_type as string) || 'doutrina',
            theological_name: eData?.theological_name as string | null,
            ai_explanation_short: eData?.explanation_short as string | null,
            ai_explanation: eData?.explanation_full as string | null,
            sources: eData?.sources as unknown[] | undefined,
            magisterial_weight: eData?.magisterial_weight as number | undefined,
            status: 'aprovada',
          }).catch(() => setSaveStatus('unsaved'))
        }

        return {
          ...e,
          type: (eData?.relation_type as string) || e.type,
          animated: false,
          data: { ...e.data, status: 'aprovada' },
        }
      })
    )
    setEdgeDetail((s) => ({
      ...s,
      data: s.data ? { ...s.data, status: 'aprovada' } : null,
    }))
    triggerSave()
  }, [edgeDetail.edgeId, setEdges, triggerSave, currentFlow, user?.id])

  const onRejectEdge = useCallback(() => {
    if (!edgeDetail.edgeId) return
    // Delete from DB
    deleteFlowEdge(edgeDetail.edgeId)
    setEdges((eds) => eds.filter((e) => e.id !== edgeDetail.edgeId))
    setEdgeDetail({ visible: false, edgeId: null, data: null })
    triggerSave()
  }, [edgeDetail.edgeId, setEdges, triggerSave])

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      if (isReadOnly) return
      event.preventDefault()
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      insertPositionRef.current = flowPos
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
      })
    },
    [screenToFlowPosition, isReadOnly]
  )

  // ─── Debounced AI proposal scheduling (outside render cycle) ───
  const scheduleProposalCheck = useCallback((newNode: { id: string; title: string; type: string; ref?: string }) => {
    // Cancel any pending proposal check
    if (proposalTimerRef.current) clearTimeout(proposalTimerRef.current)
    proposalAbortRef.current?.abort()

    // Debounce: wait 1.5s after last node add before calling AI
    proposalTimerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      proposalAbortRef.current = controller
      setIsProposing(true)

      try {
        const currentNodes = nodesRef.current
        const existingSimpleNodes = currentNodes
          .filter((n) => n.id !== newNode.id)
          .map((n) => ({
            id: n.id,
            title: ((n.data as Record<string, unknown>)?.title as string) ||
                   ((n.data as Record<string, unknown>)?.display_name as string) || n.id,
            type: n.type || 'unknown',
            ref: (n.data as Record<string, unknown>)?.bible_reference as string | undefined,
          }))

        if (controller.signal.aborted) return

        const newProposals = await proposeConnections(newNode, existingSimpleNodes)

        if (!controller.signal.aborted && newProposals.length > 0) {
          setProposals((prev) => [...prev, ...newProposals])
        }
      } catch (err) {
        if (!(err instanceof DOMException && (err as DOMException).name === 'AbortError')) {
          console.error('[Verbum] proposeConnections failed:', err)
        }
      } finally {
        setIsProposing(false)
      }
    }, 1500)
  }, [])

  // ─── Analyze existing node via AI (triggered by Sparkles button on nodes) ───
  const onAnalyzeNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node) return

    const nodeData = node.data as Record<string, unknown>
    scheduleProposalCheck({
      id: node.id,
      title: (nodeData.title as string) || (nodeData.display_name as string) || node.id,
      type: node.type || 'unknown',
      ref: (nodeData.bible_reference as string) || undefined,
    })
  }, [scheduleProposalCheck])

  // ─── Update node data (used by PostItNode for inline editing) ───
  const onUpdateNodeData = useCallback((nodeId: string, updates: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
      )
    )

    // Persist to DB
    if (currentFlow && user?.id) {
      const node = nodesRef.current.find((n) => n.id === nodeId)
      if (node) {
        const merged = { ...node.data, ...updates } as Record<string, unknown>
        saveFlowNode(currentFlow.id, user.id, {
          id: nodeId,
          node_type: node.type || 'postit',
          title: (merged.title as string) || '',
          title_latin: (merged.color as string) || null, // post-it color stored in title_latin
          description: (merged.body as string) || (merged.description as string) || null,
          layer_id: (merged.layer_id as number) || 5,
          pos_x: node.position.x,
          pos_y: node.position.y,
        }).catch(() => setSaveStatus('unsaved'))
      }
    }
    triggerSave()
  }, [setNodes, currentFlow, user?.id, triggerSave])

  const canvasContextValue = useMemo(() => ({
    onAnalyzeNode,
    onUpdateNodeData,
    isReadOnly,
  }), [onAnalyzeNode, onUpdateNodeData, isReadOnly])

  // ─── Create a post-it directly (no AddNodePanel needed) ───
  const createPostIt = useCallback(() => {
    if (addingNodeRef.current) return
    addingNodeRef.current = true
    setTimeout(() => { addingNodeRef.current = false }, 500)

    const newId = crypto.randomUUID()
    const pos = insertPositionRef.current
    const data = {
      title: 'Nova Nota',
      body: '',
      color: 'amber',
      layer_id: 5,
    }

    const newNode = {
      id: newId,
      type: 'postit' as const,
      position: pos,
      data,
    }

    setNodes((nds) => [...nds, newNode])

    if (currentFlow && user?.id) {
      saveFlowNode(currentFlow.id, user.id, {
        id: newId,
        node_type: 'postit',
        title: data.title,
        title_latin: data.color,
        description: null,
        layer_id: 5,
        pos_x: pos.x,
        pos_y: pos.y,
      }).catch(() => setSaveStatus('unsaved'))
    }
    triggerSave()
  }, [setNodes, currentFlow, user?.id, triggerSave])

  // ─── Add a verse from the AI search panel ───
  const onAddVerseFromSearch = useCallback((reference: string, text: string) => {
    const newId = crypto.randomUUID()
    // Detect testament from book abbreviation
    const atBooks = /^(Gn|Ex|Lv|Nm|Dt|Js|Jz|Rt|1Sm|2Sm|1Rs|2Rs|1Cr|2Cr|Esd|Ne|Tb|Jt|Est|1Mc|2Mc|Jó|Sl|Pr|Ecl|Ct|Sb|Eclo|Is|Jr|Lm|Br|Ez|Dn|Os|Jl|Am|Ab|Jn|Mq|Na|Hc|Sf|Ag|Zc|Ml)/
    const testament = atBooks.test(reference) ? 'AT' : 'NT'
    const book = reference.split(/\s/)[0] || ''

    // Place new verse near center with offset to avoid overlap
    const nodeCount = nodesRef.current.length
    const pos = { x: 300 + (nodeCount % 5) * 50, y: 200 + Math.floor(nodeCount / 5) * 80 }

    const data = {
      title: reference,
      bible_reference: reference,
      bible_text: text,
      bible_book: book,
      testament,
      layer_id: testament === 'AT' ? 2 : 3,
    }

    setNodes((nds) => [...nds, { id: newId, type: 'versiculo', position: pos, data }])

    if (currentFlow && user?.id) {
      saveFlowNode(currentFlow.id, user.id, {
        id: newId,
        node_type: 'versiculo',
        title: reference,
        bible_reference: reference,
        bible_text: text,
        bible_book: book,
        layer_id: data.layer_id,
        pos_x: pos.x,
        pos_y: pos.y,
      }).catch(() => setSaveStatus('unsaved'))
    }

    // Schedule AI connection proposals for the new verse
    scheduleProposalCheck({
      id: newId,
      title: reference,
      type: 'versiculo',
      ref: reference,
    })

    triggerSave()
  }, [setNodes, currentFlow, user?.id, triggerSave, scheduleProposalCheck])

  // ─── Multi-select helpers ───
  const selectedNodes = useMemo(
    () => nodes.filter((n) => n.selected && n.id !== TRINITAS_NODE_ID),
    [nodes]
  )

  const onAlignHorizontal = useCallback(() => {
    if (selectedNodes.length < 2) return
    const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length
    const ids = new Set(selectedNodes.map((n) => n.id))
    setNodes((nds) =>
      nds.map((n) => (ids.has(n.id) ? { ...n, position: { ...n.position, y: avgY } } : n))
    )
    triggerSave()
  }, [selectedNodes, setNodes, triggerSave])

  const onAlignVertical = useCallback(() => {
    if (selectedNodes.length < 2) return
    const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length
    const ids = new Set(selectedNodes.map((n) => n.id))
    setNodes((nds) =>
      nds.map((n) => (ids.has(n.id) ? { ...n, position: { ...n.position, x: avgX } } : n))
    )
    triggerSave()
  }, [selectedNodes, setNodes, triggerSave])

  const onDistribute = useCallback(() => {
    if (selectedNodes.length < 3) return
    const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x)
    const minX = sorted[0].position.x
    const maxX = sorted[sorted.length - 1].position.x
    const step = (maxX - minX) / (sorted.length - 1)
    const posMap = new Map(sorted.map((n, i) => [n.id, minX + i * step]))
    setNodes((nds) =>
      nds.map((n) => (posMap.has(n.id) ? { ...n, position: { ...n.position, x: posMap.get(n.id)! } } : n))
    )
    triggerSave()
  }, [selectedNodes, setNodes, triggerSave])

  const onDeleteSelected = useCallback(() => {
    const ids = selectedNodes.map((n) => n.id)
    setNodes((nds) => nds.filter((n) => !ids.includes(n.id)))
    setEdges((eds) => eds.filter((e) => !ids.includes(e.source) && !ids.includes(e.target)))
    for (const id of ids) {
      deleteFlowNode(id).catch(() => setSaveStatus('unsaved'))
    }
    triggerSave()
  }, [selectedNodes, setNodes, setEdges, triggerSave])

  const onAnalyzeSelected = useCallback(() => {
    // Analyze the first selected node, proposals will include connections to all others
    const first = selectedNodes[0]
    if (!first) return
    const nodeData = first.data as Record<string, unknown>
    scheduleProposalCheck({
      id: first.id,
      title: (nodeData.title as string) || (nodeData.display_name as string) || first.id,
      type: first.type || 'unknown',
      ref: (nodeData.bible_reference as string) || undefined,
    })
  }, [selectedNodes, scheduleProposalCheck])

  const onContextMenuSelect = useCallback((action: ContextMenuAction) => {
    if (action === 'postit') {
      createPostIt()
      return
    }
    setAddPanel({ visible: true, mode: action })
  }, [createPostIt])

  const onAddNode = useCallback(
    (payload: AddNodePayload) => {
      // Prevent double-click creating duplicate nodes
      if (addingNodeRef.current) return
      addingNodeRef.current = true
      setTimeout(() => { addingNodeRef.current = false }, 500)

      const newId = crypto.randomUUID()
      const pos = insertPositionRef.current

      let nodeType: string
      let data: Record<string, unknown>

      switch (payload.type) {
        case 'canonical':
          nodeType = 'figura'
          data = {
            title: payload.title,
            title_latin: payload.titleLatin,
            description: payload.description,
            layer_id: payload.layerId,
            historical_period: payload.canonicalEntity?.historical_period,
            bible_key_verse: payload.canonicalEntity?.bible_key_verse,
            is_canonical: true,
            canonical_entity_id: payload.canonicalEntity?.id,
            visual_tier: payload.canonicalEntity?.visual_tier || 2,
          }
          break

        case 'encarnado':
          nodeType = 'encarnado'
          pos.x = 200
          pos.y = 150
          data = {
            title: payload.title,
            description: payload.description,
            layer_id: payload.layerId,
            bible_reference: 'Jo 1:14',
          }
          break

        case 'versiculo':
          nodeType = 'versiculo'
          data = {
            title: payload.title,
            bible_reference: payload.bibleReference,
            bible_text: payload.bibleText,
            bible_book: payload.bibleBook,
            testament: payload.testament || 'NT',
            layer_id: payload.layerId,
          }
          break

        case 'dogma':
          nodeType = 'dogma'
          data = {
            title: payload.title,
            title_latin: payload.titleLatin,
            description: payload.description,
            layer_id: payload.layerId,
            is_canonical: false,
          }
          break

        default:
          nodeType = 'figura'
          data = {
            title: payload.title,
            description: payload.description,
            layer_id: payload.layerId,
            is_canonical: false,
          }
      }

      const newNode: Node = {
        id: newId,
        type: nodeType,
        position: pos,
        data,
      }

      // Persist to DB
      if (currentFlow && user?.id) {
        saveFlowNode(currentFlow.id, user.id, {
          id: newId,
          node_type: nodeType,
          title: (data.title as string) || payload.title,
          title_latin: data.title_latin as string | null,
          description: data.description as string | null,
          bible_reference: data.bible_reference as string | null,
          bible_text: data.bible_text as string | null,
          bible_book: data.bible_book as string | null,
          layer_id: (data.layer_id as number) || payload.layerId,
          pos_x: pos.x,
          pos_y: pos.y,
          is_canonical: (data.is_canonical as boolean) || false,
          canonical_entity_id: data.canonical_entity_id as string | null,
        }).catch(() => setSaveStatus('unsaved'))
      }

      // Clean state update — no side effects inside setNodes
      setNodes((nds) => [...nds, newNode])

      // Schedule AI proposal check OUTSIDE the render cycle (debounced)
      scheduleProposalCheck({
        id: newId,
        title: (data.title as string) || payload.title,
        type: nodeType,
        ref: (data.bible_reference as string) || undefined,
      })

      triggerSave()
    },
    [setNodes, currentFlow, user?.id, triggerSave]
  )

  const onApproveProposal = useCallback(
    (proposal: ConnectionProposal) => {
      const edgeId = crypto.randomUUID()
      const sourceId = proposal.source_node_id
      const sourceNode = nodes.find((n) => n.id === sourceId)

      const newEdge: Edge = {
        id: edgeId,
        source: sourceId,
        target: proposal.target_node_id,
        type: proposal.relation_type,
        data: {
          relation_type: proposal.relation_type,
          status: 'aprovada' as EdgeStatus,
          magisterial_weight: proposal.magisterial_weight,
          theological_name: proposal.theological_name,
          explanation_short: proposal.explanation_short,
          explanation_full: proposal.explanation_full,
          sources: proposal.sources,
          source_name: proposal.source_node_title,
          target_name: proposal.target_node_title,
        },
      }

      setEdges((eds) => [...eds, newEdge])
      setProposals((prev) => prev.filter((p) => p !== proposal))

      // Persist
      if (currentFlow && user?.id) {
        saveFlowEdge(currentFlow.id, user.id, {
          id: edgeId,
          source_node_id: sourceId,
          target_node_id: proposal.target_node_id,
          relation_type: proposal.relation_type,
          magisterial_weight: proposal.magisterial_weight,
          theological_name: proposal.theological_name,
          ai_explanation_short: proposal.explanation_short,
          ai_explanation: proposal.explanation_full,
          sources: proposal.sources,
          status: 'aprovada',
        }).catch(() => setSaveStatus('unsaved'))
      }
      triggerSave()
    },
    [nodes, setEdges, currentFlow, user?.id, triggerSave]
  )

  const onRejectProposal = useCallback(
    (proposal: ConnectionProposal) => {
      setProposals((prev) => prev.filter((p) => p !== proposal))
    },
    []
  )

  const onToggleLayer = useCallback((layerId: number) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId) ? prev.filter((l) => l !== layerId) : [...prev, layerId]
    )
  }, [])

  const onConnectionFilterChange = useCallback((entities: string[], relation: string | null) => {
    setConnectionFilterEntities(entities)
    setConnectionFilterRelation(relation)
  }, [])

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.altKey) {
        setFocusNodeId((prev) => (prev === node.id ? null : node.id))
      }
    },
    []
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusNodeId(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const layerId = (node.data as Record<string, unknown>)?.layer_id as number ?? 0
      const isLayerVisible = visibleLayers.includes(layerId)

      let isFocused = true
      if (focusNodeId) {
        const connectedNodeIds = new Set<string>()
        connectedNodeIds.add(focusNodeId)
        edges.forEach((e) => {
          if (e.source === focusNodeId) connectedNodeIds.add(e.target)
          if (e.target === focusNodeId) connectedNodeIds.add(e.source)
        })
        isFocused = connectedNodeIds.has(node.id)
      }

      const isHighlighted = highlightNodeId === node.id

      return {
        ...node,
        hidden: !isLayerVisible,
        style: {
          ...node.style,
          opacity: isFocused ? 1 : 0.15,
          transition: 'opacity 0.3s ease',
          ...(isHighlighted ? { boxShadow: `0 0 20px ${VERBUM_COLORS.ui_gold}`, borderRadius: '12px' } : {}),
        },
      }
    })
  }, [nodes, visibleLayers, focusNodeId, edges, highlightNodeId])

  const filteredEdges = useMemo(() => {
    const hiddenNodeIds = new Set(
      nodes
        .filter((n) => {
          const layerId = (n.data as Record<string, unknown>)?.layer_id as number ?? 0
          return !visibleLayers.includes(layerId)
        })
        .map((n) => n.id)
    )

    const hasEntityFilter = connectionFilterEntities.length > 0
    const entitySet = new Set(connectionFilterEntities)

    return edges.map((edge) => {
      const sourceHidden = hiddenNodeIds.has(edge.source)
      const targetHidden = hiddenNodeIds.has(edge.target)

      let isFocused = true
      if (focusNodeId) {
        isFocused = edge.source === focusNodeId || edge.target === focusNodeId
      }

      // Connection filter: hide edges not involving selected entities
      let isFiltered = false
      if (hasEntityFilter) {
        isFiltered = !entitySet.has(edge.source) && !entitySet.has(edge.target)
      }
      if (connectionFilterRelation) {
        const edgeData = edge.data as Record<string, unknown> | undefined
        const rel = (edgeData?.relation_type as string) || edge.type || ''
        if (rel !== connectionFilterRelation) isFiltered = true
      }

      if (sourceHidden && targetHidden) {
        return { ...edge, hidden: true }
      }
      if (isFiltered) {
        return { ...edge, style: { ...edge.style, opacity: 0.05, transition: 'opacity 0.3s ease' } }
      }
      if (sourceHidden || targetHidden) {
        return {
          ...edge,
          style: { ...edge.style, strokeDasharray: '4 4', opacity: isFocused ? 0.4 : 0.1 },
        }
      }
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isFocused ? 1 : 0.1,
          transition: 'opacity 0.3s ease',
        },
      }
    })
  }, [edges, nodes, visibleLayers, focusNodeId, connectionFilterEntities, connectionFilterRelation])

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), [])

  // Save status indicator
  const SaveIcon = saveStatus === 'saved' ? Cloud : saveStatus === 'saving' ? Save : saveStatus === 'unsaved' ? CloudOff : CloudOff
  const saveLabel = saveStatus === 'saved' ? 'Salvo' : saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'unsaved' ? 'Não salvo' : ''

  // ─── Redirect unauthenticated users ───
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  // ─── Loading & Error states ───
  if (authLoading || !user || (canvasLoading && !currentFlow)) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: VERBUM_COLORS.canvas_bg }}>
        <CanvasBackground />
        <div className="z-10 text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
          />
          <div
            className="text-xs tracking-widest uppercase mt-3"
            style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.text_muted }}
          >
            {authLoading ? 'Autenticando...' : !user ? 'Redirecionando...' : 'Carregando mapa...'}
          </div>
        </div>
      </div>
    )
  }

  if (canvasError) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: VERBUM_COLORS.canvas_bg }}>
        <CanvasBackground />
        <div className="z-10 text-center">
          <div className="text-sm mb-2" style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold }}>
            Verbum
          </div>
          <div className="text-xs mb-4" style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}>
            {canvasError}
          </div>
          <button
            onClick={retryInit}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid #C9A84C',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-full"
      style={{ background: VERBUM_COLORS.canvas_bg }}
      onTouchStart={(e) => {
        if (isReadOnly || e.touches.length !== 1) return
        const touch = e.touches[0]
        const tx = touch.clientX
        const ty = touch.clientY
        longPressRef.current = setTimeout(() => {
          const flowPos = screenToFlowPosition({ x: tx, y: ty })
          insertPositionRef.current = flowPos
          setContextMenu({ x: tx, y: ty, flowX: flowPos.x, flowY: flowPos.y })
        }, 500)
      }}
      onTouchEnd={() => {
        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
      }}
      onTouchMove={() => {
        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
      }}
    >
      <CanvasBackground />

      <VerbumCanvasProvider value={canvasContextValue}>
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneContextMenu={onPaneContextMenu}
          onPaneClick={() => focusNodeId && setFocusNodeId(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={defaultViewport}
          fitView
          fitViewOptions={{ padding: 0.5, maxZoom: 1.2 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="verbum-flow"
          style={{ background: 'transparent' }}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={!isReadOnly}
          deleteKeyCode={isReadOnly ? null : ['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          selectionOnDrag={!isReadOnly}
          panOnDrag={isReadOnly ? true : [1, 2]}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={50}
            size={1}
            color="rgba(201, 168, 76, 0.04)"
          />
          <MiniMap
            position="bottom-left"
            nodeStrokeColor={VERBUM_COLORS.node_canonical_border}
            nodeColor={VERBUM_COLORS.node_canonical_bg}
            maskColor="rgba(10, 8, 6, 0.85)"
            style={{
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              borderRadius: '8px',
              marginBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            pannable
            zoomable
          />
          <Controls
            position="bottom-right"
            showInteractive={false}
            style={{
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              borderRadius: '8px',
              marginBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          />
        </ReactFlow>
      </VerbumCanvasProvider>

      {/* Top toolbar */}
      <div
        className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,8,6,0.95) 0%, rgba(10,8,6,0.7) 80%, transparent 100%)',
          paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
          pointerEvents: 'none',
        }}
      >
        <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
          <Link
            href="/verbum"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              color: VERBUM_COLORS.text_secondary,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Verbum
          </Link>
          <span
            className="text-xs font-semibold truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]"
            style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold, letterSpacing: '0.06em' }}
          >
            {flowName}
          </span>
          {isReadOnly && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(154,176,200,0.15)', color: VERBUM_COLORS.edge_doutrina }}
            >
              Somente leitura
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
          {/* Proposing indicator */}
          {isProposing && (
            <div className="flex items-center gap-1 text-[10px]" style={{ color: VERBUM_COLORS.edge_proposta, fontFamily: 'Poppins, sans-serif' }}>
              <Sparkles className="w-3 h-3 animate-pulse" />
              Analisando...
            </div>
          )}

          {/* Save status */}
          {currentFlow && saveStatus !== 'offline' && (
            <div className="flex items-center gap-1 text-[10px]" style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}>
              <SaveIcon className="w-3 h-3" />
              {saveLabel}
            </div>
          )}

          {/* Share button */}
          {currentFlow && !isReadOnly && (
            <button
              onClick={() => setShareModalVisible(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${VERBUM_COLORS.ui_border}`,
                color: VERBUM_COLORS.text_secondary,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* AI Search button */}
          <button
            onClick={() => setSearchPanelVisible(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              color: VERBUM_COLORS.text_secondary,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          {/* Connection filter */}
          <ConnectionFilter
            nodes={nodes}
            edges={edges}
            filterEntities={connectionFilterEntities}
            filterRelation={connectionFilterRelation}
            onFilterChange={onConnectionFilterChange}
          />

          {/* Export button */}
          <button
            onClick={() => setExportPanelVisible(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              color: VERBUM_COLORS.text_secondary,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Quick add button */}
          {!isReadOnly && (
            <button
              onClick={() => {
                insertPositionRef.current = { x: 300, y: 200 }
                setAddPanel({ visible: true, mode: 'figura' })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: `1px solid rgba(201,168,76,0.3)`,
                color: VERBUM_COLORS.ui_gold,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Inserir
            </button>
          )}

          {/* Help hint — click toggle for touch, hover for desktop */}
          <div className="relative group">
            <button
              className="p-1.5 rounded-lg"
              style={{ color: VERBUM_COLORS.text_muted }}
              onClick={() => setShowHelpTip((v) => !v)}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div
              className={`absolute right-0 top-full mt-2 w-56 rounded-xl p-4 transition-opacity duration-200 ${showHelpTip ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}
              style={{
                background: VERBUM_COLORS.ui_bg,
                border: `1px solid ${VERBUM_COLORS.ui_border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-[11px] space-y-2" style={{ color: VERBUM_COLORS.text_secondary, fontFamily: 'Poppins, sans-serif' }}>
                <div><strong style={{ color: VERBUM_COLORS.ui_gold }}>Clique direito</strong> — inserir nó</div>
                <div><strong style={{ color: VERBUM_COLORS.ui_gold }}>Arrastar handle</strong> — criar conexão</div>
                <div><strong style={{ color: VERBUM_COLORS.ui_gold }}>Alt + clique</strong> — modo foco</div>
                <div><strong style={{ color: VERBUM_COLORS.ui_gold }}>Clique na aresta</strong> — ver detalhes</div>
                <div><strong style={{ color: VERBUM_COLORS.ui_gold }}>ESC</strong> — sair do foco</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LayerControls visibleLayers={visibleLayers} onToggleLayer={onToggleLayer} />

      <SelectionToolbar
        selectedNodes={selectedNodes}
        onAlignHorizontal={onAlignHorizontal}
        onAlignVertical={onAlignVertical}
        onDistribute={onDistribute}
        onDeleteSelected={onDeleteSelected}
        onAnalyzeSelected={onAnalyzeSelected}
      />

      {focusNodeId && (
        <div
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-lg text-xs"
          style={{
            background: VERBUM_COLORS.ui_bg,
            border: `1px solid ${VERBUM_COLORS.ui_gold}`,
            color: VERBUM_COLORS.ui_gold,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Modo Foco ativo — ESC para sair
        </div>
      )}

      <ContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        visible={contextMenu !== null}
        onSelect={onContextMenuSelect}
        onClose={() => setContextMenu(null)}
      />

      <AddNodePanel
        visible={addPanel.visible}
        mode={addPanel.mode}
        onClose={() => setAddPanel((s) => ({ ...s, visible: false }))}
        onAddNode={onAddNode}
      />

      <ConnectionTypeSelector
        visible={connectionSelector}
        sourceName={
          pendingConnection?.source
            ? ((nodes.find((n) => n.id === pendingConnection.source)?.data as Record<string, unknown>)?.title as string) || pendingConnection.source
            : ''
        }
        targetName={
          pendingConnection?.target
            ? ((nodes.find((n) => n.id === pendingConnection.target)?.data as Record<string, unknown>)?.title as string) || pendingConnection.target
            : ''
        }
        onSelect={onConnectionTypeSelect}
        onCancel={() => {
          setConnectionSelector(false)
          setPendingConnection(null)
        }}
      />

      <EdgeDetailPanel
        visible={edgeDetail.visible}
        data={edgeDetail.data}
        onClose={() => setEdgeDetail({ visible: false, edgeId: null, data: null })}
        onApprove={onApproveEdge}
        onReject={onRejectEdge}
      />

      <ProposalsBadge count={proposals.length} onClick={() => setProposalsVisible(true)} />
      <Suspense fallback={null}>
        <ProposalsPanel
          proposals={proposals}
          visible={proposalsVisible}
          onClose={() => setProposalsVisible(false)}
          onApprove={onApproveProposal}
          onReject={onRejectProposal}
        />
      </Suspense>

      {/* Share modal */}
      {currentFlow && (
        <Suspense fallback={null}>
          <ShareModal
            visible={shareModalVisible}
            flow={currentFlow}
            onClose={() => setShareModalVisible(false)}
            onTogglePublic={async (isPublic) => {
              await updateFlow(currentFlow.id, { is_public: isPublic })
              setCurrentFlow({ ...currentFlow, is_public: isPublic })
            }}
          />
        </Suspense>
      )}

      {/* Export panel */}
      <Suspense fallback={null}>
        <ExportPanel
          visible={exportPanelVisible}
          flowName={flowName}
          nodes={nodes}
          edges={edges}
          onClose={() => setExportPanelVisible(false)}
        />
      </Suspense>

      {/* Canvas search (Cmd+F) */}
      <CanvasSearch nodes={nodes} onHighlightNode={setHighlightNodeId} />

      {/* AI Search Panel */}
      <Suspense fallback={null}>
        <AISearchPanel
          visible={searchPanelVisible}
          onClose={() => setSearchPanelVisible(false)}
          onAddVerse={onAddVerseFromSearch}
        />
      </Suspense>

      {isGenerating && (
        <div
          className="fixed top-14 right-4 z-[500] px-4 py-2 rounded-lg text-xs"
          style={{
            background: VERBUM_COLORS.ui_bg,
            border: `1px solid ${VERBUM_COLORS.ui_border}`,
            color: VERBUM_COLORS.text_secondary,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Gerando explicação teológica...
        </div>
      )}

      {/* Performance warning for large graphs */}
      {nodes.length > 200 && (
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-lg text-xs"
          style={{
            background: 'rgba(212,136,74,0.15)',
            border: `1px solid ${VERBUM_COLORS.edge_proposta}`,
            color: VERBUM_COLORS.edge_proposta,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {nodes.length} nós — performance pode ser afetada
        </div>
      )}
    </div>
  )
}

export default function VerbumCanvas() {
  return (
    <ReactFlowProvider>
      <VerbumCanvasInner />
    </ReactFlowProvider>
  )
}
