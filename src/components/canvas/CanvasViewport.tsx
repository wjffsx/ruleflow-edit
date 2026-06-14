import { useRef, useState, useCallback, useEffect } from 'preact/hooks'
import type { Ref } from 'preact'
import type { GraphData, NodeData } from '@logicflow/core'
import { RelationTypeSelector } from './RelationTypeSelector'
import { PropertyBubble } from './PropertyBubble'
import { NodeSearch } from './NodeSearch'
import { BatchActionToolbar } from './BatchActionToolbar'
import { ZoomControls } from './ZoomControls'
import { EmptyState } from './EmptyState'
import { useLogicFlow } from './useLogicFlow'
import { useDragDrop } from './useDragDrop'
import {
  setZoom,
  selectedNodeId,
  selectedNodeIds,
  setActivePanelTab,
  lfInstance,
  debugNodeStates,
  debugBreakpoints,
  isDebugRunning,
} from '../../store'
import {
  hideRelationSelector,
  relationSelectorState,
  hidePropertyBubble,
  propertyBubbleState,
  nodeSearchVisible,
  hideNodeSearch,
  showNodeSearch,
  hideBatchToolbar,
  batchToolbarState,
} from '../../store/canvasActions'
import { DEMO_DATA } from '../../data'
import type { RuleFlowDocument, RuleFlowNode, RuleFlowEdge } from '../../types/ruleflowDocument'
import type { EditorMode, MonitorState, MonitorNodeState } from '../../layout/RuleFlowEditor'
import hotkeys from 'hotkeys-js'

interface CanvasViewportProps {
  /** Initial data to render (RuleFlowDocument or LogicFlow GraphData) */
  initialData?: RuleFlowDocument | GraphData
  /** Read-only mode — disables drag-drop, node editing */
  readOnly?: boolean
  /** Editor mode */
  mode?: EditorMode
  /** Runtime monitoring state */
  monitorState?: MonitorState
  /** Callback when graph data changes */
  onDataChange?: (data: RuleFlowDocument) => void
  /** Fine-grained callbacks */
  onNodeAdd?: (node: RuleFlowNode) => void
  onNodeDelete?: (nodeId: string) => void
  onNodeUpdate?: (node: RuleFlowNode) => void
  onEdgeAdd?: (edge: RuleFlowEdge) => void
  onEdgeDelete?: (edgeId: string) => void
}

