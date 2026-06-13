import { h } from 'preact'
import { Copy, Trash2, ToggleLeft, Group, Ungroup } from 'lucide-preact'
import { calculateSimplePosition } from '../../services'
import s from './BatchActionToolbar.module.css'

/** 批量操作工具栏属性 */
interface BatchActionToolbarProps {
  /** 工具栏 X 坐标 */
  x: number
  /** 工具栏 Y 坐标 */
  y: number
  /** 选中节点数量 */
  selectedCount: number
  /** 复制回调 */
  onCopy: () => void
  /** 删除回调 */
  onDelete: () => void
  /** 切换启用状态回调 */
  onToggleEnable: () => void
  /** 分组回调 */
  onGroup: () => void
}

/** 批量操作工具栏组件 */
export function BatchActionToolbar({
  x,
  y,
  selectedCount,
  onCopy,
  onDelete,
  onToggleEnable,
  onGroup,
}: BatchActionToolbarProps) {
  if (!selectedCount || selectedCount < 2) return null

  // Use floating position service
  const position = calculateSimplePosition(x, y, 260, 50, 0)

  return (
    <div
      class={s.toolbar}
      style={{ left: position.x, top: position.y }}
      role="toolbar"
      aria-label="批量操作"
    >
      <button class={s.btn} onClick={onCopy} title="复制" aria-label="复制选中节点">
        <Copy size={15} />
      </button>
      <button class={s.btn} onClick={onToggleEnable} title="启用/禁用" aria-label="切换启用状态">
        <ToggleLeft size={15} />
      </button>
      <button class={s.btn} onClick={onGroup} title="分组" aria-label="创建分组">
        <Group size={15} />
      </button>
      <div class={s.divider} />
      <button class={s.btnDanger} onClick={onDelete} title="删除" aria-label="删除选中节点">
        <Trash2 size={15} />
      </button>
    </div>
  )
}
