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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { ArrowLeft, Plus, HelpCircle } from 'lucide-react'

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
import ProposalsPanel, { ProposalsBadge } from '../panels/ProposalsPanel'
import type {
  ConnectionProposal,
  TrinitasNodeData,
  ContextMenuAction,
  RelationType,
  VerbumSource,
  EdgeStatus,
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

const INITIAL_EDGES: Edge[] = []

function VerbumCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES)
  const { screenToFlowPosition } = useReactFlow()

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

  // Loading state for AI explanations
  const [isGenerating, setIsGenerating] = useState(false)

  // Proposals state
  const [proposals, setProposals] = useState<ConnectionProposal[]>([])
  const [proposalsVisible, setProposalsVisible] = useState(false)

  // Layer visibility
  const [visibleLayers, setVisibleLayers] = useState<number[]>([0, 1, 2, 3, 4, 5])

  // Focus mode (Alt+click)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        setPendingConnection(connection)
        setConnectionSelector(true)
      }
    },
    []
  )

  // When user selects a connection type
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

      // Create edge immediately as "proposta" with pending explanation
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

      // Call AI for explanation (non-blocking — edge already visible)
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
          // Update edge with AI explanation and proper type
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
        } else {
          // AI failed — keep as proposta with generic name
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
      }
    },
    [pendingConnection, nodes, setEdges]
  )

  // Handle edge click to show detail panel
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

  // Approve a proposed edge
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
  }, [edgeDetail.edgeId, setEdges])

  // Reject a proposed edge
  const onRejectEdge = useCallback(() => {
    if (!edgeDetail.edgeId) return
    setEdges((eds) => eds.filter((e) => e.id !== edgeDetail.edgeId))
    setEdgeDetail({ visible: false, edgeId: null, data: null })
  }, [edgeDetail.edgeId, setEdges])

  // Handle right-click on canvas pane
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
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
    [screenToFlowPosition]
  )

  // When user picks an option from context menu
  const onContextMenuSelect = useCallback((action: ContextMenuAction) => {
    setAddPanel({ visible: true, mode: action })
  }, [])

  // When user confirms a node from AddNodePanel
  const onAddNode = useCallback(
    (payload: AddNodePayload) => {
      const newId = `node-${Date.now()}`
      const pos = insertPositionRef.current

      let nodeType: string
      let data: Record<string, unknown>

      switch (payload.type) {
        case 'canonical':
          // Canonical entities use their specific node type based on entity_type
          if (payload.canonicalEntity?.entity_type === 'maria' || payload.canonicalEntity?.entity_type === 'pessoa_biblica') {
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
          } else {
            nodeType = 'figura'
            data = {
              title: payload.title,
              title_latin: payload.titleLatin,
              description: payload.description,
              layer_id: payload.layerId,
              is_canonical: true,
              canonical_entity_id: payload.canonicalEntity?.id,
              visual_tier: payload.canonicalEntity?.visual_tier || 2,
            }
          }
          break

        case 'encarnado':
          nodeType = 'encarnado'
          // Position near the Triquetra
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

      setNodes((nds) => {
        const updated = [...nds, newNode]

        // Trigger auto-connection in background (non-blocking)
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
    },
    [setNodes]
  )

  // Approve a proposal: create edge
  const onApproveProposal = useCallback(
    (proposal: ConnectionProposal) => {
      const edgeId = `edge-${Date.now()}`
      // Find the new node that triggered this proposal (last added non-canonical)
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
    },
    [nodes, setEdges]
  )

  // Reject a proposal: just remove it
  const onRejectProposal = useCallback(
    (proposal: ConnectionProposal) => {
      setProposals((prev) => prev.filter((p) => p !== proposal))
    },
    []
  )

  // Toggle layer visibility
  const onToggleLayer = useCallback((layerId: number) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId) ? prev.filter((l) => l !== layerId) : [...prev, layerId]
    )
  }, [])

  // Handle node click for focus mode (Alt+click)
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.altKey) {
        setFocusNodeId((prev) => (prev === node.id ? null : node.id))
      }
    },
    []
  )

  // Attach keyboard listener for focus mode ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusNodeId(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Apply layer filtering and focus mode to nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const layerId = (node.data as Record<string, unknown>)?.layer_id as number ?? 0
      const isLayerVisible = visibleLayers.includes(layerId)

      // Focus mode: dim non-connected nodes
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

  // Apply layer filtering to edges
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

      // Focus mode
      let isFocused = true
      if (focusNodeId) {
        isFocused = edge.source === focusNodeId || edge.target === focusNodeId
      }

      if (sourceHidden && targetHidden) {
        return { ...edge, hidden: true }
      }
      if (sourceHidden || targetHidden) {
        // Cross-layer edge: show as dotted
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

  return (
    <div className="relative w-full h-full" style={{ background: VERBUM_COLORS.canvas_bg }}>
      <CanvasBackground />

      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
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
            className="text-xs font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold, letterSpacing: '0.08em' }}
          >
            MAPPA FIDEI
          </span>
        </div>

        <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
          {/* Quick add button */}
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
            title="Adicionar nó (ou clique direito no canvas)"
          >
            <Plus className="w-3.5 h-3.5" />
            Inserir
          </button>

          {/* Help hint */}
          <div className="relative group">
            <button
              className="p-1.5 rounded-lg"
              style={{ color: VERBUM_COLORS.text_muted }}
            >
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

      {/* Layer controls */}
      <LayerControls
        visibleLayers={visibleLayers}
        onToggleLayer={onToggleLayer}
      />

      {/* Focus mode indicator */}
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

      {/* Context menu */}
      <ContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        visible={contextMenu !== null}
        onSelect={onContextMenuSelect}
        onClose={() => setContextMenu(null)}
      />

      {/* Add node panel */}
      <AddNodePanel
        visible={addPanel.visible}
        mode={addPanel.mode}
        onClose={() => setAddPanel((s) => ({ ...s, visible: false }))}
        onAddNode={onAddNode}
      />

      {/* Connection type selector */}
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

      {/* Edge detail panel */}
      <EdgeDetailPanel
        visible={edgeDetail.visible}
        data={edgeDetail.data}
        onClose={() => setEdgeDetail({ visible: false, edgeId: null, data: null })}
        onApprove={onApproveEdge}
        onReject={onRejectEdge}
      />

      {/* Proposals badge + panel */}
      <ProposalsBadge
        count={proposals.length}
        onClick={() => setProposalsVisible(true)}
      />
      <ProposalsPanel
        proposals={proposals}
        visible={proposalsVisible}
        onClose={() => setProposalsVisible(false)}
        onApprove={onApproveProposal}
        onReject={onRejectProposal}
      />

      {/* AI generating indicator */}
      {isGenerating && (
        <div
          className="fixed top-4 right-4 z-[500] px-4 py-2 rounded-lg text-xs"
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

// Wrap with ReactFlowProvider for useReactFlow hook
export default function VerbumCanvas() {
  return (
    <ReactFlowProvider>
      <VerbumCanvasInner />
    </ReactFlowProvider>
  )
}
