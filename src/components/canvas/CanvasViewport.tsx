import { useRef, useState, useCallback, useEffect } from 'preact/hooks'
import type { Ref } from 'preact'
import type { NodeData } from '@logicflow/core'
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
import hotkeys from 'hotkeys-js'

export function CanvasViewport() {
  const containerRef = useRef<HTMLElement | null>(null)
  const lfRef = useRef<import('@logicflow/core').LogicFlow | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [allNodes, setAllNodes] = useState<NodeData[]>([])

  // Keyboard shortcuts (unified via hotkeys-js)
  useEffect(() => {
    hotkeys('ctrl+f', (e) => {
      e.preventDefault()
      showNodeSearch()
    })
    return () => hotkeys.unbind('ctrl+f')
  }, [])

  // ── Sync debugNodeStates → LogicFlow node properties ──
  // When debug state changes, update each node model's properties so
  // BaseNode view can render debug highlights (stroke color, glow, etc.)
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
      } catch (_e) {
        /* skip */
      }
    }
  }, [debugNodeStates.value, debugBreakpoints.value, isDebugRunning.value])

  useLogicFlow({ containerRef, lfRef, setIsEmpty, setAllNodes, demoData: DEMO_DATA })
  const { handleDrop, handleDragOver } = useDragDrop({ lfRef, setIsEmpty })

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
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
    </div>
  )
}
