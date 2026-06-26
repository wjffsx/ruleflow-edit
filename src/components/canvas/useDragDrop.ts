import { NODE_VISUAL_MAP, CATEGORY_TO_LF_TYPE } from '../../data'
import { isValidNodeItem, safeJsonParse, generateRuleId } from '../../utils'
import type { LogicGateOp } from '../nodes/LogicGateNode'

/** 视觉类别 → generateRuleId 类型参数 映射 */
const RULE_ID_TYPE_MAP: Record<string, string> = {
  condition: 'condition',
  action: 'action',
  ext: 'action',
  flow: 'node',
  logic_gate: 'logic_gate',
}

/** 视觉类别 → roleInRule 映射 */
const ROLE_MAP: Record<string, string> = {
  condition: 'condition',
  action: 'action',
  ext: 'action',
  flow: 'flow',
  note: 'note',
}

/** Parameters for useDragDrop hook */
interface UseDragDropParams {
  /** Mutable ref holding the LogicFlow instance */
  lfRef: { current: import('@logicflow/core').LogicFlow | null }
  /** Callback to set whether the canvas is empty */
  setIsEmpty: (v: boolean) => void
  /** Read-only mode — disables drop */
  readOnly?: boolean
}

/** Extract the logic gate operator from node type */
function getLogicGateOp(type: string): LogicGateOp | null {
  if (type === 'logic_gate_and') return 'AND'
  if (type === 'logic_gate_or') return 'OR'
  if (type === 'logic_gate_not') return 'NOT'
  return null
}

/** Hook providing drag-drop handlers for adding nodes to the canvas */
export function useDragDrop({ lfRef, setIsEmpty, readOnly = false }: UseDragDropParams) {
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    if (readOnly) return
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

      // Build properties
      const properties: Record<string, unknown> = {
        nodeType: visualCategory,
        icon: item.icon,
        priority: 1,
        enabled: true,
      }

      // 非端口/非注释节点：设置 ruleId + roleInRule
      if (visualCategory !== 'port' && visualCategory !== 'note') {
        const ridType = RULE_ID_TYPE_MAP[visualCategory as string]
        if (ridType) {
          properties.ruleId = generateRuleId(ridType)
        }
        const role = ROLE_MAP[visualCategory as string]
        if (role) {
          properties.roleInRule = role
        }
      }

      // Port node specific properties
      if (item.type === 'input_port') {
        properties.roleInRule = 'input'
        properties.pointName = `${item.type}_${Date.now()}`
        properties.displayName = item.name
        properties.pointType = 'analog'
        properties.dataType = 'double'
      } else if (item.type === 'output_port') {
        properties.roleInRule = 'output'
        properties.pointName = `${item.type}_${Date.now()}`
        properties.displayName = item.name
        properties.pointType = 'virtual'
        properties.dataType = 'double'
        properties.scope = 'per_device'
      }

      // Add logic gate specific properties
      const gateOp = getLogicGateOp(item.type as string)
      if (gateOp) {
        properties.conditionOp = gateOp
        properties.roleInRule = 'logic_gate'
        properties.collapsed = false
        properties.childCount = 0
      }

      lf.addNode({
        id: `${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: lfType,
        x: point.x,
        y: point.y,
        text: item.name,
        properties,
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
