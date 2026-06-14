import { h } from 'preact'
import { Copy, Trash2, ToggleLeft, Group, Ungroup } from 'lucide-preact'
import { calculateSimplePosition } from '../../services'

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
      class="absolute z-[var(--rf-z-toolbar,200)] bg-[var(--rf-bg-elevated,#ffffff)] border border-[var(--rf-border,#e5e7eb)] rounded-[var(--rf-radius-lg,8px)] shadow-[var(--rf-shadow-md,0_4px_6px_-1px_rgba(0,0,0,0.1))] flex items-center gap-0.5 px-1.5 py-1 rf-fade-in"
      style={{ left: position.x, top: position.y }}
      role="toolbar"
      aria-label="批量操作"
    >
      <button
        class="flex items-center justify-center w-8 h-8 border-none bg-transparent text-[var(--rf-text-secondary,#6b7280)] cursor-pointer rounded-[var(--rf-radius-sm,4px)] p-0 transition-all duration-120 hover:bg-[var(--rf-bg-hover)] hover:text-[var(--rf-text-primary)]"
        onClick={onCopy}
        title="复制"
        aria-label="复制选中节点"
      >
        <Copy size={15} />
      </button>
      <button
        class="flex items-center justify-center w-8 h-8 border-none bg-transparent text-[var(--rf-text-secondary,#6b7280)] cursor-pointer rounded-[var(--rf-radius-sm,4px)] p-0 transition-all duration-120 hover:bg-[var(--rf-bg-hover)] hover:text-[var(--rf-text-primary)]"
        onClick={onToggleEnable}
        title="启用/禁用"
        aria-label="切换启用状态"
      >
        <ToggleLeft size={15} />
      </button>
      <button
        class="flex items-center justify-center w-8 h-8 border-none bg-transparent text-[var(--rf-text-secondary,#6b7280)] cursor-pointer rounded-[var(--rf-radius-sm,4px)] p-0 transition-all duration-120 hover:bg-[var(--rf-bg-hover)] hover:text-[var(--rf-text-primary)]"
        onClick={onGroup}
        title="分组"
        aria-label="创建分组"
      >
        <Group size={15} />
      </button>
      <div class="w-px h-5 bg-[var(--rf-border,#e5e7eb)] mx-0.5" />
      <button
        class="flex items-center justify-center w-8 h-8 border-none bg-transparent text-[var(--rf-status-danger)] cursor-pointer rounded-[var(--rf-radius-sm,4px)] p-0 transition-all duration-120 hover:bg-[var(--rf-status-danger-light)] hover:text-[var(--rf-status-danger)]"
        onClick={onDelete}
        title="删除"
        aria-label="删除选中节点"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
