import { h } from 'preact'
import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import type { RefObject } from 'preact'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-preact'
import { searchService } from '../../services'
import s from './NodeSearch.module.css'

/** 节点搜索组件属性 */
interface NodeSearchProps {
  /** 节点列表 */
  nodes: any[]
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
      searchService.updateNodeIndex(nodes)
    }
  }, [nodes])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchService.searchNodes(query)
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
    <div class={s.container} role="search" aria-label="搜索节点">
      <Search size={14} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        class={s.searchInput}
        placeholder="搜索节点..."
        value={query}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        aria-label="搜索节点名称"
      />
      {query && results.length > 0 && (
        <span class={s.resultCount}>
          {currentIndex + 1}/{results.length}
        </span>
      )}
      {query && results.length === 0 && <span class={s.resultCount}>无结果</span>}
      <button class={s.iconBtn} onClick={navigatePrev} title="上一个" aria-label="上一个匹配">
        <ChevronUp size={14} />
      </button>
      <button class={s.iconBtn} onClick={navigateNext} title="下一个" aria-label="下一个匹配">
        <ChevronDown size={14} />
      </button>
      <button class={s.iconBtn} onClick={onClose} title="关闭" aria-label="关闭搜索">
        <X size={14} />
      </button>
    </div>
  )
}
