import { h } from 'preact'
import { Settings, ToggleLeft, ToggleRight, Bug, X, ChevronRight } from 'lucide-preact'
import { selectedNodeId, setActivePanelTab } from '../../store'
import { calculateSimplePosition } from '../../services'
import { getNodeStyle } from '../../data'
import s from './PropertyBubble.module.css'

/** 属性气泡组件属性 */
interface PropertyBubbleProps {
  /** 气泡 X 坐标 */
  x: number
  /** 气泡 Y 坐标 */
  y: number
  /** 节点数据 */
  nodeData: any
  /** 关闭回调 */
  onClose: () => void
  /** 打开面板回调 */
  onOpenPanel: () => void
}

/** 属性气泡组件 */
export function PropertyBubble({ x, y, nodeData, onClose, onOpenPanel }: PropertyBubbleProps) {
  if (!nodeData) return null

  const { text, properties } = nodeData
  const nodeType = properties?.nodeType || 'rule'
  const styleInfo = getNodeStyle(nodeType)
  const colorVar = styleInfo.colorVar
  const priority = properties?.priority || 1
  const enabled = properties?.enabled !== false

  // Use floating position service
  const position = calculateSimplePosition(x, y, 260, 200, 20)

  return (
    <div class={s.bubble} style={{ left: position.x, top: position.y }}>
      {/* Header with color bar */}
      <div class={s.header}>
        <div class={s.colorBar} style={{ background: `var(${colorVar})` }} />
        <span class={s.headerText}>{text?.value || text || nodeType}</span>
        <span
          class={s.priorityBadge}
          style={{
            background: `var(${colorVar}-light, var(--rf-brand-primary-light))`,
            color: `var(${colorVar})`,
          }}
        >
          P:{priority}
        </span>
        <button class={s.closeBtn} onClick={onClose} aria-label="关闭">
          <X size={11} />
        </button>
      </div>

      {/* Summary */}
      <div class={s.body}>
        {properties?.summary && <div class={s.summary}>{properties.summary}</div>}
        <div class={s.row}>
          <span>启用状态</span>
          <div
            class={s.toggleWrap}
            style={{ color: enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)' }}
          >
            {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            <span class={s.toggleLabel}>{enabled ? '启用' : '禁用'}</span>
          </div>
        </div>
        <div class={s.row}>
          <span>调试模式</span>
          <div class={s.toggleWrap} style={{ color: 'var(--rf-text-tertiary)' }}>
            <Bug size={12} />
            <span class={s.toggleLabel}>关闭</span>
          </div>
        </div>
      </div>

      {/* Open panel action */}
      <button class={s.actionBtn} onClick={() => onOpenPanel?.()}>
        <Settings size={12} />
        <span style={{ flex: 1 }}>查看完整属性</span>
        <ChevronRight size={12} />
      </button>
    </div>
  )
}
