/**
 * Canvas state management.
 * Handles zoom, status, selection, chain info, and overlay component states.
 */
import { signal } from '@preact/signals'
import type { CanvasStatus, PropertyBubbleState, RelationSelectorState } from '../types/editor'
import type { LogicFlow, NodeData } from '@logicflow/core'

/** Current canvas zoom percentage */
export const canvasZoom = signal<number>(100)

/** Set canvas zoom, clamped to 25-200% */
export function setZoom(z: number): void {
  const newZoom = Math.min(200, Math.max(25, Math.round(z)))
  canvasZoom.value = newZoom
  // Sync signal → LogicFlow
  const lf = lfInstance.value
  if (lf) {
    try {
      const currentTransform = lf.getTransform()
      const currentScale = currentTransform?.SCALE_X || 1
      const targetScale = newZoom / 100
      if (Math.abs(currentScale - targetScale) > 0.01) {
        lf.zoom(targetScale / currentScale)
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] zoom sync failed:', e)
    }
  }
}

/** Current canvas status */
export const canvasStatus = signal<CanvasStatus>('editing')

/** Set canvas status */
export function setCanvasStatus(s: CanvasStatus): void {
  canvasStatus.value = s
}

/** Selected node ID */
export const selectedNodeId = signal<string | null>(null)

/** Selected edge ID */
export const selectedEdgeId = signal<string | null>(null)

/** Selected node IDs for multi-select batch operations */
export const selectedNodeIds = signal<string[]>([])

/** Chain name */
export const chainName = signal<string>('未命名规则链')

/** Last saved timestamp */
export const lastSaved = signal<string | null>(null)

/** Whether there are unsaved changes */
export const isDirty = signal<boolean>(false)

/** LogicFlow instance reference (set by CanvasViewport) */
export const lfInstance = signal<LogicFlow | null>(null)

/** Set the LogicFlow instance reference */
export function setLfInstance(lf: LogicFlow): void {
  lfInstance.value = lf
}

/** Node count */
export const nodeCount = signal<number>(0)

/** Edge count */
export const edgeCount = signal<number>(0)

/** Error count */
export const errorCount = signal<number>(0)

/** Warning count */
export const warningCount = signal<number>(0)

/** Outline nodes synced from LogicFlow graph */
export const outlineNodes = signal<NodeData[]>([])

// ── Overlay component states ──

/** Relation type selector state */
export const relationSelectorState = signal<RelationSelectorState | null>(null)

/** Show the relation type selector at the given position */
export function showRelationSelector(x: number, y: number, edgeId: string): void {
  relationSelectorState.value = { visible: true, x, y, edgeId, sourceId: null, targetId: null }
}

/** Hide the relation type selector */
export function hideRelationSelector(): void {
  relationSelectorState.value = null
}

/** Property bubble state */
export const propertyBubbleState = signal<PropertyBubbleState | null>(null)

/** Show the property bubble near a node */
export function showPropertyBubble(x: number, y: number, nodeData: Record<string, unknown>): void {
  propertyBubbleState.value = { visible: true, x, y, nodeId: null, nodeData }
}

/** Hide the property bubble */
export function hidePropertyBubble(): void {
  propertyBubbleState.value = null
}

/** Whether the node search overlay is visible */
export const nodeSearchVisible = signal<boolean>(false)

/** Toggle node search visibility */
export function toggleNodeSearch(): void {
  nodeSearchVisible.value = !nodeSearchVisible.value
}

/** Show node search */
export function showNodeSearch(): void {
  nodeSearchVisible.value = true
}

/** Hide node search */
export function hideNodeSearch(): void {
  nodeSearchVisible.value = false
}

/** Batch action toolbar state */
export const batchToolbarState = signal<{ x: number; y: number; count: number } | null>(null)

/** Show the batch action toolbar */
export function showBatchToolbar(x: number, y: number, count: number): void {
  batchToolbarState.value = { x, y, count }
}

/** Hide the batch action toolbar */
export function hideBatchToolbar(): void {
  batchToolbarState.value = null
}
