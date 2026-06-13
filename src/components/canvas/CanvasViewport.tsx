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
import { setZoom, selectedNodeId, selectedNodeIds, setActivePanelTab } from '../../store'
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
import s from '../../styles/layout.module.css'

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
      class={s.canvasContainer}
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
