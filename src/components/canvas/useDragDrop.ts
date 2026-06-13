import type { LogicFlow } from '@logicflow/core'
import { NODE_VISUAL_MAP, CATEGORY_TO_LF_TYPE } from '../../data'
import { isValidNodeItem, safeJsonParse } from '../../utils'

/** Parameters for useDragDrop hook */
interface UseDragDropParams {
  /** Mutable ref holding the LogicFlow instance */
  lfRef: { current: LogicFlow | null }
  /** Callback to set whether the canvas is empty */
  setIsEmpty: (v: boolean) => void
}

/** Hook providing drag-drop handlers for adding nodes to the canvas */
export function useDragDrop({ lfRef, setIsEmpty }: UseDragDropParams) {
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const lf = lfRef.current
    if (!lf) return
    const nodeData = e.dataTransfer?.getData('application/ruleflow-node')
    if (!nodeData) return
    try {
      const item = safeJsonParse(nodeData, isValidNodeItem)
      if (!item) {
        console.error('Invalid node data from drag-drop')
        return
      }
      const point = lf.getPointByClient(e.clientX, e.clientY)
      const visualCategory = NODE_VISUAL_MAP[item.type as string] || 'action'
      const lfType =
        item.type === 'output_port'
          ? 'rf-output-port'
          : CATEGORY_TO_LF_TYPE[visualCategory as string] || 'rf-action'
      lf.addNode({
        id: `${item.type}_${Date.now()}`,
        type: lfType,
        x: point.x,
        y: point.y,
        text: item.name,
        properties: { nodeType: visualCategory, icon: item.icon, priority: 1, enabled: true },
      })
      setIsEmpty(false)
    } catch (err) {
      console.error('Failed to add node:', err)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  return { handleDrop, handleDragOver }
}
