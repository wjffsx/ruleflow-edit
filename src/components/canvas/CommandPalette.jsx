import { h } from 'preact'
import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import { Search, FileText, Play, Settings, Download, Upload, Palette, Keyboard, X } from 'lucide-preact'
import Fuse from 'fuse.js'

const overlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 'var(--rf-z-modal, 400)',
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 80,
  background: 'rgba(0,0,0,0.3)',
  animation: 'rf-fade-in 150ms ease',
}

const paletteStyle = {
  width: 520,
  maxWidth: '90%',
  background: 'var(--rf-bg-elevated, #ffffff)',
  border: '1px solid var(--rf-border, #e5e7eb)',
  borderRadius: 'var(--rf-radius-xl, 12px)',
  boxShadow: 'var(--rf-shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1))',
  overflow: 'hidden',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
  maxHeight: 400,
}

const inputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2, 8px)',
  padding: 'var(--rf-space-3, 12px) var(--rf-space-4, 16px)',
  borderBottom: '1px solid var(--rf-border-light, #f3f4f6)',
}

const inputStyle = {
  flex: 1,
  height: 28,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-primary, #111827)',
  fontSize: 'var(--rf-text-md, 14px)',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
  outline: 'none',
}

const listStyle = {
  maxHeight: 300,
  overflowY: 'auto',
  padding: 'var(--rf-space-1, 4px) 0',
}

const itemStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-3, 12px)',
  padding: '8px var(--rf-space-4, 16px)',
  cursor: 'pointer',
  background: active ? 'var(--rf-brand-primary-light, #eff6ff)' : 'transparent',
  color: active ? 'var(--rf-brand-primary)' : 'var(--rf-text-primary)',
  fontSize: 'var(--rf-text-sm, 11px)',
  transition: 'background 80ms',
})

const itemIconStyle = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  background: 'var(--rf-bg-secondary, #f3f4f6)',
  flexShrink: 0,
}

const itemShortcutStyle = {
  fontSize: 'var(--rf-text-2xs, 9px)',
  color: 'var(--rf-text-tertiary, #9ca3af)',
  fontFamily: 'var(--rf-font-mono, monospace)',
  padding: '2px 6px',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  border: '1px solid var(--rf-border, #e5e7eb)',
}

const categoryLabelStyle = {
  padding: '6px var(--rf-space-4, 16px)',
  fontSize: 'var(--rf-text-2xs, 9px)',
  fontWeight: 600,
  color: 'var(--rf-text-tertiary, #9ca3af)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

// Commands registry
const COMMANDS = [
  { id: 'run', label: '运行规则链', icon: Play, category: '运行', shortcut: 'F5' },
  { id: 'stop', label: '停止运行', icon: X, category: '运行', shortcut: 'Shift+F5' },
  { id: 'save', label: '保存规则链', icon: FileText, category: '文件', shortcut: 'Ctrl+S' },
  { id: 'export', label: '导出 JSON', icon: Upload, category: '文件', shortcut: '' },
  { id: 'import', label: '导入规则链', icon: Download, category: '文件', shortcut: '' },
  { id: 'theme', label: '切换主题', icon: Palette, category: '设置', shortcut: '' },
  { id: 'shortcuts', label: '快捷键帮助', icon: Keyboard, category: '设置', shortcut: '' },
  { id: 'settings', label: '编辑器设置', icon: Settings, category: '设置', shortcut: '' },
]

export function CommandPalette({ onClose, onExecuteCommand }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search commands
  const fuse = useMemo(() => new Fuse(COMMANDS, {
    keys: ['label', 'category', 'id'],
    threshold: 0.4,
  }), [])

  const results = useMemo(() => {
    if (!query.trim()) return COMMANDS
    return fuse.search(query).map(r => r.item)
  }, [query, fuse])

  // Group by category
  const grouped = useMemo(() => {
    const groups = {}
    results.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [results])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(Math.min(activeIndex + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(Math.max(activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) {
        onExecuteCommand?.(results[activeIndex].id)
        onClose?.()
      }
    } else if (e.key === 'Escape') {
      onClose?.()
    }
  }

  // Flatten grouped items for activeIndex tracking
  let flatIdx = -1

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div style={paletteStyle}>
        <div style={inputContainerStyle}>
          <Search size={16} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            style={inputStyle}
            placeholder="输入命令或搜索..."
            value={query}
            onInput={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            aria-label="命令搜索"
          />
        </div>
        <div style={listStyle} role="listbox">
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div style={categoryLabelStyle}>{category}</div>
              {cmds.map((cmd) => {
                flatIdx++
                const isCurrent = flatIdx === activeIndex
                return (
                  <div
                    key={cmd.id}
                    style={itemStyle(isCurrent)}
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => { onExecuteCommand?.(cmd.id); onClose?.() }}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                  >
                    <div style={itemIconStyle}>
                      <cmd.icon size={14} style={{ color: 'var(--rf-text-secondary)' }} />
                    </div>
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    {cmd.shortcut && <span style={itemShortcutStyle}>{cmd.shortcut}</span>}
                  </div>
                )
              })}
            </div>
          ))}
          {results.length === 0 && (
            <div style={{ padding: 'var(--rf-space-6, 24px)', textAlign: 'center', color: 'var(--rf-text-tertiary)', fontSize: 'var(--rf-text-sm, 11px)' }}>
              未找到匹配命令
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
