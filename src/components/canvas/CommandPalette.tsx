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
// P0-opt: 直接从具体文件导入，避免 services/index.ts 被静态导入
import { searchService } from '../../services/searchService'
import type { CommandItem as SearchCommandItem } from '../../types/editor'

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
      class="absolute inset-0 z-[var(--rf-z-modal,400)] flex justify-center pt-20 bg-black/30 rf-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div class="w-[520px] max-w-[90%] bg-[var(--rf-bg-elevated,#ffffff)] border border-[var(--rf-border,#e5e7eb)] rounded-[var(--rf-radius-xl,12px)] shadow-[var(--rf-shadow-xl,0_20px_25px_-5px_rgba(0,0,0,0.1))] overflow-hidden font-[var(--rf-font-sans,sans-serif)] max-h-[400px]">
        <div class="flex items-center gap-[var(--rf-space-2,8px)] px-[var(--rf-space-3,12px)] py-[var(--rf-space-4,16px)] border-b border-[var(--rf-border-light,#f3f4f6)]">
          <Search size={16} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            class="flex-1 border-none bg-transparent text-[var(--rf-text-md,14px)] font-[var(--rf-font-sans)] outline-none text-[var(--rf-text-primary)] placeholder:text-[var(--rf-text-tertiary)]"
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
        <div class="max-h-[300px] overflow-y-auto py-[var(--rf-space-1,4px)]" role="listbox">
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div class="px-[var(--rf-space-4,16px)] py-1.5 text-[var(--rf-text-2xs,9px)] font-semibold text-[var(--rf-text-tertiary,#9ca3af)] uppercase tracking-wide">
                {category}
              </div>
              {cmds.map((cmd) => {
                flatIdx++
                const isCurrent = flatIdx === activeIndex
                const CmdIcon = cmd.icon
                return (
                  <div
                    key={cmd.id}
                    class={`flex items-center gap-[var(--rf-space-3,12px)] px-[var(--rf-space-4,16px)] py-2 cursor-pointer text-[var(--rf-text-primary)] text-[var(--rf-text-sm,11px)] transition-[background] duration-80 ${isCurrent ? 'bg-[var(--rf-brand-primary-light,#eff6ff)] text-[var(--rf-brand-primary)]' : 'bg-transparent hover:bg-[var(--rf-bg-hover)]'}`}
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => {
                      onExecuteCommand?.(cmd.id)
                      onClose?.()
                    }}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                  >
                    <div class="w-7 h-7 flex items-center justify-center rounded-[var(--rf-radius-sm,4px)] bg-[var(--rf-bg-secondary,#f3f4f6)] shrink-0">
                      <CmdIcon size={14} style={{ color: 'var(--rf-text-secondary)' }} />
                    </div>
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    {cmd.shortcut && (
                      <span class="text-[var(--rf-text-2xs,9px)] text-[var(--rf-text-tertiary,#9ca3af)] font-[var(--rf-font-mono,monospace)] px-1.5 py-0.5 rounded-[var(--rf-radius-sm,4px)] border border-[var(--rf-border,#e5e7eb)]">
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          {results.length === 0 && (
            <div class="py-[var(--rf-space-6,24px)] text-center text-[var(--rf-text-tertiary)] text-[var(--rf-text-sm,11px)]">
              未找到匹配命令
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
