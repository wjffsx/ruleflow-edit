import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import type { RefObject } from 'preact'
import { X } from 'lucide-preact'
import { RELATION_TYPES } from '../../data'
import { calculateSimplePosition } from '../../services'
import s from './RelationTypeSelector.module.css'

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
    <div ref={ref} class={s.overlay} style={{ left: position.x, top: position.y }}>
      <div class={s.header}>
        <span>选择关系类型</span>
        <button class={s.closeBtn} onClick={onClose} aria-label="关闭">
          <X size={12} />
        </button>
      </div>
      {RELATION_TYPES.map(({ key, label, colorVar, lightColorVar }) => (
        <button key={key} class={s.option} onClick={() => onSelect?.(edgeId, key)}>
          <div
            class={s.optionDot}
            style={{
              background: `var(${colorVar})`,
              boxShadow: `0 0 0 2px var(${lightColorVar})`,
            }}
          />
          <span class={s.optionLabel}>{label}</span>
          <span class={s.optionKey} style={{ color: `var(${colorVar})` }}>
            {key}
          </span>
        </button>
      ))}
    </div>
  )
}
