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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from '../nodes/nodeTypes'
import { edgeTypes } from '../edges/edgeTypes'
import { VERBUM_COLORS } from '../design-tokens'
import CanvasBackground from './CanvasBackground'
import ContextMenu from './ContextMenu'
import AddNodePanel, { type AddNodePayload } from '../panels/AddNodePanel'
import type { TrinitasNodeData, ContextMenuAction } from '../types/verbum.types'

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

  const onConnect: OnConnect = useCallback(
    (_connection) => {
      // Sprint 3: manual connection logic
    },
    []
  )

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
