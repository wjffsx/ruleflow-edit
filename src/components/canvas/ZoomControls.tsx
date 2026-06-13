import { h } from 'preact'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-preact'
import type { LucideIcon } from 'lucide-preact'

/** 画布控制按钮属性 */
interface CanvasControlBtnProps {
  /** 图标组件 */
  icon: LucideIcon
  /** 按钮标题 */
  title: string
  /** 点击回调 */
  onClick: () => void
}

function CanvasControlBtn({ icon: Icon, title, onClick }: CanvasControlBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        border: '1px solid var(--rf-border)',
        borderRadius: 'var(--rf-radius-sm)',
        background: 'var(--rf-bg-primary)',
        color: 'var(--rf-text-secondary)',
        cursor: 'pointer',
        boxShadow: 'var(--rf-shadow-sm)',
      }}
    >
      <Icon size={14} />
    </button>
  )
}

/** 缩放控制组件属性 */
interface ZoomControlsProps {
  /** 放大回调 */
  onZoomIn: () => void
  /** 缩小回调 */
  onZoomOut: () => void
  /** 重置缩放回调 */
  onZoomReset: () => void
}

/** 画布缩放控制组件 */
export function ZoomControls({ onZoomIn, onZoomOut, onZoomReset }: ZoomControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        display: 'flex',
        gap: 4,
        zIndex: 5,
      }}
    >
      <CanvasControlBtn icon={ZoomOut} title="缩小" onClick={onZoomOut} />
      <CanvasControlBtn icon={ZoomIn} title="放大" onClick={onZoomIn} />
      <CanvasControlBtn icon={RotateCcw} title="重置" onClick={onZoomReset} />
    </div>
  )
}
