import {
  LogicFlow,
  type GraphData,
  type NodeData,
  type NodeClickEvent,
  type EdgeAddEvent,
  type SelectionEvent,
} from '@logicflow/core'
import {
  nodeCount,
  edgeCount,
  setZoom,
  selectedNodeId,
  showRelationSelector,
  showPropertyBubble,
  hidePropertyBubble,
  hideBatchToolbar,
  showBatchToolbar,
  selectedNodeIds,
  outlineNodes,
  syncHistoryState,
} from '../../store'

/** Detect if adding target→source would create a cycle via DFS */
function detectCycle(lf: LogicFlow, sourceNodeId: string, targetNodeId: string): boolean {
  const visited = new Set<string>()
  const stack = [targetNodeId]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === sourceNodeId) return true
    if (visited.has(current)) continue
    visited.add(current)
    try {
      const edges = lf.getGraphData().edges || []
      for (const e of edges) {
        if (e.sourceNodeId === current) stack.push(e.targetNodeId)
      }
    } catch (_e) {
      break
    }
  }
  return false
}

/** Setup all LogicFlow event handlers. Returns a cleanup function. */
export function setupLogicFlowEvents(
  lf: LogicFlow,
  setIsEmpty: (v: boolean) => void,
  setAllNodes: (v: NodeData[]) => void,
): () => void {
  // Debounced graph update handler
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const debouncedUpdate = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      try {
        const data = lf.getGraphData() as GraphData
        const newNodes: NodeData[] = data?.nodes || []
        // Shallow compare before assigning to avoid unnecessary re-renders
        if (newNodes.length !== outlineNodes.value.length) {
          outlineNodes.value = newNodes
        } else {
          const changed = newNodes.some((n, i) => n.id !== outlineNodes.value[i]?.id)
          if (changed) {
            outlineNodes.value = newNodes
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[RuleFlow] graph data update failed:', e)
      }
    }, 100)
  }

  // Graph updated → update stats & history state (debounced)
  let updateTimer: ReturnType<typeof setTimeout> | null = null
  lf.on('graph:updated', () => {
    if (updateTimer) clearTimeout(updateTimer)
    updateTimer = setTimeout(() => {
      try {
        const data = lf.getGraphData()
        const nc = data?.nodes?.length || 0
        const ec = data?.edges?.length || 0
        if (nodeCount.value !== nc) nodeCount.value = nc
        if (edgeCount.value !== ec) edgeCount.value = ec
        setIsEmpty(nc === 0)
        setAllNodes(data?.nodes || [])
        syncHistoryState()
        debouncedUpdate()
        // 注：text.x/y=null 的边界 case 由序列化时统一拍扁处理（flattenText），
        // graphData 层面的修复不影响 model.text（LogicFlow 视图层），
        // 故此处不再做无效的 model.text 修复。
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[RuleFlow] graph update handler failed:', e)
      }
    }, 50)
  })

  // Node click → select & show property bubble
  lf.on('node:click', ({ data }: NodeClickEvent) => {
    selectedNodeId.value = data.id
    // Show property bubble near clicked node
    try {
      const model = lf.getNodeModelById(data.id)
      if (model) {
        const point = lf.graphModel.transformModel.CanvasPointToHtmlPoint(
          model.x + (model.width || 200) / 2 + 10,
          model.y - (model.height || 80) / 2,
        )
        showPropertyBubble(point.x, point.y, data)
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] property bubble positioning failed:', err)
    }
  })

  // Blank click → deselect
  lf.on('blank:click', () => {
    selectedNodeId.value = null
    selectedNodeIds.value = []
    hidePropertyBubble()
    hideBatchToolbar()
  })

  // Edge creation → validate then show relation type selector
  lf.on('edge:add', ({ data }: EdgeAddEvent) => {
    // Self-loop detection
    if (data.sourceNodeId === data.targetNodeId) {
      try {
        lf.deleteEdge(data.id)
      } catch (_e) {
        /* ignore */
      }
      if (import.meta.env.DEV) console.warn('[RuleFlow] Self-loop edge blocked:', data.id)
      return
    }

    // Cycle detection
    if (detectCycle(lf, data.sourceNodeId, data.targetNodeId)) {
      try {
        lf.deleteEdge(data.id)
      } catch (_e) {
        /* ignore */
      }
      if (import.meta.env.DEV) console.warn('[RuleFlow] Cyclic edge blocked:', data.id)
      return
    }

    // Duplicate edge detection
    try {
      const edges = lf.getGraphData().edges || []
      const duplicate = edges.some(
        (e) =>
          e.id !== data.id &&
          e.sourceNodeId === data.sourceNodeId &&
          e.targetNodeId === data.targetNodeId,
      )
      if (duplicate) {
        lf.deleteEdge(data.id)
        if (import.meta.env.DEV) console.warn('[RuleFlow] Duplicate edge blocked:', data.id)
        return
      }
    } catch (_e) {
      /* ignore */
    }

    try {
      const model = lf.getEdgeModelById(data.id)
      if (model) {
        const startX = model.startPoint?.x || 0
        const startY = model.startPoint?.y || 0
        const endX = model.endPoint?.x || 0
        const endY = model.endPoint?.y || 0
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2
        const point = lf.graphModel.transformModel.CanvasPointToHtmlPoint(midX, midY)
        showRelationSelector(point.x, point.y, data.id)
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] edge creation handler failed:', err)
    }
  })

  // Edge click → deselect node
  lf.on('edge:click', () => {
    selectedNodeId.value = null
  })

  // Transform → update zoom
  lf.on('graph:transform', () => {
    try {
      const zoom = lf.getTransform()
      if (zoom?.SCALE_X) setZoom(Math.round(zoom.SCALE_X * 100))
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[RuleFlow] zoom sync failed:', e)
    }
  })

  // Selection select (multi-select) → show batch toolbar
  lf.on('selection:selected', ({ data }: SelectionEvent) => {
    const nodes = data?.nodes || []
    if (nodes.length >= 2) {
      selectedNodeIds.value = nodes.map((n) => n.id)
      // Calculate bounding box center
      const xs = nodes.map((n) => n.x)
      const ys = nodes.map((n) => n.y)
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2
      const point = lf.graphModel.transformModel.CanvasPointToHtmlPoint(centerX, centerY)
      showBatchToolbar(point.x, point.y, nodes.length)
    }
  })

  // Cleanup: clear pending timers
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (updateTimer) {
      clearTimeout(updateTimer)
      updateTimer = null
    }
    // No explicit lf.off() needed — lf.destroy() handles that
  }
}
