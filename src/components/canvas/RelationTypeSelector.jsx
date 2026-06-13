import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { X } from 'lucide-preact'
import { RELATION_TYPES } from '../../data/nodeRegistry'
import { calculateSimplePosition } from '../../services/floatingPosition'

const overlayStyle = {
  position: 'absolute',
  zIndex: 'var(--rf-z-popover, 300)',
  background: 'var(--rf-bg-elevated, #ffffff)',
  border: '1px solid var(--rf-border, #e5e7eb)',
  borderRadius: 'var(--rf-radius-lg, 8px)',
  boxShadow: 'var(--rf-shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
  padding: 'var(--rf-space-2, 8px)',
  minWidth: 160,
  animation: 'rf-fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 8px',
  fontSize: 'var(--rf-text-sm, 11px)',
  fontWeight: 600,
  color: 'var(--rf-text-secondary, #6b7280)',
  marginBottom: 4,
}

const closeBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-tertiary, #9ca3af)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  padding: 0,
}

const optionStyle = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2, 8px)',
  padding: '6px 10px',
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-primary, #111827)',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  cursor: 'pointer',
  fontSize: 'var(--rf-text-sm, 11px)',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
  width: '100%',
  textAlign: 'left',
  transition: 'background 120ms ease',
})

export function RelationTypeSelector({ x, y, edgeId, onSelect, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Use floating position service
  const position = calculateSimplePosition(x, y, 200, 250, 8)

  return (
    <div ref={ref} style={{ ...overlayStyle, left: position.x, top: position.y }}>
      <div style={headerStyle}>
        <span>选择关系类型</span>
        <button style={closeBtnStyle} onClick={onClose} aria-label="关闭">
          <X size={12} />
        </button>
      </div>
      {RELATION_TYPES.map(({ key, label, colorVar, lightColorVar }) => (
        <button
          key={key}
          style={optionStyle(colorVar)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `var(${lightColorVar})`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          onClick={() => onSelect?.(edgeId, key)}
        >
          <div style={{
            width: 10,
            height: 10,
            borderRadius: 'var(--rf-radius-full, 9999px)',
            background: `var(${colorVar})`,
            flexShrink: 0,
            boxShadow: `0 0 0 2px var(${lightColorVar})`,
          }} />
          <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
          <span style={{
            fontSize: 'var(--rf-text-2xs, 9px)',
            color: `var(${colorVar})`,
            fontFamily: 'var(--rf-font-mono, monospace)',
          }}>
            {key}
          </span>
        </button>
      ))}
    </div>
  )
}
