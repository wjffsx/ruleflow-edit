import { h } from 'preact'
import { Copy, Trash2, ToggleLeft, Group, Ungroup } from 'lucide-preact'
import { calculateSimplePosition } from '../../services/floatingPosition'

const toolbarStyle = {
  position: 'absolute',
  zIndex: 'var(--rf-z-toolbar, 200)',
  background: 'var(--rf-bg-elevated, #ffffff)',
  border: '1px solid var(--rf-border, #e5e7eb)',
  borderRadius: 'var(--rf-radius-lg, 8px)',
  boxShadow: 'var(--rf-shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '4px 6px',
  animation: 'rf-fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)',
}

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-secondary, #6b7280)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  padding: 0,
  transition: 'all 120ms',
}

const dividerStyle = {
  width: 1,
  height: 20,
  background: 'var(--rf-border, #e5e7eb)',
  margin: '0 2px',
}

export function BatchActionToolbar({ x, y, selectedCount, onCopy, onDelete, onToggleEnable, onGroup }) {
  if (!selectedCount || selectedCount < 2) return null

  // Use floating position service
  const position = calculateSimplePosition(x, y, 260, 50, 0)

  return (
    <div style={{ ...toolbarStyle, left: position.x, top: position.y }} role="toolbar" aria-label="批量操作">
      <button style={btnStyle} onClick={onCopy} title="复制" aria-label="复制选中节点"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rf-bg-hover)'; e.currentTarget.style.color = 'var(--rf-text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rf-text-secondary)' }}
      >
        <Copy size={15} />
      </button>
      <button style={btnStyle} onClick={onToggleEnable} title="启用/禁用" aria-label="切换启用状态"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rf-bg-hover)'; e.currentTarget.style.color = 'var(--rf-text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rf-text-secondary)' }}
      >
        <ToggleLeft size={15} />
      </button>
      <button style={btnStyle} onClick={onGroup} title="分组" aria-label="创建分组"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rf-bg-hover)'; e.currentTarget.style.color = 'var(--rf-text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rf-text-secondary)' }}
      >
        <Group size={15} />
      </button>
      <div style={dividerStyle} />
      <button style={{ ...btnStyle, color: 'var(--rf-status-danger)' }} onClick={onDelete} title="删除" aria-label="删除选中节点"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rf-status-danger-light)'; e.currentTarget.style.color = 'var(--rf-status-danger)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rf-status-danger)' }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