export function CanvasViewport({
  initialData,
  readOnly = false,
  mode = 'edit',
  monitorState,
  onDataChange,
  onNodeAdd,
  onNodeDelete,
  onNodeUpdate,
  onEdgeAdd,
  onEdgeDelete,
}: CanvasViewportProps = {}) {
  const containerRef = useRef<HTMLElement | null>(null)
  const lfRef = useRef<import('@logicflow/core').LogicFlow | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [allNodes, setAllNodes] = useState<NodeData[]>([])

  // ── Convert initialData to GraphData for LogicFlow ──
  const resolveGraphData = useCallback((): GraphData => {
    if (!initialData) return DEMO_DATA
    // If it's a RuleFlowDocument, extract nodes/edges
    if ('chainId' in initialData && 'nodes' in initialData) {
      const doc = initialData as RuleFlowDocument
      return {
        nodes: doc.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          x: n.x,
          y: n.y,
          text: n.text,
          properties: n.properties,
        })),
        edges: doc.edges.map((e) => ({
          id: e.id,
          type: e.type,
          sourceNodeId: e.sourceNodeId,
          targetNodeId: e.targetNodeId,
          text: (e as any).text,
          properties: e.properties,
        })),
      }
    }
    // Already GraphData
    return initialData as GraphData
  }, [initialData])

  // Keyboard shortcuts (unified via hotkeys-js)
  useEffect(() => {
    hotkeys('ctrl+f', (e) => {
      e.preventDefault()
      showNodeSearch()
    })
    return () => hotkeys.unbind('ctrl+f')
  }, [])

  // ── Sync debugNodeStates → LogicFlow node/edge properties ──
  useEffect(() => {
    const states = debugNodeStates.value
    const bps = debugBreakpoints.value
    const lf = lfRef.current
    if (!lf) return

    const bpSet = new Set(bps)

    // Update debug state on nodes
    for (const [nodeId, state] of Object.entries(states)) {
      try {
        const model = lf.getNodeModelById(nodeId)
        if (model && model.properties?.debugState !== state) {
          model.setProperties({ ...model.properties, debugState: state })
        }
      } catch (_e) {
        if (import.meta.env.DEV)
          console.warn('[RuleFlow] debug state sync failed for node:', nodeId)
      }
    }

    // P1-3: Highlight edges between executed nodes
    // An edge is "executed" if both source and target nodes have a non-idle debug state
    try {
      const data = lf.getGraphData()
      for (const edge of data?.edges || []) {
        try {
          const edgeModel = lf.getEdgeModelById(edge.id)
          if (!edgeModel) continue
          const srcState = states[edge.sourceNodeId]
          const tgtState = states[edge.targetNodeId]
          const isExecuted = srcState && tgtState && srcState !== 'idle' && tgtState !== 'idle'
          if (edgeModel.properties?.debugExecuted !== isExecuted) {
            edgeModel.setProperties({ ...edgeModel.properties, debugExecuted: isExecuted })
          }
        } catch (_e) {
          /* skip */
        }
      }
    } catch (_e) {
      /* skip */
    }

    // Sync breakpoint property
    try {
      const data = lf.getGraphData()
      for (const node of data?.nodes || []) {
        const hasBp = bpSet.has(node.id)
        try {
          const model = lf.getNodeModelById(node.id)
          if (model && model.properties?.breakpoint !== hasBp) {
            model.setProperties({ ...model.properties, breakpoint: hasBp })
          }
        } catch (_e) {
          /* skip */
        }
      }
    } catch (_e) {
      /* skip */
    }

    // Clear debug state on nodes no longer in the states map
    if (!isDebugRunning.value) {
      try {
        const data = lf.getGraphData()
        for (const node of data?.nodes || []) {
          try {
            const model = lf.getNodeModelById(node.id)
            if (model && model.properties?.debugState && model.properties.debugState !== 'idle') {
              model.setProperties({ ...model.properties, debugState: 'idle' })
            }
          } catch (_e) {
            /* skip */
          }
        }
        // Clear edge debug state
        for (const edge of data?.edges || []) {
          try {
            const edgeModel = lf.getEdgeModelById(edge.id)
            if (edgeModel && edgeModel.properties?.debugExecuted) {
              edgeModel.setProperties({ ...edgeModel.properties, debugExecuted: false })
            }
          } catch (_e) {
            /* skip */
          }
        }
      } catch (_e) {
        /* skip */
      }
    }
  }, [debugNodeStates.value, debugBreakpoints.value, isDebugRunning.value])

  // ── P0-2: Sync monitorState → LogicFlow node/edge properties ──
  useEffect(() => {
    if (!monitorState || mode !== 'monitor') return
    const lf = lfRef.current
    if (!lf) return

    const { nodeStates, edgeStates } = monitorState

    // Sync node monitor state
    for (const [nodeId, state] of Object.entries(nodeStates)) {
      try {
        const model = lf.getNodeModelById(nodeId)
        if (model) {
          const prev = model.properties?.monitorState as MonitorNodeState | undefined
          if (prev?.status !== state.status || prev?.evalCount !== state.evalCount) {
            model.setProperties({ ...model.properties, monitorState: state })
          }
        }
      } catch (_e) {
        /* skip */
      }
    }

    // Sync edge monitor state
    for (const [edgeId, state] of Object.entries(edgeStates)) {
      try {
        const model = lf.getEdgeModelById(edgeId)
        if (model) {
          const prev = model.properties?.monitorState as { flowRate?: number } | undefined
          if (prev?.flowRate !== state.flowRate) {
            model.setProperties({ ...model.properties, monitorState: state })
          }
        }
      } catch (_e) {
        /* skip */
      }
    }
  }, [monitorState, mode])

  useLogicFlow({
    containerRef,
    lfRef,
    setIsEmpty,
    setAllNodes,
    initialData: resolveGraphData(),
    readOnly,
  })
  const { handleDrop, handleDragOver } = useDragDrop({ lfRef, setIsEmpty, readOnly })

  // ── Handlers for overlay components ──

  const handleRelationSelect = useCallback((edgeId: string, relationType: string) => {
    const lf = lfRef.current
    if (!lf || !edgeId) return
    try {
      const edgeModel = lf.getEdgeModelById(edgeId)
      if (edgeModel) {
        edgeModel.setProperties({ ...edgeModel.properties, relationType })
        edgeModel.text =
          typeof edgeModel.text === 'object'
            ? { ...edgeModel.text, value: relationType === 'default' ? '' : relationType }
            : relationType === 'default'
              ? ''
              : relationType
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] relation select failed:', err)
    }
    hideRelationSelector()
  }, [])

  const handleLocateNode = useCallback((nodeId: string) => {
    const lf = lfRef.current
    if (!lf || !nodeId) return
    try {
      lf.focusOnElementById(nodeId)
      selectedNodeId.value = nodeId
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] node locate failed:', err)
    }
  }, [])

  const handleZoomIn = () => {
    const lf = lfRef.current
    if (lf) {
      lf.zoom(true)
      try {
        const z = lf.getTransform()
        if (z?.SCALE_X) setZoom(Math.round(z.SCALE_X * 100))
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[RuleFlow] zoom in failed:', e)
      }
    }
  }
  const handleZoomOut = () => {
    const lf = lfRef.current
    if (lf) {
      lf.zoom(false)
      try {
        const z = lf.getTransform()
        if (z?.SCALE_X) setZoom(Math.round(z.SCALE_X * 100))
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[RuleFlow] zoom out failed:', e)
      }
    }
  }
  const handleZoomReset = () => {
    const lf = lfRef.current
    if (lf) {
      lf.resetZoom()
      setZoom(100)
    }
  }

  // Read overlay states
  const relSelector = relationSelectorState.value
  const propBubble = propertyBubbleState.value
  const showSearch = nodeSearchVisible.value
  const batchToolbar = batchToolbarState.value

  return (
    <div
      class="relative overflow-hidden bg-[var(--rf-bg-secondary)]"
      style={{ gridArea: 'canvas' }}
      onDrop={readOnly ? undefined : handleDrop}
      onDragOver={readOnly ? undefined : handleDragOver}
      role="application"
      aria-label="规则链画布"
    >
      {/* LogicFlow container */}
      <div
        ref={containerRef as unknown as Ref<HTMLDivElement>}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Empty state */}
      {isEmpty && <EmptyState />}

      {/* ── Phase 2 Overlay Components ── */}

      {/* Relation type selector */}
      {relSelector && (
        <RelationTypeSelector
          x={relSelector.x}
          y={relSelector.y}
          edgeId={relSelector.edgeId as string}
          onSelect={handleRelationSelect}
          onClose={hideRelationSelector}
        />
      )}

      {/* Property bubble */}
      {propBubble && (
        <PropertyBubble
          x={propBubble.x}
          y={propBubble.y}
          nodeData={propBubble.nodeData}
          onClose={hidePropertyBubble}
          onOpenPanel={() => {
            hidePropertyBubble()
            setActivePanelTab('properties')
          }}
          monitorState={
            mode === 'monitor' && monitorState
              ? monitorState.nodeStates[(propBubble.nodeData as { id?: string })?.id ?? '']
              : undefined
          }
        />
      )}

      {/* Node search (Ctrl+F) */}
      {showSearch && (
        <NodeSearch nodes={allNodes} onClose={hideNodeSearch} onLocateNode={handleLocateNode} />
      )}

      {/* Batch action toolbar */}
      {batchToolbar && batchToolbar.count >= 2 && (
        <BatchActionToolbar
          x={batchToolbar.x}
          y={batchToolbar.y}
          selectedCount={batchToolbar.count}
          onCopy={() => {
            /* TODO */
          }}
          onDelete={() => {
            if (readOnly) return
            const lf = lfRef.current
            if (lf) {
              selectedNodeIds.value.forEach((id) => {
                try {
                  lf.deleteNode(id)
                } catch (e) {
                  if (import.meta.env.DEV) console.warn('[RuleFlow] batch delete node failed:', e)
                }
              })
              hideBatchToolbar()
            }
          }}
          onToggleEnable={() => {
            /* TODO */
          }}
          onGroup={() => {
            /* TODO */
          }}
        />
      )}

      {/* Zoom controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* P1-2: Monitor status legend */}
      {mode === 'monitor' && (
        <div class="absolute bottom-3 right-14 flex items-center gap-3 bg-[var(--rf-bg-elevated,#ffffff)] border border-[var(--rf-border,#e5e7eb)] rounded-[var(--rf-radius-md,6px)] px-3 py-1.5 text-[var(--rf-text-2xs,9px)] shadow-[var(--rf-shadow-sm)] z-[var(--rf-z-popover,300)]">
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-[var(--rf-status-success,#16a34a)]" />
            运行中
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-[var(--rf-status-danger,#dc2626)]" />
            错误
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-[var(--rf-text-tertiary,#9ca3af)]" />
            空闲
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-[var(--rf-text-tertiary,#9ca3af)] opacity-50" />
            禁用
          </span>
        </div>
      )}
    </div>
  )
}
