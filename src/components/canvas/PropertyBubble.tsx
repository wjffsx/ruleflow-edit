import { h } from 'preact'
import { Settings, ToggleLeft, ToggleRight, Bug, X, ChevronRight, Activity } from 'lucide-preact'
import { selectedNodeId, setActivePanelTab } from '../../store'
import { calculateSimplePosition } from '../../services'
import { getNodeStyle } from '../../data'
import type { MonitorNodeState } from '../layout/RuleFlowEditor'

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
  /** Monitor state for this node (P1-1) */
  monitorState?: MonitorNodeState
}

/** 属性气泡组件 */
export function PropertyBubble({
  x,
  y,
  nodeData,
  onClose,
  onOpenPanel,
  monitorState,
}: PropertyBubbleProps) {
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
    <div
      class="absolute z-[var(--rf-z-popover,300)] bg-[var(--rf-bg-elevated,#ffffff)] border border-[var(--rf-border,#e5e7eb)] rounded-[var(--rf-radius-lg,8px)] shadow-[var(--rf-shadow-md,0_4px_6px_-1px_rgba(0,0,0,0.1))] p-0 min-w-[200px] max-w-[260px] rf-fade-in font-[var(--rf-font-sans,sans-serif)]"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header with color bar */}
      <div class="flex items-center gap-1.5 px-2.5 py-2 border-b border-[var(--rf-border-light,#f3f4f6)] text-[var(--rf-text-sm,11px)] font-semibold text-[var(--rf-text-primary,#111827)]">
        <div class="w-1 h-3.5 rounded-sm shrink-0" style={{ background: `var(${colorVar})` }} />
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {text?.value || text || nodeType}
        </span>
        <span
          class="px-1.5 py-px rounded-[var(--rf-radius-sm,4px)] text-[var(--rf-text-2xs,9px)] font-bold font-[var(--rf-font-mono,monospace)]"
          style={{
            background: `var(${colorVar}-light, var(--rf-brand-primary-light))`,
            color: `var(${colorVar})`,
          }}
        >
          P:{priority}
        </span>
        <button
          class="flex items-center justify-center w-[18px] h-[18px] border-none bg-transparent text-[var(--rf-text-tertiary)] cursor-pointer p-0 rounded-[var(--rf-radius-sm)] hover:bg-[var(--rf-bg-hover)]"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={11} />
        </button>
      </div>

      {/* Summary */}
      <div class="px-2.5 py-2 text-[var(--rf-text-sm,11px)] text-[var(--rf-text-secondary,#6b7280)]">
        {properties?.summary && (
          <div class="mb-1 text-[var(--rf-text-primary)] font-medium">{properties.summary}</div>
        )}
        <div class="flex items-center justify-between py-1">
          <span>启用状态</span>
          <div
            class="flex items-center gap-1 cursor-pointer"
            style={{ color: enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)' }}
          >
            {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            <span class="text-[var(--rf-text-2xs)]">{enabled ? '启用' : '禁用'}</span>
          </div>
        </div>
        <div class="flex items-center justify-between py-1">
          <span>调试模式</span>
          <div class="flex items-center gap-1" style={{ color: 'var(--rf-text-tertiary)' }}>
            <Bug size={12} />
            <span class="text-[var(--rf-text-2xs)]">关闭</span>
          </div>
        </div>
      </div>

      {/* P1-1: Monitor metrics section */}
      {monitorState && (
        <div class="px-2.5 py-1.5 border-t border-[var(--rf-border-light,#f3f4f6)]">
          <div
            class="flex items-center gap-1 mb-1 text-[var(--rf-text-2xs,9px)] font-semibold"
            style={{
              color:
                monitorState.status === 'running'
                  ? 'var(--rf-status-success)'
                  : monitorState.status === 'error'
                    ? 'var(--rf-status-danger)'
                    : 'var(--rf-text-tertiary)',
            }}
          >
            <Activity size={10} />
            {monitorState.status === 'running'
              ? '运行中'
              : monitorState.status === 'error'
                ? '错误'
                : monitorState.status === 'disabled'
                  ? '已禁用'
                  : '空闲'}
          </div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[var(--rf-text-2xs,9px)] font-[var(--rf-font-mono,monospace)]">
            {monitorState.evalCount !== undefined && (
              <div class="flex justify-between">
                <span class="text-[var(--rf-text-tertiary)]">eval</span>
                <span class="text-[var(--rf-text-primary)]">{monitorState.evalCount}</span>
              </div>
            )}
            {monitorState.matchCount !== undefined && (
              <div class="flex justify-between">
                <span class="text-[var(--rf-text-tertiary)]">match</span>
                <span class="text-[var(--rf-text-primary)]">{monitorState.matchCount}</span>
              </div>
            )}
            {monitorState.errorCount !== undefined && (
              <div class="flex justify-between">
                <span class="text-[var(--rf-text-tertiary)]">err</span>
                <span
                  style={{
                    color:
                      monitorState.errorCount > 0
                        ? 'var(--rf-status-danger)'
                        : 'var(--rf-text-primary)',
                  }}
                >
                  {monitorState.errorCount}
                </span>
              </div>
            )}
            {monitorState.avgLatencyMs !== undefined && (
              <div class="flex justify-between">
                <span class="text-[var(--rf-text-tertiary)]">latency</span>
                <span class="text-[var(--rf-text-primary)]">
                  {monitorState.avgLatencyMs.toFixed(1)}ms
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open panel action */}
      <button
        class="flex items-center gap-1 px-2.5 py-1.5 border-none bg-transparent text-[var(--rf-text-secondary,#6b7280)] text-[var(--rf-text-sm,11px)] cursor-pointer font-[var(--rf-font-sans,sans-serif)] w-full rounded-none border-t border-[var(--rf-border-light,#f3f4f6)] transition-[background] duration-120 hover:bg-[var(--rf-bg-hover)]"
        onClick={() => onOpenPanel?.()}
      >
        <Settings size={12} />
        <span style={{ flex: 1 }}>查看完整属性</span>
        <ChevronRight size={12} />
      </button>
    </div>
  )
}
