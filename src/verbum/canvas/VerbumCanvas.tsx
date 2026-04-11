'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type OnConnect,
  type Connection,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, HelpCircle, Save, Cloud, CloudOff, Share2 } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { nodeTypes } from '../nodes/nodeTypes'
import { edgeTypes } from '../edges/edgeTypes'
import { VERBUM_COLORS } from '../design-tokens'
import CanvasBackground from './CanvasBackground'
import LayerControls from './LayerControls'
import ContextMenu from './ContextMenu'
import AddNodePanel, { type AddNodePayload } from '../panels/AddNodePanel'
import ConnectionTypeSelector from '../panels/ConnectionTypeSelector'
import EdgeDetailPanel from '../panels/EdgeDetailPanel'
import ShareModal from '../panels/ShareModal'
import { getConnectionExplanation } from '../services/openai.service'
import { proposeConnections } from '../services/connection.service'
import {
  getFlow,
  createFlow,
  updateFlow,
  loadFlowNodes,
  loadFlowEdges,
  saveFlowNode,
  saveFlowEdge,
  deleteFlowEdge,
  updateNodePosition as persistNodePosition,
} from '../services/flow.service'
import ProposalsPanel, { ProposalsBadge } from '../panels/ProposalsPanel'
import type {
  ConnectionProposal,
  TrinitasNodeData,
  ContextMenuAction,
  RelationType,
  VerbumSource,
  EdgeStatus,
  VerbumFlow,
} from '../types/verbum.types'

// Initial Triquetra node at center
const INITIAL_NODES: Node[] = [
  {
    id: 'canonical-trindade',
    type: 'trinitas',
    position: { x: 0, y: 0 },
    data: {
      canonical_name: 'trindade',
      display_name: 'Santíssima Trindade',
      layer_id: 0,
      is_canonical: true,
    } satisfies TrinitasNodeData,
    draggable: false,
    selectable: true,
  },
]

