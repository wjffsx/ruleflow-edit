import { h } from 'preact'
import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-preact'
import Fuse from 'fuse.js'

const containerStyle = {
  position: 'absolute',
  top: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 'var(--rf-z-popover, 300)',
  background: 'var(--rf-bg-elevated, #ffffff)',
  border: '1px solid var(--rf-border, #e5e7eb)',
  borderRadius: 'var(--rf-radius-lg, 8px)',
  boxShadow: 'var(--rf-shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--rf-space-2, 8px)',
  padding: '6px 10px',
  minWidth: 340,
  maxWidth: 480,
  animation: 'rf-fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
}

const inputStyle = {
  flex: 1,
  height: 28,
  padding: '0 var(--rf-space-2, 8px)',
  border: '1px solid var(--rf-border, #e5e7eb)',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  background: 'var(--rf-bg-secondary, #f3f4f6)',
  color: 'var(--rf-text-primary, #111827)',
  fontSize: 'var(--rf-text-sm, 11px)',
  fontFamily: 'var(--rf-font-sans, sans-serif)',
  outline: 'none',
  boxSizing: 'border-box',
}

const iconBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  border: 'none',
  background: 'transparent',
  color: 'var(--rf-text-tertiary, #9ca3af)',
  cursor: 'pointer',
  borderRadius: 'var(--rf-radius-sm, 4px)',
  padding: 0,
}

const resultCountStyle = {
  fontSize: 'var(--rf-text-2xs, 9px)',
  color: 'var(--rf-text-tertiary, #9ca3af)',
  whiteSpace: 'nowrap',
  minWidth: 40,
  textAlign: 'center',
}

export function NodeSearch({ nodes, onClose, onLocateNode }) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Build fuse search index from node data
  const fuse = useMemo(() => {
    if (!nodes || nodes.length === 0) return null
    return new Fuse(nodes, {
      keys: ['text.value', 'text', 'properties.nodeType', 'properties.summary', 'id'],
      threshold: 0.4,
    })
  }, [nodes])

  const results = useMemo(() => {
    if (!fuse || !query.trim()) return []
    return fuse.search(query).map(r => r.item)
  }, [query, fuse])

  const handleKeyDown = (e) => {
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

  const handleInput = (e) => {
    setQuery(e.target.value)
    setCurrentIndex(0)
    // Auto-locate first result
    if (results.length > 0 && fuse) {
      const newResults = fuse.search(e.target.value).map(r => r.item)
      if (newResults.length > 0) onLocateNode?.(newResults[0].id)
    }
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
    <div style={containerStyle} role="search" aria-label="搜索节点">
      <Search size={14} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        style={inputStyle}
        placeholder="搜索节点..."
        value={query}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        aria-label="搜索节点名称"
      />
      {query && results.length > 0 && (
        <span style={resultCountStyle}>
          {currentIndex + 1}/{results.length}
        </span>
      )}
      {query && results.length === 0 && (
        <span style={resultCountStyle}>无结果</span>
      )}
      <button style={iconBtnStyle} onClick={navigatePrev} title="上一个" aria-label="上一个匹配">
        <ChevronUp size={14} />
      </button>
      <button style={iconBtnStyle} onClick={navigateNext} title="下一个" aria-label="下一个匹配">
        <ChevronDown size={14} />
      </button>
      <button style={iconBtnStyle} onClick={onClose} title="关闭" aria-label="关闭搜索">
        <X size={14} />
      </button>
    </div>
  )
}
