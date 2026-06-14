import { h } from 'preact'
import { useState, useMemo } from 'preact/hooks'
import type { LucideIcon } from 'lucide-preact'
import { Search, Star, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-preact'
import type { NodeItem, NodeCategory, PortNode, SearchItem } from '../../types/editor'
import {
  sidebarCollapsed,
  toggleSidebar,
  toggleCategoryCollapse,
  isCategoryCollapsed,
} from '../../store'
import { NODE_CATEGORIES, PORT_NODES, NOTE_NODE, ICON_MAP } from '../../data'
import { searchService } from '../../services'
import { t } from '../../i18n'

/** Lucide 图标组件属性 */
interface LucideIconProps {
  /** 图标名称 */
  name: string
  /** 图标大小 */
  size?: number
  /** 自定义样式 */
  style?: Record<string, string | number>
  /** 图标颜色 */
  color?: string
}

function LucideIcon({ name, size = 14, style, color }: LucideIconProps) {
  const Icon: LucideIcon | undefined = ICON_MAP[name]
  if (!Icon) return <span style={{ fontSize: size, ...style }}>{name?.[0] || '?'}</span>
  return <Icon size={size} style={style} color={color} />
}

/** 侧栏项属性 */
interface SidebarItemProps {
  /** 节点项数据 */
  item: NodeItem
  /** 颜色 CSS 变量 */
  colorVar?: string
  /** Read-only mode — disables drag */
  readOnly?: boolean
}

function SidebarItem({ item, colorVar, readOnly }: SidebarItemProps) {
  return (
    <div
      class="flex items-center gap-[var(--rf-space-2)] py-[5px] pr-[var(--rf-space-3)] pl-[var(--rf-space-6)] text-[var(--rf-text-sm)] text-[var(--rf-text-primary)] cursor-grab transition-[background] duration-[var(--rf-duration-fast)]"
      draggable={!readOnly}
      onDragStart={(e: DragEvent) => {
        if (readOnly) return
        e.dataTransfer!.setData('application/ruleflow-node', JSON.stringify(item))
        e.dataTransfer!.effectAllowed = 'copy'
      }}
      role="treeitem"
      aria-label={item.name}
      tabIndex={0}
    >
      <LucideIcon
        name={item.icon}
        size={14}
        style={{ flexShrink: '0' }}
        color={`var(${colorVar || '--rf-brand-primary'})`}
      />
      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
      <div
        class="w-[3px] h-3 rounded-sm shrink-0"
        style={{ background: `var(${colorVar || '--rf-brand-primary'})` }}
      />
    </div>
  )
}

/** 分类区块属性 */
interface CategorySectionProps {
  /** 分类数据 */
  category: NodeCategory
}

function CategorySection({ category }: CategorySectionProps) {
  const collapsed = isCategoryCollapsed(category.id)
  const open = !collapsed

  return (
    <div>
      <div
        class="flex items-center gap-[var(--rf-space-2)] py-[var(--rf-space-2)] px-[var(--rf-space-3)] text-[var(--rf-text-xs)] font-semibold text-[var(--rf-text-secondary)] cursor-pointer select-none border-t border-[var(--rf-border-light)] hover:bg-[var(--rf-bg-hover)]"
        onClick={() => toggleCategoryCollapse(category.id)}
        role="treeitem"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <LucideIcon
          name={category.icon}
          size={12}
          style={{ flexShrink: '0' }}
          color={category.color}
        />
        <span style={{ flex: 1 }}>{category.name}</span>
        <span class="text-[var(--rf-text-xs)] text-[var(--rf-text-tertiary)]">
          {category.items.length}
        </span>
      </div>
      {open &&
        category.items.map((item: NodeItem) => (
          <SidebarItem
            key={item.type}
            item={item}
            colorVar={category.color?.replace('var(', '').replace(')', '') || '--rf-brand-primary'}
          />
        ))}
    </div>
  )
}

/** 侧栏组件 */
export function Sidebar({ readOnly = false }: { readOnly?: boolean } = {}) {
  const [query, setQuery] = useState('')
  const collapsed = sidebarCollapsed.value

  // Build flat list for search and update search service index
  useMemo(() => {
    const items: SearchItem[] = []
    NODE_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item: NodeItem) => {
        items.push({ ...item, category: cat.name, categoryIcon: cat.icon })
      })
    })
    PORT_NODES.forEach((item: PortNode) => {
      items.push({ ...item, category: '端口', categoryIcon: 'LogIn' })
    })
    items.push({ ...NOTE_NODE, category: '辅助', categoryIcon: 'MessageSquare' })
    // Update search service index
    searchService.updateSidebarItemIndex(items)
  }, [])

  const searchResults = useMemo(() => {
    if (!query.trim()) return null
    return searchService.searchSidebarItems(query)
  }, [query])

  if (collapsed) {
    return (
      <aside
        class="flex flex-col h-full bg-[var(--rf-bg-primary)] border-r border-[var(--rf-border)] overflow-hidden transition-[width] duration-[var(--rf-duration-normal)]"
        style={{ gridArea: 'sidebar', width: 'var(--sidebar-collapsed-width)' }}
        role="complementary"
        aria-label="组件面板"
      >
        <button
          onClick={toggleSidebar}
          class="flex items-center justify-center w-full h-12 border-none bg-transparent text-[var(--rf-text-tertiary)] cursor-pointer"
          title="展开侧栏"
          aria-label="展开侧栏"
        >
          <PanelLeft size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside
      class="flex flex-col h-full bg-[var(--rf-bg-primary)] border-r border-[var(--rf-border)] overflow-hidden transition-[width] duration-[var(--rf-duration-normal)]"
      style={{ gridArea: 'sidebar' }}
      role="complementary"
      aria-label="组件面板"
    >
      {/* Search */}
      <div class="p-[var(--rf-space-3)] border-b border-[var(--rf-border-light)]">
        <div class="flex items-center gap-1.5">
          <Search size={14} style={{ color: 'var(--rf-text-tertiary)', flexShrink: 0 }} />
          <input
            class="w-full h-[30px] px-[var(--rf-space-3)] border border-[var(--rf-border)] rounded-[var(--rf-radius-sm)] bg-[var(--rf-bg-secondary)] text-[var(--rf-text-primary)] text-[var(--rf-text-sm)] font-[var(--rf-font-sans)] outline-none box-border transition-[border-color] duration-[var(--rf-duration-fast)] focus:border-[var(--rf-brand-primary)] placeholder:text-[var(--rf-text-tertiary)]"
            placeholder={t('sidebar.search')}
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            aria-label={t('sidebar.search')}
          />
          <button
            onClick={toggleSidebar}
            class="flex items-center justify-center w-6 h-6 border-none bg-transparent text-[var(--rf-text-tertiary)] cursor-pointer rounded-[var(--rf-radius-sm)] shrink-0 hover:bg-[var(--rf-bg-hover)]"
            title="折叠侧栏"
            aria-label="折叠侧栏"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div class="flex-1 overflow-y-auto overflow-x-hidden py-[var(--rf-space-1)]">
        {/* Search results */}
        {searchResults ? (
          searchResults.length === 0 ? (
            <div class="py-[var(--rf-space-6)] px-[var(--rf-space-3)] text-center text-[var(--rf-text-tertiary)] text-[var(--rf-text-sm)]">
              {t('sidebar.noResults')}
            </div>
          ) : (
            searchResults.map((item: SearchItem) => (
              <SidebarItem key={item.type} item={item} readOnly={readOnly} />
            ))
          )
        ) : (
          <>
            {/* Port nodes */}
            <div class="flex items-center gap-[var(--rf-space-2)] py-[var(--rf-space-2)] px-[var(--rf-space-3)] text-[var(--rf-text-xs)] font-semibold text-[var(--rf-text-secondary)] cursor-pointer select-none uppercase tracking-wide">
              <Star size={12} style={{ color: 'var(--rf-brand-accent)' }} />
              {t('sidebar.favorites')}
            </div>
            {PORT_NODES.map((item: PortNode) => (
              <SidebarItem key={item.type} item={item} readOnly={readOnly} />
            ))}
            <SidebarItem item={NOTE_NODE} readOnly={readOnly} />

            {/* Category sections */}
            {NODE_CATEGORIES.map((cat: NodeCategory) => (
              <CategorySection key={cat.id} category={cat} />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}
