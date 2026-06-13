import { h } from 'preact'
import { useState } from 'preact/hooks'
import { Settings, ToggleLeft, ToggleRight, Bug, X, ChevronRight } from 'lucide-preact'
import { selectedNodeId, setActivePanelTab } from '../../store/editorStore'

const bubbleStyle = {
  position: 'absolute',
  zIndex: 'var(--rf-z-popover, 300)',
  background: 'var(--rf-bg-elevated, #ffffff)',
  border: '1px solid var(--rf-border, #e5e7eb)',
  borderRadius: 'var(--rf-radius-lg, 8px)',
  boxShadow: 'var(--rf-shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))',
  padding: 0,
  minWidth: 200,
  maxWidth: 260,
  animation: 'rf-fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
}

const headerStyle = (colorVar) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 10px',
  borderBottom: '1px solid var(--rf-border-light, #f3f4f6)',
  fontSize: 'var(--rf-text-sm, 11px)',
  fontWeight: 600,
  color: 'var(--rf-text-primary, #111827)',
})

const bodyStyle = {
  padding: '8px 10px',
  fontSize: 'var(--rf-text-sm, 11px)',
  color: 'var(--rf-text-secondary, #6b7280)',
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 0',
}

const actionBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px',
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-secondary, #6b7280)',
  fontSize: 'var(--rf-text-sm, 11px)',
  cursor: 'pointer',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
  width: '100%',
  borderRadius: 0,
  borderTop: '1px solid var(--rf-border-light, #f3f4f6)',
  transition: 'background 120ms',
}

const NODE_COLORS = {
  input_port: '--rf-node-input',
  output_port: '--rf-node-output',
  rule: '--rf-node-rule',
  condition: '--rf-node-condition',
  action: '--rf-node-action',
  sub_chain: '--rf-node-subchain',
  note: '--rf-node-note',
}

export function PropertyBubble({ x, y, nodeData, onClose, onOpenPanel }) {
  if (!nodeData) return null

  const { text, properties } = nodeData
  const nodeType = properties?.nodeType || 'rule'
  const colorVar = NODE_COLORS[nodeType] || '--rf-node-rule'
  const priority = properties?.priority || 1
  const enabled = properties?.enabled !== false

  // Adjust position
  const adjustedX = Math.min(x + 20, window.innerWidth - 280)
  const adjustedY = Math.min(y - 40, window.innerHeight - 200)

  return (
    <div style={{ ...bubbleStyle, left: adjustedX, top: adjustedY }}>
      {/* Header with color bar */}
      <div style={headerStyle(colorVar)}>
        <div style={{
          width: 4,
          height: 14,
          borderRadius: 2,
          background: `var(${colorVar})`,
          flexShrink: 0,
        }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text?.value || text || nodeType}
        </span>
        <span style={{
          padding: '1px 6px',
          borderRadius: 'var(--rf-radius-sm, 4px)',
          background: `var(${colorVar}-light, var(--rf-brand-primary-light))`,
          color: `var(${colorVar})`,
          fontSize: 'var(--rf-text-2xs, 9px)',
          fontWeight: 700,
          fontFamily: 'var(--rf-font-mono, monospace)',
        }}>P:{priority}</span>
        <button
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, border: 'none', background: 'transparent', color: 'var(--rf-text-tertiary)', cursor: 'pointer', padding: 0, borderRadius: 'var(--rf-radius-sm)' }}
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={11} />
        </button>
      </div>

      {/* Summary */}
      <div style={bodyStyle}>
        {properties?.summary && (
          <div style={{ marginBottom: 4, color: 'var(--rf-text-primary)', fontWeight: 500 }}>
            {properties.summary}
          </div>
        )}
        <div style={rowStyle}>
          <span>启用状态</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: enabled ? 'var(--rf-status-success)' : 'var(--rf-text-tertiary)', cursor: 'pointer' }}>
            {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            <span style={{ fontSize: 'var(--rf-text-2xs)' }}>{enabled ? '启用' : '禁用'}</span>
          </div>
        </div>
        <div style={rowStyle}>
          <span>调试模式</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--rf-text-tertiary)', cursor: 'pointer' }}>
            <Bug size={12} />
            <span style={{ fontSize: 'var(--rf-text-2xs)' }}>关闭</span>
          </div>
        </div>
      </div>

      {/* Open panel action */}
      <button
        style={actionBtnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rf-bg-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        onClick={() => onOpenPanel?.()}
      >
        <Settings size={12} />
        <span style={{ flex: 1 }}>查看完整属性</span>
        <ChevronRight size={12} />
      </button>
    </div>
  )
}