function VerbumCanvasInner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const flowIdParam = searchParams.get('flow')

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition } = useReactFlow()

  // Flow state
  const [currentFlow, setCurrentFlow] = useState<VerbumFlow | null>(null)
  const [flowName, setFlowName] = useState('Meu Fluxo')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'offline'>('offline')
  const [isReadOnly, setIsReadOnly] = useState(false)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null)

  // AddNodePanel state
  const [addPanel, setAddPanel] = useState<{ visible: boolean; mode: ContextMenuAction }>({
    visible: false,
    mode: 'figura',
  })

  // Store the position where the user right-clicked (in flow coords)
  const insertPositionRef = useRef<{ x: number; y: number }>({ x: 200, y: 200 })

  // Connection type selector state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [connectionSelector, setConnectionSelector] = useState(false)

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
  const [proposals, setProposals] = useState<ConnectionProposal[]>([])
  const [proposalsVisible, setProposalsVisible] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<number[]>([0, 1, 2, 3, 4, 5])
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [shareModalVisible, setShareModalVisible] = useState(false)

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  // ─── Load or create flow on mount ───
  useEffect(() => {
    if (!user?.id) return

    async function initFlow() {
      isLoadingRef.current = true

      if (flowIdParam) {
        // Load existing flow
        const flow = await getFlow(flowIdParam)
        if (flow) {
          setCurrentFlow(flow)
          setFlowName(flow.name)
          setIsReadOnly(flow.user_id !== user!.id)

          // Load nodes and edges
          const [dbNodes, dbEdges] = await Promise.all([
            loadFlowNodes(flowIdParam),
            loadFlowEdges(flowIdParam),
          ])

          // Convert DB nodes to React Flow nodes
          const loadedNodes: Node[] = [
            ...INITIAL_NODES,
            ...dbNodes.map((n: Record<string, unknown>) => ({
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
        }
      } else {
        // Create a new flow
        const newFlow = await createFlow(user!.id, 'Meu Fluxo')
        if (newFlow) {
          setCurrentFlow(newFlow)
          setFlowName(newFlow.name)
          setSaveStatus('saved')
          // Update URL without navigation
          window.history.replaceState({}, '', `/verbum/canvas?flow=${newFlow.id}`)
        }
      }

      isLoadingRef.current = false
    }

    initFlow()
  }, [user?.id, flowIdParam, setNodes, setEdges])

  // ─── Auto-save debounced ───
  const triggerSave = useCallback(() => {
    if (!currentFlow || !user?.id || isReadOnly || isLoadingRef.current) return
    setSaveStatus('unsaved')

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        // Count nodes (excluding the system Triquetra)
        const userNodes = nodes.filter(n => n.id !== 'canonical-trindade')
        await updateFlow(currentFlow.id, {
          node_count: userNodes.length,
          edge_count: edges.length,
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 2000)
  }, [currentFlow, user?.id, isReadOnly, nodes, edges])

  // ─── Persist node position on drag ───
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)

      if (!currentFlow || !user?.id || isReadOnly) return

      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false && change.id !== 'canonical-trindade') {
          persistNodePosition(change.id, change.position.x, change.position.y)
          triggerSave()
        }
      }
    },
    [onNodesChange, currentFlow, user?.id, isReadOnly, triggerSave]
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

      const edgeId = `edge-${Date.now()}`
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
        })
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
            })
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
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeDetail.edgeId
          ? {
              ...e,
              type: (e.data as Record<string, unknown>)?.relation_type as string || e.type,
              animated: false,
              data: { ...e.data, status: 'aprovada' },
            }
          : e
      )
    )
    setEdgeDetail((s) => ({
      ...s,
      data: s.data ? { ...s.data, status: 'aprovada' } : null,
    }))
    triggerSave()
  }, [edgeDetail.edgeId, setEdges, triggerSave])

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

  const onContextMenuSelect = useCallback((action: ContextMenuAction) => {
    setAddPanel({ visible: true, mode: action })
  }, [])

  const onAddNode = useCallback(
    (payload: AddNodePayload) => {
      const newId = `node-${Date.now()}`
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
        })
      }

      setNodes((nds) => {
        const updated = [...nds, newNode]

        const existingSimpleNodes = updated
          .filter((n) => n.id !== newId)
          .map((n) => ({
            id: n.id,
            title: ((n.data as Record<string, unknown>)?.title as string) ||
                   ((n.data as Record<string, unknown>)?.display_name as string) || n.id,
            type: n.type || 'unknown',
            ref: (n.data as Record<string, unknown>)?.bible_reference as string | undefined,
          }))

        proposeConnections(
          {
            id: newId,
            title: (data.title as string) || payload.title,
            type: nodeType,
            ref: (data.bible_reference as string) || undefined,
          },
          existingSimpleNodes
        ).then((newProposals) => {
          if (newProposals.length > 0) {
            setProposals((prev) => [...prev, ...newProposals])
          }
        })

        return updated
      })

      triggerSave()
    },
    [setNodes, currentFlow, user?.id, triggerSave]
  )

  const onApproveProposal = useCallback(
    (proposal: ConnectionProposal) => {
      const edgeId = `edge-${Date.now()}`
      const sourceNode = nodes.find((n) => {
        const title = ((n.data as Record<string, unknown>)?.title as string) || ''
        return title && n.id !== proposal.target_node_id
      })

      const newEdge: Edge = {
        id: edgeId,
        source: sourceNode?.id || nodes[nodes.length - 1]?.id || '',
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
          source_name: sourceNode
            ? ((sourceNode.data as Record<string, unknown>)?.title as string) || ''
            : '',
          target_name: proposal.target_node_title,
        },
      }

      setEdges((eds) => [...eds, newEdge])
      setProposals((prev) => prev.filter((p) => p !== proposal))

      // Persist
      if (currentFlow && user?.id) {
        saveFlowEdge(currentFlow.id, user.id, {
          id: edgeId,
          source_node_id: sourceNode?.id || nodes[nodes.length - 1]?.id || '',
          target_node_id: proposal.target_node_id,
          relation_type: proposal.relation_type,
          magisterial_weight: proposal.magisterial_weight,
          theological_name: proposal.theological_name,
          ai_explanation_short: proposal.explanation_short,
          ai_explanation: proposal.explanation_full,
          sources: proposal.sources,
          status: 'aprovada',
        })
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

      return {
        ...node,
        hidden: !isLayerVisible,
        style: {
          ...node.style,
          opacity: isFocused ? 1 : 0.15,
          transition: 'opacity 0.3s ease',
        },
      }
    })
  }, [nodes, visibleLayers, focusNodeId, edges])

  const filteredEdges = useMemo(() => {
    const hiddenNodeIds = new Set(
      nodes
        .filter((n) => {
          const layerId = (n.data as Record<string, unknown>)?.layer_id as number ?? 0
          return !visibleLayers.includes(layerId)
        })
        .map((n) => n.id)
    )

    return edges.map((edge) => {
      const sourceHidden = hiddenNodeIds.has(edge.source)
      const targetHidden = hiddenNodeIds.has(edge.target)

      let isFocused = true
      if (focusNodeId) {
        isFocused = edge.source === focusNodeId || edge.target === focusNodeId
      }

      if (sourceHidden && targetHidden) {
        return { ...edge, hidden: true }
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
  }, [edges, nodes, visibleLayers, focusNodeId])

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), [])

  // Save status indicator
  const SaveIcon = saveStatus === 'saved' ? Cloud : saveStatus === 'saving' ? Save : saveStatus === 'unsaved' ? CloudOff : CloudOff
  const saveLabel = saveStatus === 'saved' ? 'Salvo' : saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'unsaved' ? 'Não salvo' : ''

  return (
    <div className="relative w-full h-full" style={{ background: VERBUM_COLORS.canvas_bg }}>
      <CanvasBackground />

      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
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
          }}
        />
      </ReactFlow>

      {/* Top toolbar */}
      <div
        className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,8,6,0.95) 0%, rgba(10,8,6,0.7) 80%, transparent 100%)',
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
            className="text-xs font-semibold truncate max-w-[200px]"
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

          {/* Help hint */}
          <div className="relative group">
            <button className="p-1.5 rounded-lg" style={{ color: VERBUM_COLORS.text_muted }}>
              <HelpCircle className="w-4 h-4" />
            </button>
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl p-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
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
      <ProposalsPanel
        proposals={proposals}
        visible={proposalsVisible}
        onClose={() => setProposalsVisible(false)}
        onApprove={onApproveProposal}
        onReject={onRejectProposal}
      />

      {/* Share modal */}
      {currentFlow && (
        <ShareModal
          visible={shareModalVisible}
          flow={currentFlow}
          onClose={() => setShareModalVisible(false)}
          onTogglePublic={async (isPublic) => {
            await updateFlow(currentFlow.id, { is_public: isPublic })
            setCurrentFlow({ ...currentFlow, is_public: isPublic })
          }}
        />
      )}

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
