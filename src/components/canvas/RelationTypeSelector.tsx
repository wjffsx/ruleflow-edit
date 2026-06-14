import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import type { RefObject } from 'preact'
import { X } from 'lucide-preact'
import { RELATION_TYPES } from '../../data'
import { calculateSimplePosition } from '../../services'

/** 关系类型选择器属性 */
interface RelationTypeSelectorProps {
  /** 选择器 X 坐标 */
  x: number
  /** 选择器 Y 坐标 */
  y: number
  /** 边 ID */
  edgeId: string
  /** 选择关系类型回调 */
  onSelect: (edgeId: string, relationType: string) => void
  /** 关闭回调 */
  onClose: () => void
}

/** 关系类型选择器组件 */
export function RelationTypeSelector({
  x,
  y,
  edgeId,
  onSelect,
  onClose,
}: RelationTypeSelectorProps) {
  const ref: RefObject<HTMLDivElement> = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Use floating position service
  const position = calculateSimplePosition(x, y, 200, 250, 8)

  return (
    <div
      ref={ref}
      class="absolute z-[var(--rf-z-popover,300)] bg-[var(--rf-bg-elevated,#ffffff)] border border-[var(--rf-border,#e5e7eb)] rounded-[var(--rf-radius-lg,8px)] shadow-[var(--rf-shadow-lg,0_10px_15px_-3px_rgba(0,0,0,0.1))] p-[var(--rf-space-2,8px)] min-w-[160px] rf-fade-in"
      style={{ left: position.x, top: position.y }}
    >
      <div class="flex items-center justify-between px-2 py-1 text-[var(--rf-text-sm,11px)] font-semibold text-[var(--rf-text-secondary,#6b7280)] mb-1">
        <span>选择关系类型</span>
        <button
          class="flex items-center justify-center w-5 h-5 border-none bg-transparent text-[var(--rf-text-tertiary,#9ca3af)] cursor-pointer rounded-[var(--rf-radius-sm,4px)] p-0 hover:bg-[var(--rf-bg-hover)]"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={12} />
        </button>
      </div>
      {RELATION_TYPES.map(({ key, label, colorVar, lightColorVar }) => (
        <button
          key={key}
          class="flex items-center gap-[var(--rf-space-2,8px)] px-2.5 py-1.5 border-none bg-transparent text-[var(--rf-text-primary,#111827)] rounded-[var(--rf-radius-sm,4px)] cursor-pointer text-[var(--rf-text-sm,11px)] font-[var(--rf-font-sans,sans-serif)] w-full text-left transition-[background] duration-120 hover:bg-[var(--rf-bg-hover)]"
          onClick={() => onSelect?.(edgeId, key)}
        >
          <div
            class="w-2.5 h-2.5 rounded-[var(--rf-radius-full,9999px)] shrink-0"
            style={{
              background: `var(${colorVar})`,
              boxShadow: `0 0 0 2px var(${lightColorVar})`,
            }}
          />
          <span class="flex-1 font-medium">{label}</span>
          <span
            class="text-[var(--rf-text-2xs,9px)] font-[var(--rf-font-mono,monospace)]"
            style={{ color: `var(${colorVar})` }}
          >
            {key}
          </span>
        </button>
      ))}
    </div>
  )
}
