import { h } from 'preact'
import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import type { RefObject } from 'preact'
import type { LucideIcon } from 'lucide-preact'
import {
  Search,
  FileText,
  Play,
  Settings,
  Download,
  Upload,
  Palette,
  Keyboard,
  X,
} from 'lucide-preact'
import { searchService } from '../../services'
import type { CommandItem as SearchCommandItem } from '../../types/editor'
import s from './CommandPalette.module.css'

/** 内部命令项定义（含图标组件） */
interface InternalCommandItem {
  id: string
  label: string
  icon: LucideIcon
  category: string
  shortcut: string
}

// Commands registry
const COMMANDS: InternalCommandItem[] = [
  { id: 'run', label: '运行规则链', icon: Play, category: '运行', shortcut: 'F5' },
  { id: 'stop', label: '停止运行', icon: X, category: '运行', shortcut: 'Shift+F5' },
  { id: 'save', label: '保存规则链', icon: FileText, category: '文件', shortcut: 'Ctrl+S' },
  { id: 'export', label: '导出 JSON', icon: Upload, category: '文件', shortcut: '' },
  { id: 'import', label: '导入规则链', icon: Download, category: '文件', shortcut: '' },
  { id: 'theme', label: '切换主题', icon: Palette, category: '设置', shortcut: '' },
  { id: 'shortcuts', label: '快捷键帮助', icon: Keyboard, category: '设置', shortcut: '' },
  { id: 'settings', label: '编辑器设置', icon: Settings, category: '设置', shortcut: '' },
]

/** 命令面板属性 */
interface CommandPaletteProps {
  /** 关闭回调 */
  onClose: () => void
  /** 执行命令回调 */
  onExecuteCommand: (cmdId: string) => void
}

/** 命令面板组件 */
export function CommandPalette({ onClose, onExecuteCommand }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef: RefObject<HTMLInputElement> = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Register commands with searchService (map to SearchCommandItem format)
    const searchItems: SearchCommandItem[] = COMMANDS.map((cmd) => ({
      id: cmd.id,
      label: cmd.label,
      category: cmd.category,
      icon: cmd.id,
      shortcut: cmd.shortcut || undefined,
    }))
    searchService.updateCommandIndex(searchItems)
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return COMMANDS
    // Search returns SearchCommandItem, map back to InternalCommandItem
    const searchResults = searchService.searchCommands(query)
    return searchResults
      .map((r) => COMMANDS.find((c) => c.id === r.id))
      .filter((c): c is InternalCommandItem => c !== undefined)
  }, [query])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, InternalCommandItem[]> = {}
    results.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [results])

  const handleKeyDown = (e: KeyboardEvent) => {
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
    <div
      class={s.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div class={s.panel}>
        <div class={s.inputContainer}>
          <Search size={16} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            class={s.searchInput}
            placeholder="输入命令或搜索..."
            value={query}
            onInput={(e) => {
              setQuery((e.target as HTMLInputElement).value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            aria-label="命令搜索"
          />
        </div>
        <div class={s.list} role="listbox">
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div class={s.categoryLabel}>{category}</div>
              {cmds.map((cmd) => {
                flatIdx++
                const isCurrent = flatIdx === activeIndex
                const CmdIcon = cmd.icon
                return (
                  <div
                    key={cmd.id}
                    class={`${s.commandItem} ${isCurrent ? s.commandItemActive : ''}`}
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => {
                      onExecuteCommand?.(cmd.id)
                      onClose?.()
                    }}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                  >
                    <div class={s.itemIcon}>
                      <CmdIcon size={14} style={{ color: 'var(--rf-text-secondary)' }} />
                    </div>
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    {cmd.shortcut && <span class={s.itemShortcut}>{cmd.shortcut}</span>}
                  </div>
                )
              })}
            </div>
          ))}
          {results.length === 0 && <div class={s.noResults}>未找到匹配命令</div>}
        </div>
      </div>
    </div>
  )
}
