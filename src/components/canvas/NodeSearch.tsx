import { h } from 'preact'
import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import type { RefObject } from 'preact'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-preact'
// P0-opt: 直接从具体文件导入，避免 services/index.ts 被静态导入
import { searchService } from '../../services/searchService'

/** Node data for search */
interface SearchableNode {
  id: string
  [key: string]: unknown
}

/** 节点搜索组件属性 */
interface NodeSearchProps {
  /** 节点列表 */
  nodes: SearchableNode[]
  /** 关闭回调 */
  onClose: () => void
  /** 定位节点回调 */
  onLocateNode: (nodeId: string) => void
}

/** 节点搜索组件 */
export function NodeSearch({ nodes, onClose, onLocateNode }: NodeSearchProps) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef: RefObject<HTMLInputElement> = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Update search service index when nodes change
    if (nodes && nodes.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchService.updateNodeIndex(nodes as any[])
    }
  }, [nodes])

  const results = useMemo(() => {
    if (!query.trim()) return []

    return searchService.searchNodes(query) as SearchableNode[]
  }, [query, nodes])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (results.length === 0) return
      const nextIdx = e.shiftKey
        ? (currentIndex - 1 + results.length) % results.length
        : (currentIndex + 1) % results.length
      setCurrentIndex(nextIdx)
      onLocateNode?.(results[nextIdx].id)
    } else if (e.key === 'Escape') {
      onClose?.()
    }
  }

  const handleInput = (e: Event) => {
    const newQuery = (e.target as HTMLInputElement).value
    setQuery(newQuery)
    setCurrentIndex(0)
  }

  const navigatePrev = () => {
    if (results.length === 0) return
    const idx = (currentIndex - 1 + results.length) % results.length
    setCurrentIndex(idx)
    onLocateNode?.(results[idx].id)
  }

  const navigateNext = () => {
    if (results.length === 0) return
    const idx = (currentIndex + 1) % results.length
    setCurrentIndex(idx)
    onLocateNode?.(results[idx].id)
  }

  return (
    <div
      class="absolute top-2 left-1/2 -translate-x-1/2 z-[var(--rf-z-popover,300)] bg-[var(--rf-bg-elevated,#ffffff)] border border-[var(--rf-border,#e5e7eb)] rounded-[var(--rf-radius-lg,8px)] shadow-[var(--rf-shadow-md,0_4px_6px_-2px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.06))] flex items-center gap-1.5 px-2.5 py-1.5 min-w-[240px] max-w-[360px]"
      role="search"
      aria-label="搜索节点"
    >
      <Search size={14} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        class="flex-1 border border-[var(--rf-border)] rounded-[var(--rf-radius-sm)] bg-[var(--rf-bg-secondary)] text-[var(--rf-text-primary)] text-[var(--rf-text-sm)] font-[var(--rf-font-sans)] outline-none placeholder-[var(--rf-text-tertiary)] px-1.5 py-0.5"
        placeholder="搜索节点..."
        value={query}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        aria-label="搜索节点名称"
      />
      {query && results.length > 0 && (
        <span class="text-[var(--rf-text-2xs,9px)] text-[var(--rf-text-tertiary,#9ca3af)] whitespace-nowrap min-w-[40px] text-center">
          {currentIndex + 1}/{results.length}
        </span>
      )}
      {query && results.length === 0 && (
        <span class="text-[var(--rf-text-2xs,9px)] text-[var(--rf-text-tertiary,#9ca3af)] whitespace-nowrap min-w-[40px] text-center">
          无结果
        </span>
      )}
      <button
        class="flex items-center justify-center w-6 h-6 border-none bg-transparent text-[var(--rf-text-tertiary,#9ca3af)] cursor-pointer rounded-[var(--rf-radius-sm)] p-0 shrink-0 hover:bg-[var(--rf-bg-tertiary,#f3f4f6)]"
        onClick={navigatePrev}
        title="上一个"
        aria-label="上一个匹配"
      >
        <ChevronUp size={14} />
      </button>
      <button
        class="flex items-center justify-center w-6 h-6 border-none bg-transparent text-[var(--rf-text-tertiary,#9ca3af)] cursor-pointer rounded-[var(--rf-radius-sm)] p-0 shrink-0 hover:bg-[var(--rf-bg-tertiary,#f3f4f6)]"
        onClick={navigateNext}
        title="下一个"
        aria-label="下一个匹配"
      >
        <ChevronDown size={14} />
      </button>
      <button
        class="flex items-center justify-center w-6 h-6 border-none bg-transparent text-[var(--rf-text-tertiary,#9ca3af)] cursor-pointer rounded-[var(--rf-radius-sm)] p-0 shrink-0 hover:bg-[var(--rf-bg-tertiary,#f3f4f6)]"
        onClick={onClose}
        title="关闭"
        aria-label="关闭搜索"
      >
        <X size={14} />
      </button>
    </div>
  )
}
