'use client'

import { useCallback, useMemo, useState, useRef } from 'react'
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

import { nodeTypes } from '../nodes/nodeTypes'
import { edgeTypes } from '../edges/edgeTypes'
import { VERBUM_COLORS } from '../design-tokens'
import CanvasBackground from './CanvasBackground'
import ContextMenu from './ContextMenu'
import AddNodePanel, { type AddNodePayload } from '../panels/AddNodePanel'
import ConnectionTypeSelector from '../panels/ConnectionTypeSelector'
import EdgeDetailPanel from '../panels/EdgeDetailPanel'
import { getConnectionExplanation } from '../services/openai.service'
import type {
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

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), [])

  return (
    <div className="relative w-full h-full" style={{ background: VERBUM_COLORS.canvas_bg }}>
      <CanvasBackground />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneContextMenu={onPaneContextMenu}
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
